import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import styles from "../../../styles/mapcataloglayout.module.css";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { MapBlock } from "../components/MapBlock/MapBlock";
import { MapCardCarousel } from "../components/MapBlock/MapCardCarousel";
import { CardsBlock } from "../components/CardsBlock";
import { DetailBlock } from "../components/DetailBlock";
import { enrichRecordViaDetailTool } from "../helper/detailEnrichment";
import { requestDisplayMode } from "../../../utils/mcpBridge";

export const MapCatalogLayout: React.FC<WidgetLayoutProps> = ({
  title = "Results based on your search",
  subtitle,
  records = [],
  fields = [],
  collection,
  capabilities,
  actions = [],
  audience,
  presentationPlan,
}) => {
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  // Map "full map + floating detail": tapping a card opens the item detail as a
  // panel docked over a fullscreen map — the map stays put and the bottom card
  // strip switches cars. (Grid view keeps its own tap → sub-view flow.)
  const [detailRecord, setDetailRecord] = useState<Record<string, any> | null>(
    null,
  );
  // Frozen px height for the docked (fullscreen) map stage. The host can
  // resize the widget iframe at ANY time (fullscreen grant, collapse back to
  // inline, chat reflow) and the Apps SDK gives the app NO notification when
  // the HOST changes the display mode — only the app can request it. A CSS
  // `100vh` stage chases that moving iframe (`vh` re-evaluates as the host
  // grows the sandbox to fit content → content grows again → infinite chat
  // height). Freezing the stage height in px at dock time, measured from the
  // iframe's own viewport, breaks the feedback loop: the stage stays exactly
  // as tall as the granted fullscreen while docked, whatever the host does.
  const [dockedStageHeight, setDockedStageHeight] = useState<number | null>(
    null,
  );
  const enrichSeqRef = useRef(0);

  const typedRecords = useMemo(
    () => (Array.isArray(records) ? (records as Array<Record<string, any>>) : []),
    [records],
  );

  // When viewing a single location that contains an inventory of items (e.g. products, items, inventory),
  // unroll the child items so the map peek carousel and cards grid display the available items.
  const isLocationWithNestedItems = useMemo(() => {
    if (typedRecords.length !== 1) return false;
    const rec = typedRecords[0];
    if (!rec || typeof rec !== "object") return false;
    for (const [key, val] of Object.entries(rec)) {
      if (
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] === "object" &&
        val[0] !== null &&
        !["bookings", "reviews", "features", "amenities", "images", "photos", "fields", "specifications"].includes(key)
      ) {
        return true;
      }
    }
    return false;
  }, [typedRecords]);

  const unpackedLocationItems = useMemo(() => {
    if (!isLocationWithNestedItems) return null;
    const loc = typedRecords[0];
    let rawItems: any[] = [];
    for (const [key, val] of Object.entries(loc)) {
      if (
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] === "object" &&
        val[0] !== null &&
        !["bookings", "reviews", "features", "amenities", "images", "photos", "fields", "specifications"].includes(key)
      ) {
        rawItems = val;
        break;
      }
    }

    return rawItems.map((item, idx) => {
      const titleCandidate =
        item.$title ||
        item.title ||
        item.name ||
        (item.make && item.model ? `${item.make} ${item.model}`.trim() : "") ||
        `Option ${idx + 1}`;
      const priceCandidate =
        item.$price ?? item.price ?? item.pricePerDay ?? item.dailyRate ?? item.rate ?? item.cost;
      const imageCandidate =
        item.$image || item.image || item.thumbnail || item.photo || (Array.isArray(item.images) ? item.images[0] : null);

      return {
        ...item,
        id: item.id || `${loc.id || "loc"}-item-${idx}`,
        latitude: item.latitude ?? loc.latitude,
        longitude: item.longitude ?? loc.longitude,
        city: item.city ?? loc.city,
        locationName: item.locationName ?? loc.name,
        locationId: loc.id,
        $title: titleCandidate,
        $price: priceCandidate,
        $image: imageCandidate,
      };
    });
  }, [isLocationWithNestedItems, typedRecords]);

  const effectiveRecords = unpackedLocationItems || typedRecords;
  const filteredRecords = effectiveRecords;

  const selectedRecord: Record<string, any> | null =
    filteredRecords[selectedIndex] || filteredRecords[0] || null;

  const displayTitle = useMemo(() => {
    if (isLocationWithNestedItems && typedRecords[0]?.name) {
      return `${typedRecords[0].name} · Available Options`;
    }
    return title;
  }, [isLocationWithNestedItems, typedRecords, title]);

  // Derive a human-friendly search context (dates / guests / location) without
  // any entity- or industry-specific assumptions.
  const derivedSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    if (isLocationWithNestedItems && typedRecords[0]) {
      const loc = typedRecords[0];
      const count = filteredRecords.length;
      const addr = loc.address || loc.city || "";
      return `${count} available option${count === 1 ? "" : "s"}${addr ? ` · ${addr}` : ""}`;
    }
    const q = collection?.appliedQuery;
    const parts: string[] = [];
    if (q?.datefrom && q?.dateto) {
      parts.push(`${q.datefrom} – ${q.dateto}`);
    } else if (q?.startDate && q?.endDate) {
      parts.push(`${q.startDate} – ${q.endDate}`);
    } else if (q?.checkin && q?.checkout) {
      parts.push(`${q.checkin} – ${q.checkout}`);
    } else if (selectedRecord?.dates) {
      parts.push(String(selectedRecord.dates));
    }
    if (q?.adults || q?.guests) {
      parts.push(`${q.adults || q.guests} guests`);
    } else if (q?.city || selectedRecord?.location?.city) {
      parts.push(String(q?.city || selectedRecord?.location?.city));
    } else if (selectedRecord?.location?.name) {
      parts.push(String(selectedRecord.location.name));
    }
    if (parts.length > 0) return parts.join(" · ");
    return `${filteredRecords.length} available`;
  }, [subtitle, isLocationWithNestedItems, typedRecords, collection, selectedRecord, filteredRecords.length]);

  // Open (or swap) the docked detail panel for a card. Opens instantly with the
  // summary record + requests the fullscreen map, then enriches via the shared
  // get-by-id helper. A sequence guard ignores stale enrichments when swapped fast.
  const openDetailFor = useCallback(
    (rec: Record<string, any>, idx: number) => {
      setSelectedIndex(idx);
      setDetailRecord(rec);
      setDockedStageHeight((cur) => cur ?? Math.max(window.innerHeight, 560));
      requestDisplayMode("fullscreen");
      const seq = ++enrichSeqRef.current;
      enrichRecordViaDetailTool(rec, actions, collection)
        .then((enriched) => {
          if (enrichSeqRef.current === seq) {
            setDetailRecord((cur) => (cur ? enriched : cur));
          }
        })
        .catch(() => {});
    },
    [actions, collection],
  );

  const closeDetail = useCallback(() => {
    enrichSeqRef.current++; // invalidate any in-flight enrichment
    setDetailRecord(null);
    setDockedStageHeight(null);
    requestDisplayMode("inline");
  }, []);

  // Watch for true host collapses to restore inline display mode.
  useEffect(() => {
    if (!detailRecord) return;

    const onResize = () => {
      const vh = window.innerHeight;
      // Only restore inline if the iframe truly collapsed to inline widget height (< 380px)
      if (vh < 380) {
        closeDetail();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [detailRecord, closeDetail]);

  // Map marker / carousel arrow → highlight + auto-center.
  const handleSelectRecord = useCallback(
    (rec: Record<string, any>, idx: number) => {
      if (detailRecord) {
        openDetailFor(rec, idx);
      } else {
        setSelectedIndex(idx);
      }
    },
    [detailRecord, openDetailFor],
  );

  // Card tap → open / replace the docked detail panel over the map.
  const handleOpenFullDetail = useCallback(
    (rec: Record<string, any>, idx: number) => {
      openDetailFor(rec, idx);
    },
    [openDetailFor],
  );

  const isMapOnly = Boolean(
    (window as any).__WIDGET_METADATA__?.mapOnly ||
    ((window as any).__WIDGET_METADATA__?.uiEnabled === false &&
      (window as any).__WIDGET_METADATA__?.mapEnabled === true)
  );

  // Leaving the map for the grid closes the docked detail + restores inline.
  const showGrid = () => {
    if (isMapOnly) return;
    if (detailRecord) closeDetail();
    setViewMode("grid");
  };

  useEffect(() => {
    if (isMapOnly && viewMode !== "map") {
      setViewMode("map");
    }
  }, [isMapOnly, viewMode]);

  return (
    <div className={styles.layoutContainer}>
      {/* Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitleCol}>
          <h2 className={styles.mainTitle}>{displayTitle}</h2>
          <p className={styles.subTitle}>
            <span>📍</span>
            <span>{derivedSubtitle}</span>
          </p>
        </div>

        {!isMapOnly && (
          <div className={styles.headerActionsRow}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "map" ? styles.viewToggleBtnActive : ""}`}
              onClick={() => setViewMode("map")}
              title="Switch to Map View"
            >
              <span>🗺️</span>
              <span>Map</span>
            </button>

            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
              onClick={showGrid}
              title="Switch to Cards Grid View"
            >
              <span>⊞</span>
              <span>Grid</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === "grid" ? (
        /* VIEW MODE 1: Standard Cards Grid */
        <CardsBlock
          block={presentationPlan?.blocks?.find((b) => b.type === "cards")}
          records={effectiveRecords}
          fields={fields}
          collection={collection}
          capabilities={capabilities}
          actions={actions}
          audience={audience}
        />
      ) : (
        /* VIEW MODE 2: Full-bleed map with a floating peek carousel. Tapping a
           card docks its detail panel over the map (fullscreen). */
        <div
          className={`${styles.mapStage} ${detailRecord ? styles.mapStageDetailOpen : ""}`}
          style={
            detailRecord && dockedStageHeight
              ? { height: `${dockedStageHeight}px` }
              : undefined
          }
        >
          <MapBlock
            records={filteredRecords}
            selectedRecord={selectedRecord}
            onSelectRecord={handleSelectRecord}
            height="100%"
            apiKey={
              import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
              (typeof window !== "undefined"
                ? (window as any).__WIDGET_METADATA__?.googleMapsApiKey ||
                  (window as any).VITE_GOOGLE_MAPS_API_KEY
                : undefined)
            }
          />

          {detailRecord && (
            <div className={styles.mapDetailDock}>
              <DetailBlock
                key={String(detailRecord.id ?? detailRecord._id ?? "dock")}
                records={[detailRecord]}
                fields={fields}
                collection={collection}
                actions={actions}
                audience={audience}
                onBack={closeDetail}
                variant="mapDock"
              />
            </div>
          )}

          <MapCardCarousel
            records={filteredRecords}
            fields={fields}
            actions={actions}
            selectedIndex={selectedIndex}
            onSelect={handleSelectRecord}
            onOpenDetail={handleOpenFullDetail}
          />
        </div>
      )}
    </div>
  );
};
