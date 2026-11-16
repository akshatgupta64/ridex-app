const crypto = require("crypto");

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' ws: wss: https:",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join("; ");

function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  res.setHeader("Content-Security-Policy", CSP);
  if (req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
}

function parseAllowedOrigins() {
  return (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Max-Age", "600");
  }

  if (!origin) {
    return next();
  }

  const configured = parseAllowedOrigins();
  let allowed = configured.includes(origin);

  if (!allowed) {
    try {
      const parsed = new URL(origin);
      allowed = parsed.host === req.headers.host;
    } catch (err) {
      allowed = false;
    }
  }

  if (!allowed && process.env.NODE_ENV !== "production") {
    allowed = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  }

  if (!allowed) {
    return res.status(403).json({ error: "Origin not allowed by CORS policy" });
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
}

function rateLimiter({ windowMs = 60 * 1000, max = 300, prefix = "api" } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const now = Date.now();

    if (hits.size > 5000) {
      for (const [key, entry] of hits) {
        if (entry.resetAt <= now) hits.delete(key);
      }
    }

    const identity = req.ip || req.socket?.remoteAddress || "unknown";
    const key = `${prefix}:${identity}`;
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ error: "Too many requests. Please try again shortly." });
    }

    return next();
  };
}

function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = typeof incoming === "string" && incoming.length <= 64 ? incoming : crypto.randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

module.exports = {
  securityHeaders,
  corsMiddleware,
  rateLimiter,
  requestId
};
