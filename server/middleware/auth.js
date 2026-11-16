const { verifyToken, sanitizeUser } = require("../utils/auth");
const db = require("../db");

/**
 * Middleware: Enforces that a valid JWT token is provided.
 * Attaches sanitized req.user ({ id, name, email, role, phone, ... }) to the request.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required. Please provide a Bearer token in Authorization header."
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: "Malformed Authorization header. Format must be 'Bearer <token>'."
    });
  }

  const token = parts[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      error: "Invalid or expired session token. Please log in again."
    });
  }

  const store = db.read();
  const user = store.users.find((u) => u.id === decoded.id);
  if (!user) {
    return res.status(401).json({
      error: "User associated with this token no longer exists."
    });
  }

  req.user = sanitizeUser(user);
  next();
}

/**
 * Middleware: Optional authentication. If a valid token is provided, req.user is set.
 * Otherwise, req.user remains null without returning an error.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    req.user = null;
    return next();
  }

  const decoded = verifyToken(parts[1]);
  if (!decoded || !decoded.id) {
    req.user = null;
    return next();
  }

  const store = db.read();
  const user = store.users.find((u) => u.id === decoded.id);
  req.user = user ? sanitizeUser(user) : null;
  next();
}

/**
 * Middleware: Role-based access control.
 * Requires that req.user has one of the allowed roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: role '${req.user.role}' is not authorized. Allowed roles: [${allowedRoles.join(", ")}]`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole
};
