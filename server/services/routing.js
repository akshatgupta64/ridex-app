const http = require("http");
const https = require("https");

// Great-circle Haversine distance in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1.0, +(R * c).toFixed(2));
}

// Generate smooth road-like waypoints as a high-fidelity fallback
function generateRoadWaypoints(start, end, numPoints = 25) {
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;
  const points = [];

  const midLat = (lat1 + lat2) / 2 + (lon2 - lon1) * 0.08;
  const midLon = (lon1 + lon2) / 2 + (lat1 - lat2) * 0.08;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic bezier curve simulation
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lon = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * midLon + t * t * lon2;
    points.push([+lat.toFixed(5), +lon.toFixed(5)]);
  }
  return points;
}

// Fetch real road routing via OSRM (OpenStreetMap Routing Engine)
async function getRoadRoute(startCoords, endCoords) {
  const [lat1, lon1] = startCoords;
  const [lat2, lon2] = endCoords;

  const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 3500 }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            const data = JSON.parse(body);
            if (data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const distanceKm = +(route.distance / 1000).toFixed(2);
              const durationMins = Math.max(4, Math.round(route.duration / 60));
              // OSRM returns [lon, lat], Leaflet needs [lat, lon]
              const waypoints = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

              return resolve({
                success: true,
                source: "OSRM_ROAD_NETWORK",
                distanceKm,
                durationMins,
                waypoints
              });
            }
          }
        } catch (e) {
          // Fall through to resilient fallback
        }
        resolveFallback();
      });
    });

    req.on("error", () => resolveFallback());
    req.on("timeout", () => {
      req.destroy();
      resolveFallback();
    });

    function resolveFallback() {
      const distanceKm = haversineDistance(lat1, lon1, lat2, lon2);
      const durationMins = Math.max(5, Math.round((distanceKm / 28) * 60));
      const waypoints = generateRoadWaypoints(startCoords, endCoords, 30);

      resolve({
        success: true,
        source: "GEOMETRIC_ROAD_MODEL",
        distanceKm,
        durationMins,
        waypoints
      });
    }
  });
}

// Real Geocoding / Location Search using Nominatim OpenStreetMap
async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const encoded = encodeURIComponent(query + ", India");
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=6`;

  return new Promise((resolve) => {
    const options = {
      headers: {
        "User-Agent": "RapidoSystemDesignProject/1.0"
      },
      timeout: 3000
    };

    const req = https.get(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode === 200) {
            const data = JSON.parse(body);
            const results = data.map((item) => ({
              name: item.display_name.split(",")[0],
              address: item.display_name,
              coords: [+item.lat, +item.lon]
            }));
            return resolve(results);
          }
        } catch (e) {}
        resolve([]);
      });
    });

    req.on("error", () => resolve([]));
    req.on("timeout", () => {
      req.destroy();
      resolve([]);
    });
  });
}

module.exports = {
  haversineDistance,
  getRoadRoute,
  searchLocations
};
