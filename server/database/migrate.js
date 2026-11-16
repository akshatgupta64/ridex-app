const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const { initDatabase, getDatabaseStats } = require("./index");

async function run() {
  console.log("==========================================");
  console.log("📦 Running RideX Relational Database Migration");
  console.log("==========================================");
  try {
    await initDatabase();
    const stats = await getDatabaseStats();
    console.log("✅ Schema migrated successfully!");
    console.log("Database Engine:", stats.engine);
    if (stats.sqlitePath) {
      console.log("SQLite Path:    ", stats.sqlitePath);
    }
    console.log("Current Table Stats:", stats.tables);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
