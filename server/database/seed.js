const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const { initDatabase, getDatabaseStats } = require("./index");

async function run() {
  console.log("==========================================");
  console.log("🌱 Seeding RideX Relational Database");
  console.log("==========================================");
  try {
    process.env.SEED_DEMO_USERS = "true";
    await initDatabase();
    const stats = await getDatabaseStats();
    console.log("✅ Seed completed successfully!");
    console.log("Database Stats:", stats.tables);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
