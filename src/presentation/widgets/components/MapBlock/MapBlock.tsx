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
  apiKey?: string;
}

export const MapBlock: React.FC<MapBlockProps> = ({
  records = [],
  selectedRecord,
  onSelectRecord,
  height = "100%",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string | number, L.Marker>>(new Map());

  const getRecordKey = (rec: Record<string, any>, idx: number): string | number => {
    return rec.id ?? rec._id ?? rec.key ?? rec.title ?? idx;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24.8607, 67.0011],
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
    });

    // High-performance CartoDB Voyager / Dark Matter tiles (100% free, dark styled, zero API key needed)
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>',
      },
    ).addTo(map);

    mapInstanceRef.current = map;

    // Handle container resizing to prevent tile tearing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let hasBounds = false;

    records.forEach((rec, idx) => {
      const coords = extractCoordinates(rec, idx);
      if (!coords) return;

      const key = getRecordKey(rec, idx);
      const isSelected =
        selectedRecord && getRecordKey(selectedRecord, -1) === key;
      const priceText = formatMarkerPrice(rec) || "View";

      const customIcon = L.divIcon({
        className: "map-price-pin-wrapper",
        html: `<div class="price-pin ${isSelected ? "active" : ""}" data-key="${key}">
          <span class="pin-icon">&#128205;</span>
          <span class="pin-price">${priceText}</span>
          <div class="pin-arrow"></div>
        </div>`,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRecord?.(rec, idx);
      });

      marker.addTo(map);
      markersRef.current.set(key, marker);

      bounds.extend([coords.lat, coords.lng]);
      hasBounds = true;
    });

    if (hasBounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [records, onSelectRecord]);

  // 3. Update Active Marker Styling & Pan on Selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRecord) return;

    const selectedKey = getRecordKey(selectedRecord, -1);

    markersRef.current.forEach((marker, key) => {
      const isSelected = key === selectedKey;
      const el = marker.getElement();
      if (el) {
        const pinDiv = el.querySelector(".price-pin");
        if (pinDiv) {
          if (isSelected) {
            pinDiv.classList.add("active");
            marker.setZIndexOffset(1000);
          } else {
            pinDiv.classList.remove("active");
            marker.setZIndexOffset(0);
          }
        }
      }

      if (isSelected) {
        const latLng = marker.getLatLng();
        map.panTo(latLng, { animate: true, duration: 0.5 });
      }
    });
  }, [selectedRecord]);

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapContainerRef} className={styles.leafletContainer} />
    </div>
  );
};
