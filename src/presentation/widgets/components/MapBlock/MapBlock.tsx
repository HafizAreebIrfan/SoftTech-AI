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
  const fittedSignatureRef = useRef<string>("");
  const onSelectRef = useRef(onSelectRecord);
  onSelectRef.current = onSelectRecord;

  const getRecordKey = (rec: Record<string, any>, idx: number): string | number => {
    return rec.id ?? rec._id ?? rec.key ?? rec.$title ?? rec.title ?? rec.name ?? idx;
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [24.8607, 67.0011],
      zoom: 12,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: true,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      worldCopyJump: true,
    });

    // High-performance CartoDB Voyager tiles with extra buffering to prevent tile tearing on pan/zoom
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        minZoom: 2,
        maxZoom: 19,
        maxNativeZoom: 18,
        keepBuffer: 8,
        updateWhenZooming: false,
        updateWhenIdle: true,
        attribution:
          '&copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OSM</a>',
      },
    ).addTo(map);

    mapInstanceRef.current = map;

    // Handle container resizing with debouncing to prevent mid-drag tile tearing
    let prevWidth = 0;
    let prevHeight = 0;
    let resizeTimer: any = null;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (Math.abs(width - prevWidth) > 2 || Math.abs(height - prevHeight) > 2) {
          prevWidth = width;
          prevHeight = height;
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize({ debounceMoveend: true });
            }
          }, 120);
        }
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers & Fit Bounds (only when records set genuinely changes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Compute signature to avoid resetting bounds during drag/zoom/render
    const recordsSignature = records
      .map((r, i) => `${r.id ?? r._id ?? i}:${r.latitude ?? r.lat}:${r.longitude ?? r.lng}`)
      .join("|");

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
        onSelectRef.current?.(rec, idx);
      });

      marker.addTo(map);
      markersRef.current.set(key, marker);

      bounds.extend([coords.lat, coords.lng]);
      hasBounds = true;
    });

    // Only fit bounds ONCE per distinct record set (never mid-zoom or on selection change)
    if (hasBounds && fittedSignatureRef.current !== recordsSignature) {
      fittedSignatureRef.current = recordsSignature;
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [records]);

  // 3. Update Active Marker Styling & Smoothly Pan on Selection
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
        // Pan only if the marker is not already comfortably visible in the viewport
        if (!map.getBounds().pad(-0.1).contains(latLng)) {
          map.panTo(latLng, { animate: true, duration: 0.4 });
        }
      }
    });
  }, [selectedRecord]);

  return (
    <div className={styles.mapWrapper} style={{ height }}>
      <div ref={mapContainerRef} className={styles.leafletContainer} />
    </div>
  );
};
