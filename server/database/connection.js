const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_ENGINE = process.env.DATABASE_URL ? "postgres" : "sqlite";
let pgPool = null;

if (DB_ENGINE === "postgres") {
  const { Pool } = require("pg");
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false
  });
}

function getSqliteFilePath() {
  if (process.env.RIDEX_SQLITE_FILE) {
    return path.resolve(process.env.RIDEX_SQLITE_FILE);
  }
  if (process.env.RIDEX_DB_FILE) {
    const parsed = path.parse(process.env.RIDEX_DB_FILE);
    return path.join(parsed.dir, `${parsed.name}.sqlite`);
  }
  return path.join(__dirname, "..", "data", "mobility_store.sqlite");
}

let sqliteDb = null;

function getSqliteDb() {
  if (!sqliteDb) {
    const dbPath = getSqliteFilePath();
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    sqliteDb = new sqlite3.Database(dbPath);
    // Enable Write-Ahead Logging (WAL) for high-performance concurrency
    sqliteDb.serialize(() => {
      sqliteDb.run("PRAGMA journal_mode = WAL;");
      sqliteDb.run("PRAGMA synchronous = NORMAL;");
    });
  }
  return sqliteDb;
}

function closeSqliteDb() {
  return new Promise((resolve) => {
    if (sqliteDb) {
      sqliteDb.close(() => {
        sqliteDb = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Universal async query interface
 */
async function query(sql, params = []) {
  if (DB_ENGINE === "postgres") {
    const res = await pgPool.query(sql, params);
    return res.rows;
  }

  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function get(sql, params = []) {
  if (DB_ENGINE === "postgres") {
    const res = await pgPool.query(sql, params);
    return res.rows[0] || null;
  }

  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

async function run(sql, params = []) {
  if (DB_ENGINE === "postgres") {
    const res = await pgPool.query(sql, params);
    return { changes: res.rowCount, lastID: null };
  }

  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function exec(sql) {
  if (DB_ENGINE === "postgres") {
    await pgPool.query(sql);
    return;
  }

  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Initialize database schema
 */
async function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await exec(schemaSql);
}

module.exports = {
  DB_ENGINE,
  getSqliteFilePath,
  getSqliteDb,
  closeSqliteDb,
  query,
  get,
  run,
  exec,
  initSchema
};
