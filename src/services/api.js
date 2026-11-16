const DEFAULT_API_BASE =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5001/api";
const API_BASE = (process.env.REACT_APP_API_URL || DEFAULT_API_BASE).replace(/\/+$/, "");

// Token & User Persistence
export function getAuthToken() {
  return localStorage.getItem("ridex_token") || "";
}

export function setAuthSession(token, user) {
  if (token) {
    localStorage.setItem("ridex_token", token);
  } else {
    localStorage.removeItem("ridex_token");
  }

  if (user) {
    localStorage.setItem("ridex_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("ridex_user");
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("ridex_user");
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearAuthSession() {
  localStorage.removeItem("ridex_token");
  localStorage.removeItem("ridex_user");
}

export function authHeaders(extra = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...extra
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

// AUTH API
export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (res.ok && data.token) {
    setAuthSession(data.token, data.user);
  }
  return { ok: res.ok, status: res.status, ...data };
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  const data = await res.json();
  if (res.ok && data.token) {
    setAuthSession(data.token, data.user);
  }
  return { ok: res.ok, status: res.status, ...data };
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders()
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, ...data };
}

// RIDES API
export async function createRide(payload) {
  const res = await fetch(`${API_BASE}/rides`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function getRide(rideId) {
  const res = await fetch(`${API_BASE}/rides/${rideId}`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function getRideHistory() {
  const res = await fetch(`${API_BASE}/rides`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function acceptBid(rideId, bidId) {
  const res = await fetch(`${API_BASE}/rides/${rideId}/accept-bid`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ bidId })
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function startRide(rideId, otp) {
  const res = await fetch(`${API_BASE}/rides/${rideId}/start`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ otp })
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function completeRide(rideId) {
  const res = await fetch(`${API_BASE}/rides/${rideId}/complete`, {
    method: "POST",
    headers: authHeaders()
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function cancelRide(rideId) {
  const res = await fetch(`${API_BASE}/rides/${rideId}/cancel`, {
    method: "POST",
    headers: authHeaders()
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function rateRide(rideId, { rating, feedbackTags, tipAmount }) {
  const res = await fetch(`${API_BASE}/rides/${rideId}/rate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ rating, feedbackTags, tipAmount })
  });
  return res.json();
}

// CARPOOLS API
export async function getCarpools(from = "", to = "") {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const res = await fetch(`${API_BASE}/carpools?${params.toString()}`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function publishCarpool(payload) {
  const res = await fetch(`${API_BASE}/carpools`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function bookCarpool(carpoolId, seats) {
  const res = await fetch(`${API_BASE}/carpools/${carpoolId}/book`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ seats })
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

// WALLET API
export async function getWallet() {
  const res = await fetch(`${API_BASE}/wallet`, {
    headers: authHeaders()
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

export async function topupWallet(amount) {
  const res = await fetch(`${API_BASE}/wallet/topup`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      amount,
      idempotencyKey: `topup-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    })
  });
  const data = await res.json();
  return { ok: res.ok, ...data };
}

// GEOSPATIAL API
export async function getRoute(startCoords, endCoords) {
  const res = await fetch(
    `${API_BASE}/geo/route?startLat=${startCoords[0]}&startLon=${startCoords[1]}&endLat=${endCoords[0]}&endLon=${endCoords[1]}`
  );
  return res.json();
}

export async function searchLocations(query) {
  const res = await fetch(`${API_BASE}/geo/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

// SUPPORT / CONTACT API
export async function submitContact(payload) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, ...data };
}

