const express = require("express");
const router = express.Router();
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");
const { initDatabase, getDatabaseStats } = require("../database");

// GET /api/database/status - Public or authenticated status check
router.get("/status", async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json({
      success: true,
      status: "CONNECTED",
      engine: stats.engine,
      sqlitePath: stats.sqlitePath,
      tables: stats.tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch database statistics", details: err.message });
  }
});

// POST /api/database/seed - Admin only seeder
router.post("/seed", authenticateToken, requireRole("admin"), async (req, res) => {
  try {
    process.env.SEED_DEMO_USERS = "true";
    await initDatabase();
    const stats = await getDatabaseStats();
    res.json({
      success: true,
      message: "Database seeded successfully",
      stats
    });
  } catch (err) {
    res.status(500).json({ error: "Database seeding failed", details: err.message });
  }
});

module.exports = router;
