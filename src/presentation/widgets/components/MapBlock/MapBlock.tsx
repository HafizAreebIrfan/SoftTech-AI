import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "../../../../styles/mapblock.module.css";
import { extractCoordinates, formatMarkerPrice } from "../../helper/geoHelper";

interface MapBlockProps {
  records: Array<Record<string, any>>;
  selectedRecord?: Record<string, any> | null;
  onSelectRecord?: (record: Record<string, any>, index: number) => void;
  height?: string | number;
}

export const MapBlock: React.FC<MapBlockProps> = ({
  records = [],
  selectedRecord,
  onSelectRecord,
  height = "100%",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string | number, { marker: L.Marker; coords: { lat: number; lng: number } }>>(new Map());

  // Helper to get unique record key
  const getRecordKey = (rec: Record<string, any>, idx: number): string | number => {
    return rec.id ?? rec._id ?? rec.key ?? rec.title ?? idx;
  };

  // 1. Initialize Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    // Default Karachi coordinates if initial fitBounds takes a moment
    const map = L.map(mapContainerRef.current, {
      center: [24.8607, 67.0011],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // Sleek Pitch-Black CARTO Dark Matter Tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    leafletMapRef.current = map;

    // Resize observer to handle container size changes smoothly
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 2. Render Markers for all records
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(({ marker }) => {
      map.removeLayer(marker);
    });
    markersRef.current.clear();

    const bounds: L.LatLngExpression[] = [];

    records.forEach((rec, idx) => {
      const coords = extractCoordinates(rec, idx);
      if (!coords) return;

      const key = getRecordKey(rec, idx);
      const isSelected =
        selectedRecord && getRecordKey(selectedRecord, -1) === key;
      const priceText = formatMarkerPrice(rec) || "View";

      const html = `
        <div class="price-pin ${isSelected ? "active" : ""}" data-key="${key}">
          <span class="pin-icon">📍</span>
          <span class="pin-price">${priceText}</span>
          <div class="pin-arrow"></div>
        </div>
      `;

      const divIcon = L.divIcon({
        className: "map-price-pin-wrapper",
        html,
        iconSize: [84, 28],
        iconAnchor: [42, 28],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: divIcon });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRecord?.(rec, idx);
      });

      marker.addTo(map);
      markersRef.current.set(key, { marker, coords });
      bounds.push([coords.lat, coords.lng]);
    });

    // Auto-fit map to show all items nicely
    if (bounds.length > 0) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [records, onSelectRecord]);

  // 3. Update active marker pin state and pan to selected item
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !selectedRecord) return;

    const selectedKey = getRecordKey(selectedRecord, -1);

    markersRef.current.forEach(({ marker, coords }, key) => {
      const isSelected = key === selectedKey;
      const iconEl = marker.getElement();
      if (iconEl) {
        const pinEl = iconEl.querySelector(".price-pin");
        if (pinEl) {
          if (isSelected) {
            pinEl.classList.add("active");
            marker.setZIndexOffset(10000);
          } else {
            pinEl.classList.remove("active");
            marker.setZIndexOffset(0);
          }
        }
      }

      if (isSelected) {
        map.panTo([coords.lat, coords.lng], {
          animate: true,
          duration: 0.6,
        });
      }
    });
  }, [selectedRecord]);

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapContainerRef} className={styles.leafletContainer} />
    </div>
  );
};
