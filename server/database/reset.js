const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const { connection, initDatabase, getDatabaseStats } = require("./index");

async function run() {
  console.log("==========================================");
  console.log("⚠️ Resetting RideX Relational Database");
  console.log("==========================================");
  try {
    if (connection.DB_ENGINE === "sqlite") {
      const sqlitePath = connection.getSqliteFilePath();
      await connection.closeSqliteDb();
      if (fs.existsSync(sqlitePath)) {
        fs.unlinkSync(sqlitePath);
        console.log(`Deleted SQLite file: ${sqlitePath}`);
      }
    } else {
      await connection.exec(`
        DROP TABLE IF EXISTS contact_messages;
        DROP TABLE IF EXISTS carpool_bookings;
        DROP TABLE IF EXISTS carpools;
        DROP TABLE IF EXISTS ride_bids;
        DROP TABLE IF EXISTS rides;
        DROP TABLE IF EXISTS wallet_ledger;
        DROP TABLE IF EXISTS wallets;
        DROP TABLE IF EXISTS drivers;
        DROP TABLE IF EXISTS users;
      `);
      console.log("Dropped PostgreSQL tables.");
    }

    await initDatabase();
    const stats = await getDatabaseStats();
    console.log("✅ Reset completed and re-seeded successfully!");
    console.log("Database Stats:", stats.tables);
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset failed:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
