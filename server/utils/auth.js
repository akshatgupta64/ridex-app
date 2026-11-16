const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DEV_FALLBACK_SECRET = "ridex_dev_only_insecure_secret_change_me";
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : DEV_FALLBACK_SECRET);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required when NODE_ENV=production");
}

/**
 * Hash a plain text password using bcrypt
 */
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain text password with stored hash
 */
async function comparePassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return false;
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Generate a signed JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Strip sensitive fields like passwordHash before sending to clients or logging
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  JWT_SECRET,
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  sanitizeUser
};
