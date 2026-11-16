import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet icons missing in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createPinIcon = (color, text, iconEmoji) => {
  return L.divIcon({
    className: "custom-map-pin",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: ${color};
          color: #111;
          font-weight: 700;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          white-space: nowrap;
          border: 2px solid #fff;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>${iconEmoji}</span>
          <span>${text}</span>
        </div>
        <div style="
          width: 0; 
          height: 0; 
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>
        <div style="
          width: 10px;
          height: 10px;
          background: ${color};
          border-radius: 50%;
          border: 2px solid #fff;
          margin-top: -3px;
          box-shadow: 0 0 8px ${color};
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const createVehicleIcon = (emoji, isCurrent = false) => {
  return L.divIcon({
    className: "custom-vehicle-pin",
    html: `
      <div style="
        width: ${isCurrent ? "44px" : "34px"};
        height: ${isCurrent ? "44px" : "34px"};
        background: ${isCurrent ? "#f9c935" : "#ffffff"};
        border: ${isCurrent ? "3px solid #111" : "2px solid #555"};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${isCurrent ? "22px" : "16px"};
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
        transition: all 0.3s ease;
        animation: ${isCurrent ? "pulseGlow 2s infinite" : "none"};
      ">
        ${emoji}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

const InteractiveMap = ({
  centerCoords,
  pickup,
  drop,
  nearbyDrivers = [],
  assignedCaptainCoords,
  vehicleType = "bike",
  onMapClick,
  rideStatus,
  routeWaypoints
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const polylineRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: centerCoords || [12.9716, 77.5946],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      markersGroupRef.current = L.featureGroup().addTo(map);

      map.on("click", (e) => {
        if (onMapClick) {
          onMapClick([e.latlng.lat, e.latlng.lng]);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when centerCoords changes
  useEffect(() => {
    if (mapInstanceRef.current && centerCoords && !pickup && !drop) {
      mapInstanceRef.current.setView(centerCoords, 14, { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerCoords]);

  // Update markers, route, and bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = markersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const pointsToFit = [];

    // 1. Pickup Marker
    if (pickup && pickup.coords) {
      const pickupMarker = L.marker(pickup.coords, {
        icon: createPinIcon("#00c853", "Pickup: " + pickup.name.slice(0, 15), "📍")
      });
      pickupMarker.bindTooltip("Pickup: " + pickup.name, { direction: "top" });
      group.addLayer(pickupMarker);
      pointsToFit.push(pickup.coords);
    }

    // 2. Drop Marker
    if (drop && drop.coords) {
      const dropMarker = L.marker(drop.coords, {
        icon: createPinIcon("#f9c935", "Drop: " + drop.name.slice(0, 15), "🏁")
      });
      dropMarker.bindTooltip("Drop: " + drop.name, { direction: "top" });
      group.addLayer(dropMarker);
      pointsToFit.push(drop.coords);
    }

    // 3. Assigned Captain Marker (when ride is booked/active)
    if (assignedCaptainCoords) {
      const emoji = vehicleType === "auto" ? "🛺" : vehicleType === "cab_economy" ? "🚗" : vehicleType === "parcel" ? "📦" : "🛵";
      const captainMarker = L.marker(assignedCaptainCoords, {
        icon: createVehicleIcon(emoji, true),
        zIndexOffset: 1000
      });
      captainMarker.bindTooltip(`Captain en route: ${rideStatus || "Active"}`, { permanent: true, direction: "top", offset: [0, -25] });
      group.addLayer(captainMarker);
      pointsToFit.push(assignedCaptainCoords);
    } else {
      // 4. Ambient nearby drivers (when not yet booked)
      if (nearbyDrivers && nearbyDrivers.length > 0) {
        nearbyDrivers.forEach((driver) => {
          const emoji = driver.type === "auto" ? "🛺" : driver.type === "cab_economy" ? "🚗" : "🛵";
          const marker = L.marker(driver.coords, {
            icon: createVehicleIcon(emoji, false)
          });
          group.addLayer(marker);
        });
      }
    }

    // 5. Route Polyline
    if (pickup && drop && pickup.coords && drop.coords) {
      const [pLat, pLng] = pickup.coords;
      const [dLat, dLng] = drop.coords;

      let waypointsToDraw = routeWaypoints;
      if (!waypointsToDraw || waypointsToDraw.length < 2) {
        // Fallback curve
        const midLat = (pLat + dLat) / 2 + (pLng - dLng) * 0.08;
        const midLng = (pLng + dLng) / 2 + (dLat - pLat) * 0.08;
        waypointsToDraw = [
          [pLat, pLng],
          [pLat * 0.65 + midLat * 0.35, pLng * 0.65 + midLng * 0.35],
          [midLat, midLng],
          [midLat * 0.35 + dLat * 0.65, midLng * 0.35 + dLng * 0.65],
          [dLat, dLng]
        ];
      }

      const routeLine = L.polyline(waypointsToDraw, {
        color: "#18181b",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
        dashArray: rideStatus === "in_progress" ? "10, 10" : undefined
      }).addTo(map);

      const outlineLine = L.polyline(waypointsToDraw, {
        color: "#f9c935",
        weight: 10,
        opacity: 0.5,
        lineCap: "round"
      }).addTo(map);

      polylineRef.current = L.featureGroup([outlineLine, routeLine]).addTo(map);
    }

    // Fit bounds if we have points
    if (pointsToFit.length >= 2) {
      map.fitBounds(pointsToFit, { padding: [60, 60], maxZoom: 16, animate: true });
    } else if (pointsToFit.length === 1) {
      map.setView(pointsToFit[0], 15, { animate: true });
    }
  }, [pickup, drop, nearbyDrivers, assignedCaptainCoords, vehicleType, rideStatus, routeWaypoints]);

  return (
    <div className="interactive-map-wrapper position-relative w-100 h-100">
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", minHeight: "380px" }}
        className="map-element"
      />
      <div className="map-badge-overlay position-absolute top-0 start-0 m-3 z-3 bg-white px-3 py-1 rounded-pill shadow-sm d-flex align-items-center gap-2 border">
        <span className="live-dot"></span>
        <small className="fw-semibold text-dark">Live Rapido Radar</small>
      </div>
    </div>
  );
};

export default InteractiveMap;
