# Multi-Modal Mobility & Dynamic Bidding Platform (System Design Final Project)

An enterprise-grade, distributed system design and implementation of a unified multi-modal mobility platform combining:
1. **Intra-City On-Demand Mobility (Rapido model)**: Real-time bike taxi, auto, and cab booking with live OpenStreetMap/Leaflet tracking.
2. **Dynamic Peer-to-Peer Fare Negotiation (inDrive model)**: Two-sided decentralized bidding marketplace where passengers propose fares and nearby drivers submit competitive counter-bids.
3. **Intercity Corridor Carpooling (Carpool model)**: Route corridor deviation algorithms with driver-set pricing and seat inventory locking.
4. **Interactive In-App Architecture Explorer**: A dedicated portal (`/system-design`) rendering live system design diagrams, capacity math, state machines, and relational schemas directly in the browser.

---

## 🌟 Key Functional Modules

### 1. Live Interactive Ride Booking & Tracking (`/book`)
- **Map & Telemetry**: Dynamic OpenStreetMap & Leaflet integration with custom SVG pins for pickup, drop, and moving vehicle tracking.
- **Multi-Modal Vehicles**: Bike Taxi (fastest solo commute), Rapido Auto (pocket friendly 3-wheeler), Cab Economy (AC 4-seater), and Parcel Delivery.
- **Trip Lifecycle**: Searching radar animation, driver profile matching, 4-digit security OTP verification, live en-route movement, in-app driver calling, and interactive chat.

### 2. inDrive Fare Bidding & Counter-Offers
- **Name Your Own Fare**: Passengers can suggest a custom fare (using stepper controls `[-]` / `[+]`) instead of rigid algorithmic surge pricing.
- **Live Driver Bids**: Multiple nearby drivers respond in real time with counter-offers, ratings, and vehicle models.
- **Atomic Acceptance**: Concurrency protection ensuring exactly one driver claims the ride via distributed lock patterns.

### 3. Intercity Car Pooling (`/carpool`)
- **City-to-City Route Sharing**: Long-distance carpools across corridors like Bengaluru ➔ Mysuru, Mumbai ➔ Pune, Delhi ➔ Agra, and Hyderabad ➔ Vijayawada.
- **Driver-Set Seat Pricing**: Drivers define their departure time, vehicle, total seats, and exact price per seat.
- **Seat Reservation**: Passengers select seat quantities, review detour points, and reserve seats with atomic inventory updates.

### 4. Financial Ledger & Rapido Wallet (`/wallet`)
- **Cashless Settlement**: Instant balance deductions upon trip completion.
- **Double-Entry Bookkeeping**: Idempotent top-up transactions (+₹100, +₹200, +₹500) and passbook activity history.

### 5. In-App System Design Explorer (`/system-design`)
- Live interactive dashboard embedded directly within the app for project evaluators.
- Visual breakdown of:
  - High-Level Microservices Architecture
  - Mathematical Scale & Capacity Calculations (QPS, Bandwidth, 5-Year Storage)
  - inDrive Bidding Protocol State Machine
  - Carpool Corridor Buffering Algorithm (`ST_Buffer` & `ST_DWithin`)
  - PostgreSQL & PostGIS Schema Definitions
  - Fault Tolerance & Circuit Breaking Strategies

---

## 🏗️ System Architecture & Technology Stack

| Layer | Technologies & Implementations |
| :--- | :--- |
| **Frontend Tier** | React 18, React Router v6, Leaflet Maps, React-Bootstrap, React Icons |
| **Ingress & Gateway** | Reverse Proxy, Rate Limiting (Token Bucket), TLS Termination, Route Guarding |
| **Compute & Microservices** | Geospatial Location Service, inDrive Bidding Coordinator, Carpool Matcher, Wallet Ledger |
| **Messaging & Events** | Event Streams (Apache Kafka pattern), Pub/Sub Broadcast Channels |
| **Caching & In-Memory** | Uber H3 Hexagonal Hierarchical Indexing (Resolution 8), Redis Distributed Mutex (Redlock) |
| **Persistent Storage** | PostgreSQL with PostGIS extension for spatial queries, Double-entry transaction tables |

---

## 📊 Scale & Capacity Highlights

- **Daily Active Drivers**: 1,000,000 online concurrently
- **Peak Telemetry Ingestion QPS**: 666,666 location updates/sec
- **Peak Ingress Bandwidth**: ~42.6 MB/s (341 Mbps)
- **Daily Completed Rides**: 5,000,000 rides/day
- **5-Year Primary Storage Estimate**: 13.65 TB (structured ride data)
- **Target Dispatch Latency**: P99 < 85 ms

---

## 🚀 Local Setup & Execution Instructions

### Prerequisites
- Node.js 18.x or 20.x LTS (use `.nvmrc`: `nvm use`)
- npm (v9.x or newer)

> Node.js 24+ is not supported for the production build. `react-scripts` (CRA 5) can exhaust the V8 heap or crash with `0xC0000409` on newer runtimes. Use Node 20 LTS for `npm run build` and deployment.

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/ROHANxMISHRA/Rapido-Clone.git
cd Rapido-Clone

# 2. Install dependencies
npm install

# 3. Configure environment
#    .env is pre-configured with JWT_SECRET and SQLite/PostgreSQL settings
cp .env.example .env

# 4. Migrate and seed relational database (SQLite out-of-the-box or PostgreSQL)
npm run db:migrate
npm run db:seed

# 5. Start the backend API + frontend dev server in separate terminals
npm run server   # API + WebSocket on http://localhost:5001 (or port configured in .env)
npm start        # CRA dev server on http://localhost:3000
```

### Accessing Endpoints
- **Application Homepage**: [http://localhost:3000/](http://localhost:3000/)
- **Live Ride Booking & inDrive Bidding**: [http://localhost:3000/book](http://localhost:3000/book)
- **Intercity Car Pool**: [http://localhost:3000/carpool](http://localhost:3000/carpool)
- **In-App System Design Documentation**: [http://localhost:3000/system-design](http://localhost:3000/system-design)
- **Cashless Wallet**: [http://localhost:3000/wallet](http://localhost:3000/wallet)
- **My Rides History & Receipts**: [http://localhost:3000/rides](http://localhost:3000/rides)

---

## 🚢 Production Deployment

### 1. Build and run
```bash
# Use Node 20 LTS (see .nvmrc)
npm ci
npm run build          # outputs the static bundle to build/

# Production environment
# Linux/macOS:
NODE_ENV=production JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" npm run start:server
# Windows PowerShell:
# $env:NODE_ENV="production"; $env:JWT_SECRET="<long-random-secret>"; npm run start:server
```

The Express server (`server/index.js`) serves the built SPA from `build/`, exposes `/api/*`, and hosts the `/ws` WebSocket endpoint on the same origin. Point your reverse proxy (nginx, Caddy, Render, Fly.io, etc.) at `PORT` (default `5000`) and enable WebSocket upgrade forwarding for `/ws`.

### 2. Required environment
See [`.env.example`](./.env.example) for the full contract. Minimum for production:

| Variable | Purpose |
| :--- | :--- |
| `NODE_ENV=production` | Disables demo users/rides and requires `JWT_SECRET`. |
| `JWT_SECRET` | Long random signing key. The server refuses to start without it in production. |
| `CORS_ORIGIN` | Comma-separated allowed origins (e.g. `https://ridex.example.com`). |
| `SIGNUP_BONUS=0` | Avoid granting free wallet credit in production. |
| `RIDEX_DB_FILE` | Optional absolute path to the JSON store on persistent storage. |
| `TRUST_PROXY=1` | Only when behind a trusted reverse proxy. |

### 3. Operational notes
- **Data store**: the app uses a single JSON file (`server/data/mobility_store.json` by default). It is suitable for a demo/single-instance deployment only. Back it up regularly and do not run multiple instances against the same file. Replace it with PostgreSQL/PostGIS for horizontal scaling.
- **Health check**: `GET /api/health` reports database readiness. Use it for load-balancer probes.
- **Security**: response hardening (CSP, HSTS, `nosniff`, frame denial), CORS allowlisting, per-IP rate limiting, 256 KB JSON body limit, JWT auth, ownership checks on ride reads, OTP-gated trip start, and stack-trace hiding in production are enabled by default.
- **Static assets**: `/static/*` is served with immutable one-year caching; other SPA assets use one-hour caching.
- **Tests**: `npm run test:server` runs the API/WebSocket suites against an isolated temporary database.

---

## 📑 Detailed Architecture Whitepaper
Refer to [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the complete 10-page formal system design specification document, database DDL scripts, sequence diagrams, and failure scenario mitigations.
