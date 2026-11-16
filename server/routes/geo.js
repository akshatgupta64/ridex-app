const express = require("express");
const router = express.Router();
const db = require("../db");
const { getRoadRoute, searchLocations } = require("../services/routing");

function parseCoordinate(value, limit) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return null;
  return parsed;
}

// 1. GET /api/geo/route - Calculate road path between coordinates
router.get("/route", async (req, res) => {
  const { startLat, startLon, endLat, endLon } = req.query;

  if (!startLat || !startLon || !endLat || !endLon) {
    return res.status(400).json({ error: "startLat, startLon, endLat, endLon are required" });
  }

  const start = [parseCoordinate(startLat, 90), parseCoordinate(startLon, 180)];
  const end = [parseCoordinate(endLat, 90), parseCoordinate(endLon, 180)];

  if (start.includes(null) || end.includes(null)) {
    return res.status(400).json({ error: "Coordinates are out of valid latitude/longitude bounds" });
  }

  const result = await getRoadRoute(start, end);
  res.json(result);
});

// 2. GET /api/geo/search - Live search points & landmarks
router.get("/search", async (req, res) => {
  const { q } = req.query;
  const query = typeof q === "string" ? q.slice(0, 120) : "";
  const results = await searchLocations(query);
  res.json({ results });
});

// 3. GET /api/geo/drivers - Get nearby drivers (public fields only, no PII)
router.get("/drivers", (req, res) => {
  const store = db.read();
  const drivers = (store.drivers || []).map((driver) => ({
    id: driver.id,
    name: driver.name,
    rating: driver.rating,
    trips: driver.trips,
    vehicleType: driver.vehicleType,
    model: driver.model,
    plateNumber: driver.plateNumber,
    avatar: driver.avatar,
    location: driver.location,
    status: driver.status
  }));
  res.json({ drivers });
});

module.exports = router;
