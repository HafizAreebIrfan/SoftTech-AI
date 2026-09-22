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

  // When viewing a single location that contains an inventory of items (e.g. cars, products),
  // unroll the child items so the map peek carousel and cards grid display the available items.
  const isLocationWithNestedItems = useMemo(() => {
    if (typedRecords.length !== 1) return false;
    const rec = typedRecords[0];
    const items =
      rec?.cars ||
      rec?.products ||
      rec?.items ||
      rec?.vehicles ||
      rec?.inventory ||
      rec?.fleet;
    return Array.isArray(items) && items.length > 0;
  }, [typedRecords]);

  const unpackedLocationItems = useMemo(() => {
    if (!isLocationWithNestedItems) return null;
    const loc = typedRecords[0];
    const rawItems: any[] =
      loc.cars ||
      loc.products ||
      loc.items ||
      loc.vehicles ||
      loc.inventory ||
      loc.fleet ||
      [];

    return rawItems.map((item, idx) => ({
      ...item,
      id: item.id || `${loc.id || "loc"}-item-${idx}`,
      latitude: item.latitude ?? loc.latitude,
      longitude: item.longitude ?? loc.longitude,
      city: item.city ?? loc.city,
      locationName: item.locationName ?? loc.name,
      locationId: loc.id,
      $title:
        item.$title ||
        (item.make && item.model ? `${item.make} ${item.model}` : item.name || item.title || `Option ${idx + 1}`),
      $price: item.$price || item.dailyRate || item.price,
      $image: item.$image || item.image || item.thumbnail,
    }));
  }, [isLocationWithNestedItems, typedRecords]);

  const effectiveRecords = unpackedLocationItems || typedRecords;

  // Client-side relevance trim: when the backend hands the widget a padded set
  // (e.g. every city after a search-recovery fallback), narrow it to what the
  // user actually asked for. Tokens come from the user prompt + inferred intent
  // (carried in the widget metadata), NOT from appliedQuery (which often only
  // holds pagination). A token only filters when it PARTITIONS the set — it
  // matches some records but not all — exactly like the backend's relevance
  // filter. Keys off value shape only; no entity/company/industry names.
  const filteredRecords = useMemo(() => {
    if (effectiveRecords.length < 2) return effectiveRecords;

    const meta = (window as any).__WIDGET_METADATA__ || {};
    const promptText = `${meta.user_raw_prompt || ""} ${
      meta.inferred_intent || ""
    }`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ");

    if (!promptText.trim()) return effectiveRecords;

    // Entity noun describes the whole set, never a filter token.
    const entityWords = new Set<string>();
    const entity = String(collection?.entity || "").toLowerCase();
    for (const w of entity.split(/\s+/).filter(Boolean)) entityWords.add(w);

    // The app-mention tag ("@Car Rental Pro And Studio") is not a filter —
    // strip tokens that appear in the company name.
    const companyName = String(
      meta.companyName || meta.company_name || "",
    ).toLowerCase();
    const companyWords = new Set(
      companyName.split(/[^a-z0-9]+/).filter(Boolean),
    );

    const DATE_WORDS = new Set([
      "available", "availability", "show", "list", "cars", "find",
      "today", "tomorrow", "date", "dates", "night", "nights", "any",
      "all", "give", "want", "need", "get", "from", "and", "the", "for",
      "with", "near", "me", "around", "please", "book", "booking",
      "rent", "rental", "rentals", "per", "day", "week", "month",
      "cheap", "under", "over", "between", "next", "this", "that",
    ]);

    const tokens = Array.from(
      new Set(
        promptText
          .split(/\s+/)
          .map((t) => t.trim())
          .filter((t) => t.length >= 3 && t.length <= 20)
          .filter((t) => !DATE_WORDS.has(t))
          .filter((t) => !entityWords.has(t))
          .filter((t) => !companyWords.has(t)),
      ),
    );
    if (tokens.length === 0) return typedRecords;

    const recordMatchesToken = (
      rec: Record<string, any>,
      token: string,
    ): boolean => {
      const check = (val: unknown): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === "string" || typeof val === "number")
          return String(val).toLowerCase().includes(token);
        return false;
      };
      // Top-level string/number fields (make, model, name, category, …) and
      // one-level-nested objects (location.city, …). Arrays are skipped
      // (features lists would false-positive on incidental matches).
      for (const v of Object.values(rec)) {
        if (typeof v === "string" || typeof v === "number") {
          if (check(v)) return true;
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          for (const inner of Object.values(v as Record<string, unknown>)) {
            if (check(inner)) return true;
          }
        }
      }
      return false;
    };

    // Keep only tokens that PARTITION the set (match some, not all).
    const discriminators = tokens.filter((token) => {
      let count = 0;
      for (const rec of typedRecords)
        if (recordMatchesToken(rec, token)) count++;
      return count >= 1 && count < typedRecords.length;
    });
    if (discriminators.length === 0) return effectiveRecords;

    const filtered = effectiveRecords.filter((rec) =>
      discriminators.every((token) => recordMatchesToken(rec, token)),
    );
    if (filtered.length === 0 || filtered.length === effectiveRecords.length) {
      return effectiveRecords;
    }
    return filtered;
  }, [effectiveRecords, collection?.entity]);

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
  // get-by-id helper (identical to the grid) so booking / date data shows here
  // too. A sequence guard ignores stale enrichments when cars are switched fast.
  const openDetailFor = (rec: Record<string, any>, idx: number) => {
    setSelectedIndex(idx);
    setDetailRecord(rec);
    // Freeze the stage height NOW — before requesting fullscreen — so it is
    // the height the host actually granted. Re-opens while already docked keep
    // the existing freeze (no reflow churn when swapping cars).
    setDockedStageHeight((cur) => cur ?? Math.max(window.innerHeight, 520));
    requestDisplayMode("fullscreen");
    const seq = ++enrichSeqRef.current;
    enrichRecordViaDetailTool(rec, actions, collection)
      .then((enriched) => {
        if (enrichSeqRef.current === seq) {
          setDetailRecord((cur) => (cur ? enriched : cur));
        }
      })
      .catch(() => {});
  };

  const closeDetail = useCallback(() => {
    enrichSeqRef.current++; // invalidate any in-flight enrichment
    setDetailRecord(null);
    setDockedStageHeight(null);
    requestDisplayMode("inline");
  }, []);

  // The host (ChatGPT) can collapse the fullscreen widget at any time without
  // notifying the app. Detect it heuristically: while docked, watch the
  // iframe's own viewport height. The host grants fullscreen by making the
  // iframe tall; collapsing restores a small inline iframe. A large DROP from
  // the frozen dock height means the host exited fullscreen — restore the
  // pre-fullscreen map position (close the dock, back to inline) exactly like
  // the Back button does. The 0.6 threshold makes normal host-side resizes
  // (scrollbar, minor reflow) harmless.
  useEffect(() => {
    if (!detailRecord) return;
    const frozen = dockedStageHeight ?? 0;
    if (!frozen) return;

    const onResize = () => {
      const vh = window.innerHeight;
      if (vh < frozen * 0.6 && vh < frozen - 160) {
        closeDetail();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [detailRecord, dockedStageHeight, closeDetail]);

  // Map marker / carousel arrow → highlight + auto-center. If the detail panel
  // is already open, follow the selection (swap the panel to the new item).
  const handleSelectRecord = (rec: Record<string, any>, idx: number) => {
    if (detailRecord) {
      openDetailFor(rec, idx);
    } else {
      setSelectedIndex(idx);
    }
  };

  // Card tap → open / replace the docked detail panel over the map.
  const handleOpenFullDetail = (rec: Record<string, any>, idx: number) => {
    openDetailFor(rec, idx);
  };

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
