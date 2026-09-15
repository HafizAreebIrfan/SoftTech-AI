import React, { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import styles from "../../../../styles/mapblock.module.css";
import { extractCoordinates, formatMarkerPrice } from "../../helper/geoHelper";

interface MapBlockProps {
  records: Array<Record<string, any>>;
  selectedRecord?: Record<string, any> | null;
  onSelectRecord?: (record: Record<string, any>, index: number) => void;
  height?: string | number;
  apiKey?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const DARK_MAP_STYLES: any[] = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5af" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export const MapBlock: React.FC<MapBlockProps> = ({
  records = [],
  selectedRecord,
  onSelectRecord,
  height = "100%",
  apiKey: propApiKey,
}) => {
  const apiKey =
    propApiKey ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    (typeof window !== "undefined"
      ? (window as any).__WIDGET_METADATA__?.googleMapsApiKey ||
        (window as any).VITE_GOOGLE_MAPS_API_KEY
      : "");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string | number, { overlay: any; coords: any }>>(new Map());
  const loaderRef = useRef<Loader | null>(null);

  const getRecordKey = (rec: Record<string, any>, idx: number): string | number => {
    return rec.id ?? rec._id ?? rec.key ?? rec.title ?? idx;
  };

  // 1. Initialize Google Maps
  useEffect(() => {
    if (!mapContainerRef.current || !apiKey || googleMapRef.current) return;

    const initMap = async () => {
      if (!loaderRef.current) {
        loaderRef.current = new Loader({ apiKey, version: "weekly", libraries: ["maps", "marker"] });
      }
      const google = await loaderRef.current.load();
      if (!mapContainerRef.current) return;

      googleMapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 24.8607, lng: 67.0011 },
        zoom: 12,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: DARK_MAP_STYLES,
      });
    };

    initMap();

    return () => {
      overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
      overlaysRef.current.clear();
      googleMapRef.current = null;
    };
  }, [apiKey]);

  // 2. Render markers
  useEffect(() => {
    const map = googleMapRef.current;
    const google = window.google;
    if (!map || !google) return;

    overlaysRef.current.forEach(({ overlay }) => overlay.setMap(null));
    overlaysRef.current.clear();

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    records.forEach((rec, idx) => {
      const coords = extractCoordinates(rec, idx);
      if (!coords) return;

      const key = getRecordKey(rec, idx);
      const isSelected = selectedRecord && getRecordKey(selectedRecord, -1) === key;
      const priceText = formatMarkerPrice(rec) || "View";
      const latLng = new google.maps.LatLng(coords.lat, coords.lng);

      const overlay = new google.maps.OverlayView();
      overlay.onAdd = function () {
        const div = document.createElement("div");
        div.className = "price-pin" + (isSelected ? " active" : "");
        div.setAttribute("data-key", String(key));
        div.innerHTML = `<span class="pin-icon">&#128205;</span><span class="pin-price">${priceText}</span><div class="pin-arrow"></div>`;
        div.style.cursor = "pointer";
        div.addEventListener("click", (e) => { e.stopPropagation(); onSelectRecord?.(rec, idx); });
        (this as any).div_ = div;
        (this as any).getPane()!.appendChild(div);
      };
      overlay.draw = function () {
        const div = (this as any).div_ as HTMLElement;
        if (!div) return;
        const pos = this.getProjection()?.fromLatLngToDivPixel(latLng);
        if (pos) {
          div.style.left = pos.x - 42 + "px";
          div.style.top = pos.y - 28 + "px";
          div.style.position = "absolute";
        }
      };
      overlay.onRemove = function () {
        const div = (this as any).div_ as HTMLElement;
        if (div?.parentNode) div.parentNode.removeChild(div);
      };

      overlay.setMap(map);
      overlaysRef.current.set(key, { overlay, coords: latLng });
      bounds.extend(latLng);
      hasBounds = true;
    });

    if (hasBounds) map.fitBounds(bounds, 50);
  }, [records, onSelectRecord]);

  // 3. Update active marker + pan
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !selectedRecord) return;
    const selectedKey = getRecordKey(selectedRecord, -1);

    overlaysRef.current.forEach(({ overlay, coords }, key) => {
      const div = (overlay as any).div_ as HTMLElement | undefined;
      if (!div) return;
      const pinEl = div.querySelector(".price-pin");
      if (pinEl) {
        if (key === selectedKey) { pinEl.classList.add("active"); div.style.zIndex = "10000"; }
        else { pinEl.classList.remove("active"); div.style.zIndex = "1"; }
      }
      if (key === selectedKey) map.panTo(coords);
    });
  }, [selectedRecord]);

  if (!apiKey) {
    return (
      <div
        className={styles.mapWrapper}
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#121316",
          color: "#9ca3af",
          fontSize: 12,
          flexDirection: "column",
          gap: 6,
          padding: 16,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 24 }}>🗺️</span>
        <span style={{ fontWeight: 600, color: "#e2e8f0" }}>Interactive Map</span>
        <span style={{ color: "#64748b", fontSize: 11 }}>
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in environment to activate live map tiles & pins.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapContainerRef} className={styles.leafletContainer} />
    </div>
  );
};
