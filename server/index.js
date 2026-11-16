const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const http = require("http");

const ridesRouter = require("./routes/rides");
const carpoolsRouter = require("./routes/carpools");
const walletRouter = require("./routes/wallet");
const geoRouter = require("./routes/geo");
const authRouter = require("./routes/auth");
const contactRouter = require("./routes/contact");
const databaseRouter = require("./routes/database");
const db = require("./db");

const { initWebSocketServer, closeAllConnections } = require("./services/websocket");
const { securityHeaders, corsMiddleware, rateLimiter, requestId } = require("./middleware/security");

const app = express();
const PORT = process.env.PORT || 5000;
const BUILD_DIR = path.join(__dirname, "..", "build");
const HAS_BUILD = fs.existsSync(path.join(BUILD_DIR, "index.html"));

app.disable("x-powered-by");
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(requestId);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter({ windowMs: 60 * 1000, max: 300, prefix: "api" }));
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));

// Health check
app.get("/api/health", (req, res) => {
  let database = "ONLINE";
  try {
    db.read();
  } catch (err) {
    database = "DEGRADED";
  }

  res.status(database === "ONLINE" ? 200 : 503).json({
    status: database === "ONLINE" ? "HEALTHY" : "DEGRADED",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    requestId: req.id,
    services: {
      api: "ONLINE",
      database,
      rides: "ONLINE",
      biddingEngine: "ONLINE",
      carpools: "ONLINE",
      walletLedger: "ONLINE",
      geospatialRouting: "ONLINE",
      webSockets: "ONLINE",
      staticFrontend: HAS_BUILD ? "ONLINE" : "NOT_BUILT"
    }
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/rides", ridesRouter);
app.use("/api/carpools", carpoolsRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/geo", geoRouter);
app.use("/api/contact", contactRouter);
app.use("/api/database", databaseRouter);

// Unknown API routes always return JSON, never HTML
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found", path: req.originalUrl, requestId: req.id });
});

// Serve the compiled React app when available (single-service deployment)
if (HAS_BUILD) {
  app.use(
    "/static",
    express.static(path.join(BUILD_DIR, "static"), { maxAge: "1y", immutable: true })
  );
  app.use(express.static(BUILD_DIR, { maxAge: "1h", index: false }));
}

app.get("/", (req, res, next) => {
  if (HAS_BUILD) return next();
  res.json({ service: "RideX Mobility API", status: "ok", health: "/api/health" });
});

// SPA fallback for client-side routes
app.use((req, res, next) => {
  if ((req.method !== "GET" && req.method !== "HEAD") || req.path.startsWith("/api")) return next();
  const indexFile = path.join(BUILD_DIR, "index.html");
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  return next();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl, requestId: req.id });
});

// Centralized error handler (never leaks stack traces in production)
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error(`[${req.id}] Unhandled error:`, err);
  }
  if (res.headersSent) return next(err);
  const message =
    process.env.NODE_ENV === "production" && status >= 500
      ? "Internal server error"
      : err.message || "Request failed";
  res.status(status).json({ error: message, requestId: req.id });
});

const server = http.createServer(app);

// Initialize production real-time WebSocket server
const wss = initWebSocketServer(server);

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  const forceExit = setTimeout(() => {
    console.error("Graceful shutdown timed out; forcing exit.");
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(() => {
    try {
      closeAllConnections();
    } catch (err) {
      // ignore websocket close errors during shutdown
    }
    clearTimeout(forceExit);
    process.exit(0);
  });
}

if (require.main === module) {
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE" && Number(PORT) === 5000) {
      console.warn("⚠️ Port 5000 is occupied (e.g. by macOS AirPlay). Retrying on port 5001...");
      server.listen(5001, () => {
        console.log("=======================================================");
        console.log(`RideX Mobility API running on fallback port 5001 (${process.env.NODE_ENV || "development"})`);
        console.log(`REST API:  http://localhost:5001/api/health`);
        console.log(`WebSocket: ws://localhost:5001/ws`);
        console.log("=======================================================");
      });
    } else {
      console.error("Server listen error:", err);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log("=======================================================");
    console.log(`RideX Mobility API running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    console.log(`REST API:  http://localhost:${PORT}/api/health`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
    if (HAS_BUILD) {
      console.log(`Frontend:  http://localhost:${PORT}/`);
    } else {
      console.log("Frontend build not found. Run `npm run build` to serve the UI.");
    }
    if (!process.env.JWT_SECRET) {
      console.warn("WARNING: JWT_SECRET is not set. Using an insecure development fallback.");
    }
    console.log("=======================================================");
  });

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = { app, server, wss };
