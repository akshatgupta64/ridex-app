# -*- coding: utf-8 -*-
"""
Clean Report Data for RideX System Design & Engineering Architecture
Structured technical content: Times New Roman, clean math, no code blocks,
no student signature sheets, 5 phases across 5 weeks, proper diagram references.
"""

METADATA = {
    "title": "RideX — Smart Ride-Hailing & Intercity Carpooling System Design"
}

# -------------------------------------------------------------------------
# SECTION 1: INTRODUCTION & EXECUTIVE SUMMARY
# -------------------------------------------------------------------------
SEC_1 = {
    "title": "1. Introduction & Executive Summary",
    "subsections": [
        {
            "title": "1.1 Industry Background & Urban Mobility Challenges",
            "content": """Urban transportation ecosystems in high-density metropolitan areas face severe operational bottlenecks. Traditional Transportation Network Companies (TNCs) rely on centralized dispatching models where algorithms determine trip pricing, vehicle matching, and routing behind closed proprietary systems. While these platforms have digitized urban mobility, they have introduced major market distortions:

1. Rigid Algorithmic Surge Pricing: During commute peaks, rainstorms, or supply crunches, centralized algorithms enforce non-negotiable surge multipliers (often 200% to 350% of baseline rates). Riders face unexpected price spikes, while drivers frequently receive only a fractional percentage of this surge.
2. High Cancellation Rates & Supply Attrition: Centralized platforms historically withhold trip destinations and net payout figures from drivers until pickup. Consequently, drivers routinely reject rides, request offline cash negotiations, or arbitrarily cancel trips, severely degrading system reliability.
3. High Intermediary Take-Rates: Industry aggregators extract 20% to 30% commission on every transaction, reducing driver take-home earnings while keeping consumer costs high.
4. Fragmented Transit Silos: Commuters must switch between disparate mobile applications for daily city bike taxis, price-flexible cab trips, parcel deliveries, and intercity weekend carpools. This fragmentation forces users to maintain separate identities, split digital wallet balances, and manage disconnected trip histories."""
        },
        {
            "title": "1.2 The RideX Platform Solution",
            "content": """RideX is a unified, multi-modal mobility and distributed real-time transportation platform that bridges intra-city on-demand hailing, peer-to-peer dynamic fare negotiation, and long-distance intercity corridor carpooling into a cohesive distributed architecture.

Key Architectural Tenets of RideX:
- Multi-Modal Transit Unification: A single client interface and backend ecosystem coordinates Bike Taxi, Rapido Auto (three-wheeler), Cab Economy (four-wheeler AC), Express Parcel Delivery, and Intercity Carpooling.
- Decentralized inDrive Bidding Protocol: Passengers propose custom base fares using intuitive pricing steppers. Nearby drivers review upfront route information and submit real-time counter-offers, creating a transparent, market-clearing equilibrium.
- Atomic Concurrency & Mutual Consent: Distributed mutex locking guarantees single-winner ride assignment under high-concurrency race conditions, eliminating double-booking.
- Spatial Corridor Carpooling: Car owners traveling between urban centers publish journeys with per-seat pricing. Spatial corridor buffering algorithms match passenger pickup and drop-off points along the driver's route with strict detour tolerance limits.
- Auditable Financial Ledger: Cashless digital transactions operate on a double-entry ledger enforcing strict idempotency and an 85% driver net earnings payout (15% platform commission).
- High-Throughput Real-Time Telemetry: A persistent WebSocket gateway streams low-latency driver GPS telemetry (< 80 ms broadcast latency) with hardware rate limiting and anti-spoofing verification."""
        },
        {
            "title": "1.3 System Scope & Supported Modalities",
            "content": """The platform governs five operational transit modalities within a unified state engine:

| Modality | Vehicle Category | Primary Use Case | Pricing Mechanism | Dispatch / Matching Model |
| :--- | :--- | :--- | :--- | :--- |
| **Bike Taxi** | Solo Motorcycle / Scooter | Fastest solo urban transit, bypassing traffic gridlock. | Dynamic Bidding (Base: ₹25 + ₹9/km after 1.5 km) | Proximity broadcast (< 3 km radius) with driver counter-bids. |
| **Rapido Auto** | 3-Wheeler Auto-Rickshaw | Pocket-friendly, weather-protected city commute. | Dynamic Bidding (Base: ₹35 + ₹14/km after 1.5 km) | Proximity broadcast (< 4 km radius) with driver counter-bids. |
| **Cab Economy** | 4-Wheeler Compact Sedan / Hatchback | Comfortable, air-conditioned family or executive commute. | Dynamic Bidding (Base: ₹70 + ₹18/km after 2.0 km) | Proximity broadcast (< 5 km radius) with driver counter-bids. |
| **Rapido Parcel** | 2-Wheeler Courier Delivery | Same-day intra-city package and document transfer. | Fixed Distance Rate (Base: ₹30 + ₹11/km after 1.5 km) | Nearest available courier assignment with real-time waypoint tracking. |
| **Intercity Carpool** | Private Passenger Sedan / SUV | Scheduled city-to-city corridor transit (e.g., Bengaluru to Mysuru). | Driver-Set Per-Seat Price (Market-driven) | Spatial corridor route buffer matching with atomic seat inventory locking. |"""
        },
        {
            "title": "1.4 Requirements Specification",
            "content": """Functional Requirements:
- FR-1 (User & Role Management): Seamless onboarding of riders and driver partners with bcrypt credential hashing, RBAC enforcement (rider, driver, admin), and session JWTs.
- FR-2 (Multi-Modal Dispatch): Dynamic road routing via OpenStreetMap/OSRM, travel time computation, and automated rate card estimation.
- FR-3 (Dynamic Bidding Auction): Real-time two-sided auction allowing riders to adjust custom fare proposals and drivers to return counter-bids.
- FR-4 (Atomic Ride Claiming): Distributed mutex lock preventing race conditions during concurrent bid acceptance.
- FR-5 (Cryptographic Security Gate): Mandatory 4-digit security OTP verification before ride status transitions to active transit (IN_PROGRESS).
- FR-6 (Real-Time GPS Telematics): Low-latency WebSocket streaming of driver GPS coordinates, vehicle bearing, speed, and remaining distance to passenger maps.
- FR-7 (Corridor Carpool Engine): Driver corridor publishing, origin/destination search filtering, and atomic multi-seat reservation.
- FR-8 (Double-Entry Financial Ledger): Idempotent digital wallet recharges, automated fare deductions, 85% driver earnings split, and passenger tipping.

Non-Functional Requirements:
- NFR-1 (Low Latency): API P95 response latency < 150 ms; WebSocket telemetry P99 delivery latency < 80 ms.
- NFR-2 (High Availability): 99.99% operational uptime (< 52.6 minutes unplanned downtime annually) via stateless microservice scaling.
- NFR-3 (Strict Financial Consistency): Zero-loss double-entry accounting with hardware-enforced unique idempotency keys on all balance mutations.
- NFR-4 (Horizontal Scalability): Compute tier scales horizontally to handle 5x commute surges (peak 666,666 GPS telemetry QPS).
- NFR-5 (Transport & Data Security): TLS 1.3 encryption across all network boundaries, strict Content Security Policy (CSP), token-bucket rate limiting, and PII masking."""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 2: SCALE, CAPACITY & PERFORMANCE ENGINEERING
# -------------------------------------------------------------------------
SEC_2 = {
    "title": "2. Scale, Capacity & Performance Engineering",
    "subsections": [
        {
            "title": "2.1 System Scale Assumptions",
            "content": """Capacity planning is formulated around a Tier-1 metropolitan deployment benchmark:
- Daily Active Users (DAU): 15,000,000 riders
- Concurrent Online Drivers: 1,000,000 drivers transmitting telemetry
- Completed Daily Rides: 5,000,000 trips/day
- Driver Telemetry Ping Rate: 1 GPS coordinate update every 3 seconds
- Peak Commute Surge Multiplier: 2.0x for driver telemetry; 5.0x for ride booking requests during morning and evening rush hours."""
        },
        {
            "title": "2.2 Throughput Derivations (QPS)",
            "content": """1. Driver Telemetry Ingestion Throughput:
Every online driver transmits a lightweight GPS telemetry packet every 3 seconds.
- Average Telemetry Ingestion QPS = (1,000,000 drivers) / (3 seconds) = 333,333 QPS
- Peak Telemetry Ingestion QPS (2x commute surge) = 333,333 × 2 = 666,666 QPS

2. Ride Booking Transaction Throughput:
Ride requests follow a diurnal distribution with sharp peaks during commute windows (8:00–10:30 AM and 5:30–8:00 PM).
- Average Booking QPS = (5,000,000 rides) / (86,400 seconds) = 57.87 QPS
- Peak Booking QPS (5x commute spike) = 57.87 × 5 = 289.35 QPS

3. Dynamic Bidding Event Fanout:
Each ride proposal broadcasts to an average of 10 nearby eligible drivers, generating approximately 4 competitive counter-bids per request.
- Peak Bidding Events QPS = 289.35 peak requests/sec × 4 counter-bids = 1,157.4 bidding events/sec"""
        },
        {
            "title": "2.3 Ingress Network Bandwidth Analysis",
            "content": """A telemetry ping payload contains:
driver_id (16 Bytes) + latitude (8 Bytes) + longitude (8 Bytes) + bearing (4 Bytes) + speed (4 Bytes) + timestamp (8 Bytes) + socket framing overhead ≈ 64 Bytes total.

- Peak Ingress Bandwidth = 666,666 QPS × 64 Bytes = 42,666,624 Bytes/sec
- Peak Ingress Bandwidth = 42.66 MB/s ≈ 341.3 Mbps

This network bandwidth is readily load-balanced across an autoscaling pool of WebSocket gateway instances behind an Layer 7 Application Load Balancer."""
        },
        {
            "title": "2.4 5-Year Persistent Storage Sizing",
            "content": """Completed ride records encapsulate route polylines, timestamps, financial ledger references, OTPs, and feedback tags:
- Average Ride Transaction Record Payload: ≈ 1.5 KB per record
- Daily Structured Storage Ingestion = 5,000,000 rides/day × 1.5 KB = 7,500,000 KB ≈ 7.5 GB/day
- Annual Storage Accumulation = 7.5 GB × 365 days ≈ 2.737 TB/year
- 5-Year Primary Structured Storage = 2.737 TB × 5 years ≈ 13.68 TB

Storage with High-Availability Redundancy:
- With 3x PostgreSQL Multi-AZ replication, Write-Ahead Logging (WAL), and cold historical archival: Total 5-Year Storage Capacity = 13.68 TB × 3 ≈ 41.0 TB."""
        },
        {
            "title": "2.5 Latency Budgets & Target Performance SLAs",
            "content": """The system enforces strict latency service level agreements (SLAs) across the distributed pipeline:

| Operation / Transaction | Target P95 Latency | Target P99 Latency | Architectural Strategy |
| :--- | :--- | :--- | :--- |
| **Driver GPS Ingestion** | < 15 ms | < 25 ms | In-memory Redis geospatial sorted set ingestion. |
| **Telemetry Map Broadcast** | < 50 ms | < 80 ms | Room-based WebSocket routing; zero broadcast storms. |
| **Ride Creation & Routing** | < 120 ms | < 180 ms | OSRM road graph engine with Haversine fallback. |
| **Bidding Mutex Acceptance** | < 35 ms | < 60 ms | In-memory atomic transaction lock / Redis Redlock. |
| **Wallet Ledger Settlement** | < 45 ms | < 75 ms | Idempotent double-entry append with database row lock. |
| **Carpool Corridor Search** | < 80 ms | < 140 ms | PostGIS spatial GIST index on route corridor buffer. |"""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 3: TECHNOLOGY STACK & INFRASTRUCTURE RATIONALE
# -------------------------------------------------------------------------
SEC_3 = {
    "title": "3. Technology Stack & Infrastructure Rationale",
    "subsections": [
        {
            "title": "3.1 Component Selection Matrix",
            "content": """Each technology in the RideX ecosystem was selected after thorough evaluation against production alternatives:

| Layer / Subsystem | Selected Technology | Evaluated Alternatives | Technical Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React 18 (SPA)** | Angular, Vue.js | Concurrent rendering, automatic state batching, lightweight virtual DOM handling high-frequency telemetry updates without interface stutter. |
| **Mapping & Telemetry** | **Leaflet 1.9 + OpenStreetMap** | Google Maps SDK, Mapbox GL | Open-source ecosystem, zero proprietary API licensing costs, lightweight vector rendering, custom SVG markers with hardware-accelerated CSS rotation. |
| **Backend Runtime** | **Node.js LTS (v20) + Express** | Java Spring Boot, Go, Python Django | Asynchronous, non-blocking libuv event loop excels at high-concurrency I/O multiplexing and persistent full-duplex WebSocket connections. |
| **Real-Time Gateway** | **Native ws Engine (v8.22)** | Socket.io, Long Polling | Minimal memory footprint per connection (~2 KB vs ~15 KB in Socket.io), zero transport-fallback protocol overhead, direct RFC 6455 compliance. |
| **Event Streaming** | **Apache Kafka (Target)** | RabbitMQ, AWS SQS | Partition-based log ordering, ultra-high ingestion throughput (millions of msgs/sec), replayability for analytics and telemetry auditing. |
| **In-Memory & Indexing** | **Redis 7.2 + Uber H3 Index** | Geohash, R-Tree, QuadTree | H3 hexagonal cells eliminate edge-distance distortion inherent in square grids; sub-millisecond O(1) memory lookups for nearby fleet discovery. |
| **Primary Persistence** | **PostgreSQL 16 + PostGIS 3.4** | MongoDB, MySQL, Cassandra | Strict ACID compliance for financial ledger, first-class spatial geometry types (GEOMETRY Point, LineString), and GIST spatial corridor indexing. |
| **Security & Cryptography** | **Bcrypt (cost 10) + JWT (HS256)** | Argon2, Plain SHA-256 | Proven adaptive salted key derivation against brute-force attacks; stateless cryptographically signed authorization headers. |"""
        },
        {
            "title": "3.2 Real-Time Communication Architecture",
            "content": """The real-time layer operates via a native WebSocket server mounted on the HTTP server at /ws.

Key Architectural Properties:
- Room-Based Channel Isolation: Subscriptions are partitioned by rideId. Telemetry pings and bidding counter-offers for a specific ride are routed exclusively to authorized sockets subscribed to that specific room, completely eliminating broadcast storms.
- Application-Level Heartbeat: A 30-second ping/pong cycle tracks client socket liveness. Silent or dead mobile sockets (e.g., entering subway tunnels) are terminated after a single missed heartbeat to prevent socket descriptor leaks.
- Anti-Spoofing Telemetry Guard: Sockets submitting location updates must authenticate as a driver and must match the driverId bound to the active ride. Spoofed coordinate updates from bystander sockets are rejected immediately.
- Rate Limiting Gate: Telemetry frames arriving faster than 10 Hz (100 ms interval) are dropped at the socket boundary to protect downstream message queues."""
        },
        {
            "title": "3.3 Geospatial Routing & OpenStreetMap Pipeline",
            "content": """Geospatial processing employs a multi-tiered pipeline:
1. Primary Road Graph Routing: Road distance and travel duration are calculated via asynchronous HTTP requests to the Open Source Routing Machine (OSRM) driving API (router.project-osrm.org). OSRM evaluates real turn restrictions, one-way avenues, and road classifications.
2. Resilient Mathematical Fallback Engine: If external OSRM nodes experience network timeouts (> 3500 ms) or connectivity drops, the system dynamically activates an internal mathematical engine:
   - Great-circle Haversine formula determines spatial distance.
   - A quadratic Bezier polynomial interpolates 30 realistic road-like curved waypoints between origin and destination to maintain smooth map tracing.
3. Forward Geocoding: OpenStreetMap Nominatim API resolves address strings and landmarks, debounced at 300 ms on the client and bounded to Indian geographic coordinates."""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 4: HIGH-LEVEL DESIGN (HLD)
# -------------------------------------------------------------------------
SEC_4 = {
    "title": "4. High-Level Design (HLD)",
    "subsections": [
        {
            "title": "4.1 End-to-End Microservices Architecture",
            "content": """The high-level architecture decouples client applications, edge routing, stateless microservice compute tiers, real-time gateways, message streaming, and distributed persistence.

[DIAGRAM: diagram_hld.png]

Architectural Tier Decomposition:
- Client Tier: React 18 Single-Page Application (SPA) for riders and carpool travelers; driver partner mobile telemetry client.
- Ingress & Security Tier: Layer 7 load balancer terminating TLS 1.3, enforcing token-bucket rate limiting (300 req/min), CORS allowlisting, and X-Request-ID correlation tracing.
- Application Compute Tier: Stateless microservices managing Authentication, inDrive Bidding Coordination, Multi-Modal Dispatch, Intercity Carpooling, and Double-Entry Wallet Ledgers.
- Real-Time WebSocket Gateway: Dedicated full-duplex /ws server maintaining persistent socket connections with room-based channel routing and sub-80ms telemetry streaming.
- Messaging & In-Memory Tier: Apache Kafka event topics for high-throughput stream decoupling; Redis 7.2 cluster with Uber H3 spatial indexing and Redlock distributed mutex locks.
- Persistence Tier: Clustered PostgreSQL 16 with PostGIS 3.4 spatial extensions and GIST geometric indexes."""
        },
        {
            "title": "4.2 Ingress Gateway & Edge Security Boundary",
            "content": """All incoming network traffic traverses the Layer 7 Ingress Gateway:
1. TLS 1.3 Termination: Eliminates cryptographic overhead on application compute pods.
2. Correlation Tracing: Automatically stamps every incoming request with a unique X-Request-Id UUID, propagating it through all downstream service logs.
3. Helmet Security Suite: Injects enterprise headers (Content-Security-Policy, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Strict-Transport-Security).
4. Rate Limiting Policy: Token-bucket in-memory limiters prevent volumetric attacks:
   - General API endpoints: 300 requests/minute per client IP.
   - Authentication routes (/login, /register): 30 requests/15 minutes.
   - Support contact submissions: 10 requests/10 minutes."""
        },
        {
            "title": "4.3 Data Flow Architecture",
            "content": """The platform's data flow is characterized by two distinct levels:
1. Data Flow Level 0 (Context Level): Isolates external actors (Riders, Drivers, OpenStreetMap/OSRM) communicating across secure perimeters with the RideX Platform. Riders submit ride requests and custom proposed fares; drivers stream live GPS coordinates and submit competitive counter-bids; external map engines provide road geometries.
2. Data Flow Level 1 (Decomposed Subsystems):
   - Ingress: Rider inputs flow through the Ingress Gateway, which validates the JWT and hands off to the Ride Booking Service.
   - Routing: The Ride Service queries the OSRM Routing Engine for distance and polyline waypoints.
   - Bidding: The inDrive Bidding Coordinator broadcasts the ride proposal to eligible drivers via the WebSocket Gateway.
   - Bids Ingestion: Driver counter-bids flow into the Bidding Service and are pushed live to the rider.
   - Mutex Assignment: Rider acceptance acquires an atomic lock, updates the ride status to ASSIGNED, and expires competing bids.
   - Telemetry: The assigned driver transmits GPS pings, which the Telemetry Engine streams to the rider map.
   - Settlement: Upon ride completion, the Wallet Ledger Service executes double-entry fare deductions."""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 5: LOW-LEVEL DESIGN (LLD) & MICROSERVICES ARCHITECTURE
# -------------------------------------------------------------------------
SEC_5 = {
    "title": "5. Low-Level Design (LLD) & Microservices Architecture",
    "subsections": [
        {
            "title": "5.1 inDrive Dynamic Bidding Coordinator",
            "content": """- Functional Responsibility: Manages the two-sided reverse auction lifecycle where passengers propose fares and drivers submit competitive bids.

[DIAGRAM: diagram_bidding_flowchart.png]

- State Machine Workflow:
  1. Rider creates ride with proposed fare F_offer. Status initialized to BIDDING.
  2. Bidding Coordinator enforces fare boundary constraints:
     0.6 × F_base ≤ F_offer ≤ 3.0 × F_base
  3. Eligible nearby drivers receive the broadcast and submit counter-bids (F_driver, ETA, rating).
  4. Bids persist with a 25-second Time-To-Live (TTL).
  5. When rider clicks "Accept Bid", an atomic compare-and-swap mutex is acquired. Status transitions to ASSIGNED. Competing bids are immediately updated to EXPIRED."""
        },
        {
            "title": "5.2 Ride Dispatch & Lifecycle Coordinator",
            "content": """- Functional Responsibility: Manages ride state transitions, multi-modal rate card computations, security OTP validation, and cancellation rules.

[DIAGRAM: diagram_state_machine.png]

- Supported Vehicle Rate Cards:
  - Bike Taxi: Base ₹25 (covers 1.5 km), ₹9/km thereafter.
  - Rapido Auto: Base ₹35 (covers 1.5 km), ₹14/km thereafter.
  - Cab Economy: Base ₹70 (covers 2.0 km), ₹18/km thereafter.
  - Rapido Parcel: Base ₹30 (covers 1.5 km), ₹11/km thereafter.
- OTP Verification Gate: Ride commencement requires validating a 4-digit code. The status cannot transition to IN_PROGRESS without OTP match, preventing fraudulent driver starts."""
        },
        {
            "title": "5.3 Real-Time Telemetry & GPS Ingestion Engine",
            "content": """- Functional Responsibility: High-frequency ingestion, boundary validation, and broadcast fanout of driver GPS coordinates.
- Ingestion Pipeline:
  1. WebSocket message driver_location_updated arrives with [lat, lon], speed, heading, and distance remaining.
  2. Driver identity verified against active ride assignment.
  3. Lat/Lon verified within valid geographic ranges: Latitude between -90 and +90 degrees, Longitude between -180 and +180 degrees.
  4. 10 Hz rate limiter drops telemetry spam.
  5. Payload broadcast to all sockets in the ride's subscription room."""
        },
        {
            "title": "5.4 Intercity Carpool Corridor Engine",
            "content": """- Functional Responsibility: Manages intercity travel publishing, corridor search matching, and atomic seat inventory reservations.
- Corridor Booking Rules:
  1. Drivers publish origin, destination, scheduled departure, vehicle model, seat capacity (1–6 seats), and price per seat.
  2. Passengers search via origin/destination query filters.
  3. Reservation verifies passenger is not the publishing driver.
  4. Atomic check verifies availableSeats ≥ requestedSeats.
  5. Passenger wallet is debited (pricePerSeat × seats).
  6. Seat inventory is decremented atomically; reservation receipt CP-BK-... is generated."""
        },
        {
            "title": "5.5 Double-Entry Wallet & Settlement Ledger",
            "content": """- Functional Responsibility: Maintains immutable financial auditability across passenger payments, driver earnings, and wallet top-ups.
- Accounting Rules:
  - Trip Completion Settlement: Agreed fare F debited from rider wallet. Net driver payout = 0.85 × F (85%). Platform fee retained = 0.15 × F (15%).
  - Gratuity Tipping: 100% of passenger tips transfer directly to driver wallet without platform deduction.
  - Idempotency Guarantee: Every financial balance mutation requires an idempotencyKey. Duplicate submissions return the existing ledger entry without mutating balances."""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 6: CORE ALGORITHMS & MATHEMATICAL FORMULATIONS
# -------------------------------------------------------------------------
SEC_6 = {
    "title": "6. Core Algorithms & Mathematical Formulations",
    "subsections": [
        {
            "title": "6.1 Great-Circle Haversine Distance Formulation",
            "content": """The Haversine equation calculates the shortest spherical surface distance between two geographic coordinates (lat₁, lon₁) and (lat₂, lon₂) on Earth:

Let R = 6,371 km (mean radius of Earth).
- Δlat = (lat₂ - lat₁) × π / 180
- Δlon = (lon₂ - lon₁) × π / 180
- a = sin²(Δlat / 2) + cos(lat₁ × π / 180) × cos(lat₂ × π / 180) × sin²(Δlon / 2)
- c = 2 × atan2(√a, √(1 - a))
- Distance d = R × c

Computational Complexity:
- Time Complexity: O(1) constant time execution.
- Space Complexity: O(1) auxiliary memory."""
        },
        {
            "title": "6.2 Quadratic Bezier Curve Waypoint Smoothing",
            "content": """When external routing graphs are unavailable, the fallback engine computes intermediate waypoints along a quadratic Bezier polynomial to simulate realistic road curvature:

Given start point P_start, destination P_end, and midpoint P_mid with an orthogonal curvature offset:
- B(t) = (1 - t)² × P_start + 2(1 - t)t × P_mid + t² × P_end, where t ∈ [0, 1]

Sampling N = 30 discrete values of parameter t yields smooth, visually accurate road paths on client maps.
- Time Complexity: O(N) where N = 30 waypoints.
- Space Complexity: O(N) coordinate array buffer."""
        },
        {
            "title": "6.3 inDrive Dynamic Bidding Auction Protocol",
            "content": """The bidding auction operates on dynamic market equilibrium:
1. Rider submits proposed fare F_offer via stepper controls.
2. Ingress gateway verifies boundaries against baseline fare F_base:
   0.6 × F_base ≤ F_offer ≤ 3.0 × F_base
3. Broadcast engine identifies drivers within Uber H3 k-ring(3) spatial proximity.
4. Candidate drivers evaluate route and submit bids F_driver with arrival ETAs.
5. Sockets fan out bids to passenger client.
6. Rider clicks "Accept Bid". An atomic mutex lock is acquired:
   - If status is BIDDING, transition status to ASSIGNED, bind driverId, and set winning bid to ACCEPTED.
   - All other bids transition to EXPIRED.
   - If lock fails (already claimed), return HTTP 409 Conflict."""
        },
        {
            "title": "6.4 Intercity Carpool Corridor Buffering Algorithm",
            "content": """The corridor algorithm determines whether a passenger's pickup and drop-off points lie acceptably along a driver's intercity route polyline R:

[DIAGRAM: diagram_carpool_corridor.png]

1. Spatial Corridor Polygon: The driver's route polyline R is buffered by radius W = 5,000 meters (5 km corridor width):
   Corridor = ST_Buffer(R, 5000)
2. Geometric Inclusion Filter: Both passenger pickup P_pickup and drop P_drop must fall within the corridor polygon:
   ST_Contains(Corridor, P_pickup) AND ST_Contains(Corridor, P_drop) = TRUE
3. Detour Tolerance Cap: The additional travel distance imposed by the passenger detour must not exceed 15% of the driver's direct route:
   Distance(Start → Pickup → Drop → End) ≤ 1.15 × Distance(Start → End)
4. Atomic Seat Inventory Decrement:
   UPDATE carpools SET available_seats = available_seats - S WHERE id = carpool_id AND available_seats ≥ S"""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 7: STORAGE ARCHITECTURE & DATABASE DESIGN
# -------------------------------------------------------------------------
SEC_7 = {
    "title": "7. Storage Architecture & Database Design",
    "subsections": [
        {
            "title": "7.1 Database Architecture Overview",
            "content": """The persistence tier is engineered in PostgreSQL 16 augmented with PostGIS 3.4 spatial extensions:
- Relational Core: Enforces foreign key referential integrity, unique constraints, and check constraints across users, rides, bids, carpools, and wallets.
- Spatial Extension: Incorporates native geographic point and linestring types (GEOMETRY Point, LineString) with Generalized Search Tree (GIST) indexing for sub-millisecond range and buffer queries.
- Double-Entry Ledger: Financial balances are audited through an append-only transaction table with unique idempotency keys."""
        },
        {
            "title": "7.2 Entity Schema Specifications",
            "content": """1. Table: users (Identity & Accounts)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Unique user ID (usr-uuid or drv-uuid). |
| `name` | VARCHAR(120) | NOT NULL | User's full legal name. |
| `email` | VARCHAR(160) | UNIQUE, NOT NULL | Account email address. |
| `phone` | VARCHAR(20) | NOT NULL | Mobile phone contact. |
| `role` | VARCHAR(20) | NOT NULL, CHECK in (rider, driver, admin) | Authorization role. |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash (salt cost 10). |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation timestamp. |

2. Table: drivers (Fleet & Vehicle Profiles)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(64) | PRIMARY KEY | Unique driver profile ID. |
| `user_id` | VARCHAR(64) | FOREIGN KEY REFERENCES users(id) | Parent user reference. |
| `vehicle_type` | VARCHAR(20) | NOT NULL, CHECK in (bike, auto, cab_economy) | Vehicle classification. |
| `model` | VARCHAR(100) | NOT NULL | Make, model, and color. |
| `plate_number` | VARCHAR(20) | NOT NULL | Registration plate number. |
| `rating` | DECIMAL(3, 2) | DEFAULT 5.00 | Average rating (1.00 to 5.00). |
| `trips` | INT | DEFAULT 0 | Completed trip count. |
| `status` | VARCHAR(20) | DEFAULT 'ONLINE' | Driver availability status. |
| `location_geom` | GEOMETRY(Point, 4326) | NOT NULL | Current GPS coordinate point. |
| `wallet_earnings` | DECIMAL(10, 2) | DEFAULT 0.00 | Total earnings accumulated. |

3. Table: rides (Intra-City Trip Transactions)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(32) | PRIMARY KEY | Booking code (RAP-XXXXX). |
| `rider_id` | VARCHAR(64) | FOREIGN KEY REFERENCES users(id) | Requesting passenger. |
| `driver_id` | VARCHAR(64) | FOREIGN KEY REFERENCES drivers(id), NULL | Assigned driver partner. |
| `service` | VARCHAR(50) | NOT NULL | Service display title. |
| `vehicle_type` | VARCHAR(20) | NOT NULL | Vehicle category code. |
| `pickup_address` | TEXT | NOT NULL | Human-readable pickup location. |
| `drop_address` | TEXT | NOT NULL | Human-readable drop location. |
| `pickup_geom` | GEOMETRY(Point, 4326) | NOT NULL | Pickup spatial coordinate. |
| `drop_geom` | GEOMETRY(Point, 4326) | NOT NULL | Destination spatial coordinate. |
| `distance_km` | DECIMAL(6, 2) | NOT NULL | Road distance. |
| `duration_mins` | INT | NOT NULL | Estimated duration. |
| `initial_offer_fare` | DECIMAL(8, 2) | NOT NULL | Rider's initial proposed fare. |
| `agreed_fare` | DECIMAL(8, 2) | NULL | Final agreed bidding fare. |
| `status` | VARCHAR(25) | NOT NULL, CHECK in (BIDDING, ASSIGNED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED) | State machine status. |
| `ride_otp` | VARCHAR(6) | NOT NULL | 4-digit security start code. |
| `rating` | INT | NULL, CHECK between 1 and 5 | Passenger review score. |
| `tip_amount` | DECIMAL(8, 2) | DEFAULT 0.00 | Gratuity transferred to driver. |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Ride request timestamp. |
| `completed_at` | TIMESTAMPTZ | NULL | Trip finish timestamp. |

4. Table: ride_bids (inDrive Counter-Offers)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `bid_id` | VARCHAR(64) | PRIMARY KEY | Unique bid identifier (BID-...). |
| `ride_id` | VARCHAR(32) | FOREIGN KEY REFERENCES rides(id) ON DELETE CASCADE | Associated ride request. |
| `driver_id` | VARCHAR(64) | FOREIGN KEY REFERENCES drivers(id) | Bidding driver. |
| `driver_price` | DECIMAL(8, 2) | NOT NULL | Counter-offer fare amount. |
| `eta_mins` | INT | NOT NULL | Driver pickup arrival ETA. |
| `distance_km` | DECIMAL(4, 1) | NOT NULL | Distance from driver to pickup. |
| `status` | VARCHAR(15) | DEFAULT 'PENDING' | Bid state (PENDING, ACCEPTED, EXPIRED). |

5. Table: carpools (Intercity Corridor Journeys)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(32) | PRIMARY KEY | Unique carpool ID (CP-XXXX). |
| `driver_id` | VARCHAR(64) | FOREIGN KEY REFERENCES users(id) | Publishing car owner. |
| `from_city` | VARCHAR(80) | NOT NULL | Origin metropolitan city. |
| `to_city` | VARCHAR(80) | NOT NULL | Destination metropolitan city. |
| `departure_time` | VARCHAR(80) | NOT NULL | Scheduled departure time string. |
| `car_model` | VARCHAR(120) | NOT NULL | Vehicle make and registration. |
| `total_seats` | INT | NOT NULL, CHECK between 1 and 6 | Total seat capacity. |
| `available_seats` | INT | NOT NULL, CHECK >= 0 | Remaining unreserved inventory. |
| `price_per_seat` | DECIMAL(8, 2) | NOT NULL | Driver-set fare per passenger. |
| `route_geom` | GEOMETRY(LineString, 4326) | NULL | Corridor polyline geometry. |

6. Table: carpool_bookings (Seat Reservations)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `booking_id` | VARCHAR(64) | PRIMARY KEY | Unique booking receipt (CP-BK-...). |
| `carpool_id` | VARCHAR(32) | FOREIGN KEY REFERENCES carpools(id) | Target carpool journey. |
| `passenger_id` | VARCHAR(64) | FOREIGN KEY REFERENCES users(id) | Reserving passenger. |
| `seats` | INT | NOT NULL, CHECK between 1 and 6 | Quantity of seats reserved. |
| `total_cost` | DECIMAL(8, 2) | NOT NULL | Cost debited (price_per_seat × seats). |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Reservation timestamp. |

7. Table: wallets and wallet_ledger (Financial Accounting)

| Table | Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `wallets` | `user_id` | VARCHAR(64) | PRIMARY KEY REFERENCES users(id) | User wallet owner. |
| `wallets` | `balance` | DECIMAL(10, 2) | NOT NULL, DEFAULT 0.00, CHECK >= 0 | Available INR balance. |
| `wallet_ledger` | `id` | VARCHAR(64) | PRIMARY KEY | Transaction UUID (tx-...). |
| `wallet_ledger` | `wallet_id` | VARCHAR(64) | FOREIGN KEY REFERENCES wallets(user_id) | Account debited or credited. |
| `wallet_ledger` | `ride_id` | VARCHAR(32) | FOREIGN KEY REFERENCES rides(id), NULL | Linked trip transaction. |
| `wallet_ledger` | `type` | VARCHAR(20) | NOT NULL, CHECK in (CREDIT, DEBIT) | Direction of fund transfer. |
| `wallet_ledger` | `amount` | DECIMAL(10, 2) | NOT NULL | Transfer amount in INR. |
| `wallet_ledger` | `idempotency_key` | VARCHAR(120) | UNIQUE, NOT NULL | Deduplication token. |"""
        },
        {
            "title": "7.3 Enterprise Indexing Strategy",
            "content": """The production database incorporates specialized B-Tree and GIST spatial indexes:

| Table Name | Index Identifier | Type | Indexed Column(s) | Architectural Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `rides` | `idx_rides_status` | B-Tree | `status` | Sub-millisecond filtering of active bidding and en-route rides. |
| `rides` | `idx_rides_rider` | B-Tree | `rider_id, created_at DESC` | Instant retrieval of personal ride history and receipts. |
| `rides` | `idx_rides_pickup_spatial` | GIST | `pickup_geom` | Spatial proximity range queries for nearby fleet matching. |
| `drivers` | `idx_drivers_spatial` | GIST | `location_geom` | Proximity fleet matching within a 3 km radial distance. |
| `ride_bids` | `idx_bids_ride_id` | B-Tree | `ride_id` | Instant retrieval of all competing bids for an active auction. |
| `carpools` | `idx_carpools_corridor` | B-Tree | `from_city, to_city` | Rapid city-to-city corridor trip filtering. |
| `carpools` | `idx_carpools_geom` | GIST | `route_geom` | PostGIS spatial corridor buffer evaluation (ST_Buffer). |
| `wallet_ledger` | `idx_ledger_idempotency` | Unique B-Tree | `idempotency_key` | Guarantees hardware-level duplicate transaction rejection. |"""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 8: COMPLETE API CATALOG & PROTOCOL CONTRACTS
# -------------------------------------------------------------------------
SEC_8 = {
    "title": "8. Complete API Catalog & Protocol Contracts",
    "subsections": [
        {
            "title": "8.1 Authentication & Session Management APIs",
            "content": """| Method | Endpoint Path | Auth Required | Request Parameters / Fields | Response Fields | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public (Rate: 30/15m) | name, email, phone, password, role, vehicleType, model, plateNumber | token, user: { id, name, email, role } | 201, 400, 409 | Registers new rider or driver partner, hashes password, initializes wallet with bonus. |
| `POST` | `/api/auth/login` | Public (Rate: 30/15m) | email, password | token, user: { id, name, email, role } | 200, 400, 401 | Authenticates credentials using bcrypt; issues 7-day HMAC-SHA256 JWT session token. |
| `GET` | `/api/auth/me` | Protected (Bearer JWT) | None (Header token) | user, wallet: { balance }, driverProfile | 200, 401, 404 | Retrieves profile, current wallet balance, and driver metadata for the authenticated caller. |"""
        },
        {
            "title": "8.2 Intra-City Ride Dispatch & Lifecycle APIs",
            "content": """| Method | Endpoint Path | Auth Required | Request Parameters / Fields | Response Fields | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/rides` | Protected (Bearer JWT) | pickupCoords, dropCoords, vehicleType, proposedFare, paymentMethod | ride: { id, status, rideOtp, ... }, bids: [] | 201, 400, 500 | Creates ride, computes road distance via OSRM, initializes status to BIDDING, generates OTP. |
| `GET` | `/api/rides/:id` | Protected (Bearer JWT) | Path id | ride, bids: [] | 200, 403, 404 | Scoped ride details query (accessible only to creator, assigned driver, or platform admin). |
| `GET` | `/api/rides` | Protected (Bearer JWT) | Query limit (max 200) | rides: [] | 200, 401 | Returns chronological ride history filtered by caller's user or driver profile ID. |
| `POST` | `/api/rides/:id/start` | Protected (Bearer JWT) | Path id, Body: otp | ride: { status: 'IN_PROGRESS' } | 200, 400, 403, 409 | Commences trip following 4-digit security OTP verification. Broadcasts ride_started. |
| `POST` | `/api/rides/:id/complete`| Protected (Bearer JWT) | Path id | ride: { status: 'COMPLETED' }, wallet | 200, 403, 409 | Completes trip, executes 85/15 automated wallet settlement, appends ledger entries. |
| `POST` | `/api/rides/:id/rate` | Protected (Bearer JWT) | Path id, Body: rating, feedbackTags, tipAmount | success: true | 200, 400, 403, 409 | Records passenger rating (1–5) and executes direct wallet-to-wallet driver gratuity tip. |
| `POST` | `/api/rides/:id/cancel`| Protected (Bearer JWT) | Path id | success: true | 200, 403, 409 | Cancels uncompleted ride; records canceling user ID; broadcasts ride_cancelled. |"""
        },
        {
            "title": "8.3 inDrive Dynamic Fare Negotiation APIs",
            "content": """| Method | Endpoint Path | Auth Required | Request Parameters / Fields | Response Fields | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/rides/:id/accept-bid` | Protected (Bearer JWT) | Path id, Body: bidId | ride: { status: 'ASSIGNED' }, bid | 200, 400, 403, 409 | Acquires atomic mutex lock, assigns winning driver, sets winning bid ACCEPTED, expires other bids. |"""
        },
        {
            "title": "8.4 Intercity Carpooling & Seat Reservation APIs",
            "content": """| Method | Endpoint Path | Auth Required | Request Parameters / Fields | Response Fields | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/carpools` | Public / Optional Auth | Query: from, to (city filters) | carpools: [] | 200 | Discovers available carpool journeys; strips driver phone numbers for privacy protection. |
| `POST` | `/api/carpools` | Protected (Bearer JWT) | fromCity, toCity, departureTime, carModel, totalSeats, pricePerSeat | carpool: { id: 'CP-XXXX', ... } | 201, 400 | Driver publishes intercity corridor journey with custom per-seat pricing. |
| `POST` | `/api/carpools/:id/book` | Protected (Bearer JWT) | Path id, Body: seats | booking: { bookingId, ... }, carpool, wallet | 200, 400 | Reserves passenger seats, atomically decrements inventory, debits passenger wallet balance. |"""
        },
        {
            "title": "8.5 Digital Wallet & Financial Ledger APIs",
            "content": """| Method | Endpoint Path | Auth Required | Request Parameters / Fields | Response Fields | Status Codes | Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/wallet` | Protected (Bearer JWT) | None | wallet: { balance }, ledger: [] | 200, 401 | Returns caller's digital wallet balance and chronological transaction passbook ledger. |
| `POST` | `/api/wallet/topup` | Protected (Bearer JWT) | amount, idempotencyKey | wallet: { balance }, entry: { id, type } | 200, 400 | Idempotent digital wallet recharge; returns existing entry on replay without double-crediting. |"""
        },
        {
            "title": "8.6 Persistent WebSocket Event Protocol (/ws)",
            "content": """| Event Name | Direction | Originator | Payload Fields | Description |
| :--- | :--- | :--- | :--- | :--- |
| `connection_established` | Server ➔ Client | Gateway Server | authenticated: bool, user: object | Initial welcome handshake upon establishing persistent connection. |
| `authenticate` | Client ➔ Server | Client Socket | token: string | Explicit session authentication if token was not supplied in connection query string. |
| `subscribe_ride` | Client ➔ Server | Client Socket | rideId: string | Subscribes socket to private room for a specific ride's telemetry and bidding events. |
| `subscription_confirmed` | Server ➔ Client | Gateway Server | rideId: string, status: string | Confirms authorized socket subscription to the ride's channel. |
| `bid_created` | Server ➔ Client | Bidding Service | bid: { bidId, driverName, driverPrice, etaMins } | Broadcasts driver counter-offer to subscribed passenger map in real time. |
| `bid_accepted` | Server ➔ Client | Gateway Server | ride: object, bid: object | Notifies subscribers that a specific driver bid was accepted by the rider. |
| `ride_status_changed` | Server ➔ Client | Lifecycle Engine| status: string, ride: object | Broadcasts lifecycle transitions (ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED). |
| `driver_location_updated`| Both Ways | Driver / Gateway| coords: [lat, lng], speedKmH, heading, etaMins | Ingests driver hardware GPS and streams real-time vehicle movement to passenger map. |
| `ride_started` | Server ➔ Client | Lifecycle Engine| ride: object | Broadcasts trip commencement following valid OTP verification. |
| `ride_completed` | Server ➔ Client | Lifecycle Engine| ride: object | Broadcasts trip completion and opens passenger receipt and rating dialogs. |
| `ride_cancelled` | Server ➔ Client | Lifecycle Engine| rideId: string, cancelledBy: string | Broadcasts trip cancellation to all connected parties. |"""
        }
    ]
}

# -------------------------------------------------------------------------
# SECTION 9: PROJECT EXECUTION SCHEDULE & 5-WEEK GANTT CHART
# -------------------------------------------------------------------------
SEC_9 = {
    "title": "9. Project Execution Schedule & 5-Week Gantt Chart",
    "subsections": [
        {
            "title": "9.1 5-Phase, 5-Week Engineering Schedule",
            "content": """The RideX platform was engineered across an intensive 5-week schedule structured into 5 discrete phases:
- Phase 1 (Week 1): Architectural Requirements & Capacity Modeling.
- Phase 2 (Week 2): Core Ingress Gateway, Identity & Security Pipeline.
- Phase 3 (Week 3): Multi-Modal Dispatch Engine & Road Routing Pipeline.
- Phase 4 (Week 4): inDrive Dynamic Bidding Coordinator & WebSocket Gateway.
- Phase 5 (Week 5): Intercity Carpool Corridor Engine, Testing & Verification."""
        },
        {
            "title": "9.2 Engineering Gantt Chart",
            "content": """[DIAGRAM: diagram_gantt_chart.png]

| Project Phase | Milestone & Primary Work Breakdown | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Architecture & Capacity Math** | System requirements, QPS throughput derivations, bandwidth sizing, PostGIS ERD relational modeling. | **ACTIVE** | — | — | — | — | **COMPLETED** |
| **Phase 2: Ingress & Security Pipeline** | Express gateway, token-bucket rate limiting (300 req/min), bcrypt credential hashing, stateless JWT sessions. | — | **ACTIVE** | — | — | — | **COMPLETED** |
| **Phase 3: Multi-Modal Routing & Maps** | Leaflet maps, OSRM road graph engine, Haversine/Bezier mathematical fallbacks, vehicle rate cards. | — | — | **ACTIVE** | — | — | **COMPLETED** |
| **Phase 4: inDrive Bidding & WebSockets** | Full-duplex WebSocket gateway (/ws), room isolation, dynamic stepper controls, atomic mutex ride claiming. | — | — | — | **ACTIVE** | — | **COMPLETED** |
| **Phase 5: Carpooling & Verification** | Carpool corridor buffering (ST_Buffer), double-entry wallet ledger, automated Jest test suite (23 tests). | — | — | — | — | **ACTIVE** | **COMPLETED** |"""
        }
    ]
}

ALL_SECTIONS = [SEC_1, SEC_2, SEC_3, SEC_4, SEC_5, SEC_6, SEC_7, SEC_8, SEC_9]
