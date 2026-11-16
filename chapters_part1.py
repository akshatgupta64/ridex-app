# -*- coding: utf-8 -*-
"""
RideX System Design Report - Part 1: Chapters 1 to 5
"""

CHAPTER_1 = {
    "title": "Chapter 1 — Introduction",
    "sections": [
        {
            "id": "1.1",
            "title": "Background of Ride-Hailing Platforms",
            "content": """The global urban transportation landscape has experienced a monumental paradigm shift over the past two decades. The emergence of smartphone-enabled Global Positioning System (GPS) telematics, low-latency mobile cellular networks (4G/5G), and distributed cloud infrastructure spurred the rise of Transportation Network Companies (TNCs). Pioneers such as Uber, Lyft, Ola, and Rapido digitized the traditional curb-hailing taxi industry by algorithmically dispatching vehicles based on passenger geographic proximity.

In high-density South Asian urban centers such as Bengaluru, Mumbai, Delhi, and Hyderabad, two-wheeler bike taxis and three-wheeler auto-rickshaws emerged as indispensable micro-mobility modes. They bypass chronic gridlock, offer affordable point-to-point transit, and solve critical first-mile and last-mile connectivity gaps for mass transit systems (such as Namma Metro and Delhi Metro). Concurrently, intercity corridor transit between satellite cities has grown rapidly, driven by IT corridor migration, student populations, and weekend leisure travelers.

However, modern mobility systems remain sharply fragmented. Intra-city on-demand hailing, dynamic market-driven fare negotiation, and long-distance intercity carpooling operate as completely disconnected platforms with disjointed user accounts, isolated financial balances, and redundant infrastructure."""
        },
        {
            "id": "1.2",
            "title": "Problem Statement",
            "content": """Contemporary centralized ride-hailing platforms exhibit several profound architectural and economic shortcomings:
1. Rigid, Opaque Algorithmic Surge Pricing: Platforms enforce proprietary surge pricing algorithms during peak hours or adverse weather. Passengers face exorbitant price spikes (often 200% to 300% above base fares), while drivers frequently receive only a fractional share of this surge, leading to acute passenger frustration and mistrust.
2. High Cancellation Rates and Driver Discontent: Because drivers cannot negotiate fares or view trip destinations upfront in traditional platforms, they frequently cancel rides or demand informal offline cash surcharges, undermining platform reliability.
3. High Platform Intermediary Take-Rates: Centralized aggregator monopolies levy high platform commissions ranging between 20% and 30% on every ride transaction, significantly eroding driver earnings while keeping consumer fares artificially high.
4. Segmented Urban and Regional Transit: Commuters must navigate multiple independent mobile applications for daily city rides (Rapido), price-flexible suburban trips (inDrive), and long-distance weekend corridor travel (BlaBlaCar). This forces users to maintain multiple digital wallets, fragmented trip histories, and disjointed identity profiles.
5. High Concurrency and Geospatial Telemetry Challenges: Ride-hailing backends face severe distributed systems bottlenecks: ingesting millions of concurrent high-frequency driver GPS coordinates, computing real-time spatial proximity queries, and guaranteeing atomic single-winner ride assignment during simultaneous driver bidding under distributed race conditions."""
        },
        {
            "id": "1.3",
            "title": "Motivation",
            "content": """The motivation behind the RideX project is to engineer an open, unified, and resilient mobility platform that restores market equilibrium to transportation through decentralized, peer-to-peer fare negotiation while simultaneously providing intercity corridor seat-sharing within a single high-performance software ecosystem.

By integrating the agile micro-mobility dispatch model (inspired by Rapido), a two-sided transparent bidding marketplace (inspired by inDrive), and an intercity corridor route-sharing mechanism, RideX demonstrates how advanced distributed systems design, geospatial telemetry, atomic state synchronization, and double-entry financial ledger principles can solve real-world urban mobility challenges.

Furthermore, RideX serves as a comprehensive academic and engineering benchmark for B.Tech Computer Science Engineering students, bridging theoretical computer science concepts—such as distributed locking, spatial indexing, graph routing, cryptographic authentication, and ACID transaction isolation—with practical, production-grade software execution."""
        },
        {
            "id": "1.4",
            "title": "Project Objectives",
            "content": """The primary technical objectives of the RideX platform are:
1. Unified Multi-Modal Architecture: Engineer a cohesive software platform supporting Bike Taxi, Auto Rickshaw, Cab Economy, Parcel Delivery, and Intercity Carpooling within a single unified client-server architecture.
2. Peer-to-Peer Dynamic Bidding Engine: Implement a transparent two-sided auction protocol allowing passengers to propose custom base fares and nearby drivers to submit real-time counter-offers, guaranteed by atomic concurrency locks.
3. Real-Time Telemetry and Geospatial Tracking: Develop a persistent, full-duplex WebSocket gateway capable of streaming live driver GPS coordinates, heading bearings, and vehicle kinematics to passenger maps with sub-100 millisecond latency.
4. Road-Accurate Routing and Geocoding: Integrate OpenStreetMap (OSM) spatial data, real road path calculation via the Open Source Routing Engine (OSRM), and resilient mathematical fallbacks (Haversine distance and Bezier path interpolation).
5. Intercity Corridor Matching: Formulate spatial corridor filtering logic and atomic seat inventory reservation algorithms for intercity carpooling.
6. Cashless Financial Ledger: Build a double-entry transaction ledger enforcing strict idempotency and transaction auditing across simulated wallet top-ups, ride settlements, driver earnings deductions, and passenger tips.
7. Enterprise Security Hardening: Implement defense-in-depth security including stateless HMAC-SHA256 JWT sessions, bcrypt password hashing, token-bucket rate limiting, resource ownership guards, and strict Content Security Policies (CSP).
8. Automated Verification: Build an end-to-end integration test suite validating authentication, access control, concurrent bidding, and real-time WebSocket telemetry."""
        },
        {
            "id": "1.5",
            "title": "Proposed Solution",
            "content": """RideX solves the limitations of legacy platforms by implementing an integrated, reactive, and transparent mobility ecosystem:
- Decentralized Market-Driven Pricing: Instead of an opaque black-box surge pricing algorithm, RideX empowers the rider to set their desired initial fare. Nearby drivers evaluate the route and submitted fare, deciding to either accept the price or submit competitive counter-bids.
- Multi-Modal Flexibility: Riders can select between fast solo bike taxis, economical three-wheel auto-rickshaws, air-conditioned cabs, or express parcel deliveries, with dynamic pricing formulas tailored to each vehicle class.
- Spatial Corridor Carpooling: Car owners traveling between cities (e.g., Bengaluru ➔ Mysuru, Mumbai ➔ Pune, Delhi ➔ Agra) can publish journeys with custom per-seat pricing. Passengers reserve seats along the corridor with real-time seat inventory decrements.
- High-Throughput Real-Time Gateway: A native WebSocket server architecture isolates communication channels by ride identifier, delivering live telemetry without broadcast storms or unauthorized cross-ride snooping.
- Embedded Architecture Portal: RideX features an interactive in-app System Design Explorer (`/system-design`), rendering real-time capacity mathematics, state machine diagrams, spatial corridor algorithms, and SQL schemas directly within the user interface for academic and architectural evaluation."""
        },
        {
            "id": "1.6",
            "title": "Scope of the Project",
            "content": """The scope of the RideX project encompasses:
- In Scope:
  * Full-stack implementation consisting of a Node.js/Express REST API, persistent WebSocket server, and a React 18 single-page application.
  * Interactive OpenStreetMap & Leaflet mapping with dynamic SVG markers, animated vehicle markers, and polyline route visualization.
  * Dynamic fare proposal stepper, live driver bid reception, and atomic ride assignment.
  * 4-digit security OTP verification gate for trip commencement.
  * Intercity carpool listing, search filtering by origin/destination cities, and atomic seat reservation.
  * In-memory double-entry wallet ledger supporting simulated top-ups and automatic fare deduction.
  * Emergency SOS safety toolkit generating shareable distress links and simulated dispatch.
  * Comprehensive automated test suite executed via Jest and Supertest.
- Out of Scope (Deferred to Production Roadmaps):
  * Physical integration with live banking gateways (Razorpay, Stripe, UPI PSPs); simulated ledger is used.
  * Native iOS/Android compiled binaries (the platform provides a fully responsive Progressive Web Application).
  * Direct SMS telecommunication gateways (Twilio); security OTPs and dispatch alerts are handled in-app and via WebSocket.
  * Multi-region active-active database clustering (single-region file-backed atomic store with PostgreSQL/PostGIS production blueprints)."""
        },
        {
            "id": "1.7",
            "title": "Target Users",
            "content": """The RideX platform caters to four distinct user personas:
1. Daily Urban Commuters (Riders): Individuals seeking quick, economical, and predictable intra-city transit via bike taxi, auto, or cab, who value price transparency and the ability to negotiate fares during commute spikes.
2. Driver Partners: Commercial bike, auto, and cab operators seeking fair remuneration, autonomy over which rides to accept, the ability to counter-bid on suboptimal fares, and an 85% platform payout rate.
3. Intercity Travelers and Vehicle Owners: Private car owners commuting between major economic corridors who wish to offset fuel costs, and long-distance passengers seeking comfortable, cost-effective intercity travel.
4. Platform Operations Administrators: Fleet managers and support personnel monitoring system health, platform telemetry, dispute resolutions, and ledger integrity."""
        },
        {
            "id": "1.8",
            "title": "Functional Requirements",
            "content": """The functional requirements of the RideX platform are specified below:
- FR-1: User Registration and Identity Management
  * Inputs: Full name, email address, phone number, password, role ('rider' or 'driver'), vehicle metadata (for drivers: vehicleType, model, plateNumber).
  * Processing: Validate email format, phone bounds, and password length (6–128 characters); hash password via bcrypt (salt rounds = 10); verify uniqueness; initialize user profile and digital wallet with default promo balance; generate signed JWT.
  * Outputs: HTTP 201 Created with session token and sanitized user profile (password hashes excluded).
- FR-2: User Authentication and Session Verification
  * Inputs: Email and plaintext password.
  * Processing: Verify email existence; perform constant-time bcrypt password comparison; issue HMAC-SHA256 JWT containing user identifier, email, role, and display name.
  * Outputs: HTTP 200 OK with session token; HTTP 401 Unauthorized upon invalid credentials.
- FR-3: Multi-Modal Intra-City Ride Request
  * Inputs: Pickup coordinates, drop coordinates, vehicle type ('bike', 'auto', 'cab_economy', 'parcel'), optional proposed fare, payment method ('wallet', 'cash', 'upi').
  * Processing: Calculate road distance and travel duration via OSRM (or Haversine/Bezier fallback); compute base system fare; initialize ride record in 'BIDDING' status; generate 4-digit ride OTP; synthesize initial qualified driver counter-bids; broadcast creation event via WebSocket.
  * Outputs: HTTP 201 Created with ride details, route waypoints, and initial competing driver bids.
- FR-4: Dynamic Fare Negotiation (inDrive Bidding)
  * Inputs: Custom proposed fare from passenger; counter-bids from available nearby drivers.
  * Processing: Validate proposed fare bounds; broadcast ride request to available drivers; drivers submit counter-offers with vehicle model, rating, ETA, and proposed fare; passenger evaluates bids.
  * Outputs: Real-time WebSocket delivery of `bid_created` events to subscribed rider map.
- FR-5: Atomic Bid Acceptance and Driver Assignment
  * Inputs: Ride identifier, accepted bid identifier.
  * Processing: Verify rider ownership; acquire atomic transaction lock; assert ride status is 'BIDDING'; transition ride status to 'ASSIGNED'; bind driver profile; mark selected bid 'ACCEPTED'; expire all competing bids; broadcast `bid_accepted` and `ride_status_changed` events.
  * Outputs: HTTP 200 OK with confirmed ride and driver assignment; HTTP 409 Conflict if ride is already assigned.
- FR-6: Ride Commencement via OTP Verification
  * Inputs: Ride identifier, 4-digit security OTP submitted by driver or rider.
  * Processing: Validate user authorization; assert ride status is 'ASSIGNED' or 'ARRIVED'; verify OTP matches stored `rideOtp`; transition status to 'IN_PROGRESS'; record `startedAt` timestamp; broadcast `ride_started` event.
  * Outputs: HTTP 200 OK with ride status 'IN_PROGRESS'; HTTP 400 Bad Request on invalid OTP.
- FR-7: Real-Time Telemetry and GPS Streaming
  * Inputs: WebSocket message `driver_location_updated` with `[latitude, longitude]`, speed, heading, and remaining distance.
  * Processing: Authenticate driver socket; assert driver is assigned to active ride; validate coordinate boundaries; enforce rate limit (< 10 updates/second); broadcast telemetry payload to authorized ride subscribers.
  * Outputs: Real-time map update on passenger client with vehicle position and heading rotation.
- FR-8: Trip Completion and Automated Financial Settlement
  * Inputs: Ride identifier.
  * Processing: Validate user authorization (assigned driver, rider, or admin); assert ride status is 'IN_PROGRESS'; transition status to 'COMPLETED'; calculate agreed fare; if payment method is 'wallet', deduct fare from rider's wallet and credit 85% to driver's wallet; insert double-entry ledger records with unique idempotency keys; increment driver trip count.
  * Outputs: HTTP 200 OK with completed ride receipt, updated wallet balance, and driver earnings.
- FR-9: Driver Rating and Optional In-App Tipping
  * Inputs: Ride identifier, numeric rating (1–5), feedback tags, optional tip amount (₹0–₹5000).
  * Processing: Verify rider ownership; assert ride is 'COMPLETED'; verify tip has not been previously submitted; if tip > 0, verify rider wallet balance, atomically deduct tip, credit driver wallet, and record ledger transactions.
  * Outputs: HTTP 200 OK with updated ride rating and balance confirmation.
- FR-10: Intercity Carpool Publishing and Atomic Seat Reservation
  * Inputs: Publishing: origin/destination cities, departure time, total seats, price per seat, vehicle model. Booking: carpool identifier, number of seats requested.
  * Processing: Driver publishes carpool; passenger searches carpools by city; passenger books seats; backend validates passenger is not the driver; checks `availableSeats >= requestedSeats`; checks rider wallet balance; atomically deducts total cost and decrements seat inventory; records booking record and ledger entry.
  * Outputs: HTTP 201 Created for published carpool; HTTP 200 OK for successful seat reservation with booking confirmation."""
        },
        {
            "id": "1.9",
            "title": "Non-Functional Requirements",
            "content": """The non-functional requirements governing system reliability, performance, and security are:
- NFR-1: Low Latency: API endpoints must deliver P95 response times under 150 milliseconds. WebSocket telemetry broadcasts must achieve P99 delivery latency under 80 milliseconds to ensure smooth map marker animation.
- NFR-2: High Availability: The platform architecture must be engineered for 99.99% operational availability (less than 52.6 minutes of unplanned downtime per calendar year), achieved through stateless microservice compute tiers and graceful database failover.
- NFR-3: Data Consistency: Financial ledger balances and carpool seat inventory allocations require strict ACID consistency. Driver telemetry streaming follows eventual consistency, prioritizing freshness over historical synchronization.
- NFR-4: Scalability: The system must support horizontal scaling across the stateless Node.js compute layer to accommodate peak 5x traffic surges during morning and evening rush hours without service degradation.
- NFR-5: Idempotency: All state-mutating operations—including wallet recharges, trip completions, fare deductions, and carpool seat reservations—must enforce idempotency keys (`idempotencyKey`) to guarantee zero duplicate financial transactions during client network retries.
- NFR-6: Information Security: All communications must be transport-encrypted (TLS 1.3 / WSS). Passwords must never be stored or transmitted in plaintext. User sessions must be authenticated via cryptographically signed JWT tokens, and sensitive credentials must be scrubbed from all API responses."""
        },
        {
            "id": "1.10",
            "title": "Project Constraints and Assumptions",
            "content": """The engineering design operates under the following constraints and assumptions:
- Constraints:
  * Runtime Compatibility: Node.js version must adhere to the LTS matrix (Node.js 18.x to 22.x). Note that legacy Create React App build tools require Node 20 LTS for memory-stable production bundling.
  * OpenStreetMap Usage Policies: External tile fetching and OSRM routing requests must comply with open-source community fair-use limits; hence, aggressive client-side caching and geometric fallback engines are implemented.
  * Storage Architecture: Prototype phase utilizes an atomic file-backed JSON datastore (`mobility_store.json`) with safe temp-file atomic rename semantics, while production scaling designs specify clustered PostgreSQL 16 with PostGIS.
- Assumptions:
  * Network Connectivity: Client devices maintain active mobile cellular (4G/5G) or Wi-Fi data connectivity with standard WebSocket support.
  * Geolocation Accuracy: Client hardware provides location coordinates within standard mobile GPS precision (±5 to 15 meters).
  * Currency: All financial calculations are standardized in Indian Rupees (INR, ₹) with two-decimal-place floating-point precision."""
        }
    ]
}

CHAPTER_2 = {
    "title": "Chapter 2 — Existing System and Proposed System",
    "sections": [
        {
            "id": "2.1",
            "title": "Existing Ride-Hailing Systems",
            "content": """Urban mobility markets are currently dominated by centralized Transportation Network Companies (TNCs) such as Uber, Ola, and Rapido, alongside niche peer-to-peer bidding platforms like inDrive and long-distance carpooling platforms like BlaBlaCar.

1. Uber and Ola (Centrally Dispatched Cabs): These platforms utilize proprietary machine learning algorithms to balance urban supply and demand. They compute fixed or upfront dynamic fares and assign the nearest available driver without driver-passenger interaction prior to dispatch.
2. Rapido (Intra-City Micro-Mobility): Rapido popularized bike-taxi and auto-rickshaw aggregation in India, enabling commuters to navigate congestion at low price points with rapid driver allocation.
3. inDrive (Peer-to-Peer Fare Negotiation): inDrive introduced a decentralized bidding mechanism where passengers suggest a price and drivers can accept or submit counter-offers, bypassing centralized algorithmic pricing.
4. BlaBlaCar (Intercity Carpooling): BlaBlaCar focuses exclusively on scheduled intercity corridor rides, connecting vehicle owners traveling between cities with passengers seeking affordable long-distance seats."""
        },
        {
            "id": "2.2",
            "title": "Limitations of Existing Approaches",
            "content": """Despite their widespread commercial adoption, existing platforms suffer from structural defects:
- Predatory Surge Multipliers: Centralized platforms enforce non-negotiable surge multipliers during peak hours, rain, or high-demand events, often doubling or tripling the standard fare without passenger recourse.
- High Cancellation Frequency: In centralized models, drivers are frequently dispatched to rides without full transparency regarding passenger destination or net payout. Drivers routinely cancel trips upon arrival or call passengers demanding cash payments.
- Exorbitant Aggregator Commissions: Traditional aggregators deduct 20% to 30% from the gross trip fare as platform fees, severely diminishing the driver's take-home income while driving up passenger costs.
- Rigid Take-It-or-Leave-It Models: Neither drivers nor riders possess the agency to negotiate fares based on specific route difficulty, traffic conditions, or personal urgency.
- Platform Silos: A user commuting within the city, traveling intercity for the weekend, and shipping a parcel must manage three separate applications, three distinct account profiles, and fragmented payment methods."""
        },
        {
            "id": "2.3",
            "title": "Proposed RideX Platform",
            "content": """RideX proposes a unified, transparent, and multi-modal mobility platform that converges on-demand micro-mobility hailing, dynamic fare bidding, and intercity carpooling into a cohesive distributed system:
- Driver-Passenger Fare Equilibrium: Passengers can propose custom fares using intuitive stepper controls. Nearby eligible drivers receive the request with upfront origin, destination, and distance data, allowing them to accept or submit competitive counter-bids.
- Atomic Concurrency Guarantees: When a passenger selects an optimal driver bid, distributed lock patterns ensure exactly one driver secures the ride, instantly expiring all competing bids and notifying participants in real time.
- Security-Gated Ride Lifecycle: To prevent premature ride commencement or fraudulent billing, the system enforces a cryptographically generated 4-digit security OTP that must be validated before the trip status can transition to 'IN_PROGRESS'.
- Seamless Intercity Corridor Carpooling: Drivers commuting between urban centers can publish available car seats with custom per-seat pricing. Integrated search filtering enables passengers to discover rides along travel corridors and lock seat reservations instantly.
- Transparent Financial Ledger: RideX incorporates a double-entry transaction ledger and digital wallet system. Driver payouts are fixed at 85% of collected fares (a low 15% platform fee), with full transaction auditability and idempotency protection."""
        },
        {
            "id": "2.4",
            "title": "Comparative Analysis",
            "content": """The following analytical matrix compares traditional ride-hailing aggregators, dynamic bidding platforms, intercity carpool services, and the unified RideX platform across ten critical system parameters:

| Parameter | Traditional Aggregators (Uber / Ola) | Micro-Mobility (Rapido) | Bidding Platforms (inDrive) | Carpooling (BlaBlaCar) | Unified RideX Platform |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Pricing Model** | Algorithmic Surge Monopoly | Fixed Distance Tier | Peer-to-Peer Bidding | Driver-Set Fixed Fare | Hybrid: System Base + Dynamic Bidding |
| **Fare Negotiation** | Not Supported | Not Supported | Supported (Bids/Counters) | Not Supported | Fully Supported with Live Stepper Controls |
| **Platform Commission** | 20% – 30% | 18% – 25% | ~10% | 15% – 20% | Transparent 15% (Driver receives 85%) |
| **Upfront Trip Transparency** | Restricted / Hidden | Partial | Full (Route & Fare) | Full | Full Route, Distance, Fare & Vehicle Data |
| **Multi-Modal Vehicles** | Cabs, Auto | Bike, Auto | Cabs | Private Cars Only | Bike Taxi, Auto, Cab Economy, Parcel, Carpool |
| **Intercity Corridor Sharing** | Outstation (Dedicated Cab) | City Only | City Only | Scheduled Corridor Only | Native Integrated Corridor Carpooling |
| **Real-Time Telemetry** | Proprietary Polling/Push | Real-Time GPS | Basic GPS | Static Check-in | WSS Full-Duplex Broadcast (< 80ms) |
| **Security Gates** | 4-digit OTP | 4-digit OTP | Optional / None | National ID Check | Mandatory Cryptographic 4-digit OTP |
| **Financial Ledger** | Centralized Wallet/Cards | Wallet/UPI/Cash | Cash-First Model | Payment Gateway/Escrow | Double-Entry Ledger with Idempotency Keys |
| **Platform Integration** | Siloed Cab App | Siloed Bike App | Siloed Bidding App | Siloed Outstation App | Unified Ecosystem with Shared Identity & Wallet |"""
        },
        {
            "id": "2.5",
            "title": "Advantages of RideX",
            "content": """The architectural and operational advantages of RideX include:
1. Economic Fairness and Transparency: By facilitating transparent counter-bids, RideX creates a self-balancing market clearing price. Drivers feel respected and compensated for difficult routes, substantially reducing ride cancellations.
2. Low Intermediary Take-Rate: Lowering the platform commission to a transparent 15% boosts driver earnings by 10% to 15% compared to legacy aggregators, driving organic driver supply retention.
3. True Multi-Modal Consolidation: A single user profile and wallet seamlessly fund morning bike taxi commutes, midday parcel deliveries, and weekend intercity carpool trips.
4. Resilient Real-Time Infrastructure: Room-based WebSocket channel routing eliminates broadcast spam and scales linearly with concurrent active rides.
5. Rigorous Financial Auditing: The double-entry ledger architecture guarantees that every credit to a driver or debit from a rider is permanently linked to a validated ride transaction and unique idempotency key."""
        },
        {
            "id": "2.6",
            "title": "Use Cases",
            "content": """The primary use cases supported by the RideX platform are:
- UC-1: Rapid Intra-City Solo Commute (Bike Taxi): A commuter in Indiranagar needs to reach an office in Koramangala during peak traffic. The rider requests a Bike Taxi, negotiates a ₹65 fare with a nearby driver, verifies the 4-digit OTP, and completes the trip in 18 minutes.
- UC-2: Rainy Weather Auto-Rickshaw Hailing: During heavy rain when legacy apps enforce 3x surge pricing, a rider offers ₹120 for an auto-rickshaw trip. A driver 1 km away counter-offers ₹130, which the rider accepts, establishing mutual consent.
- UC-3: Urgent Intercity Weekend Corridor Travel: A college student in Bengaluru needs to travel to Mysuru on Friday evening. Train tickets are sold out. The student searches RideX carpools, finds a driver departing Silk Board with 2 open seats at ₹340/seat, and instantly books a seat using their digital wallet balance.
- UC-4: On-Demand Parcel Courier Delivery: A local business owner books a 'Rapido Parcel' dispatch to transfer urgent documents across town, tracking the bike courier in real time on the Leaflet map.
- UC-5: Night Commute Emergency SOS: A late-night passenger triggers the integrated Safety Toolkit, generating a secure live tracking link and automated distress payload with GPS coordinates."""
        }
    ]
}

CHAPTER_3 = {
    "title": "Chapter 3 — Technology Stack and System Requirements",
    "sections": [
        {
            "id": "3.1",
            "title": "Frontend Technologies",
            "content": """The frontend tier of RideX is constructed using modern web engineering standards to deliver a responsive, single-page application (SPA):
- React 18.2.0: Utilized as the core declarative user interface framework. React 18's concurrent rendering capabilities, automatic batching, and lightweight virtual DOM ensure fluid state updates during high-frequency GPS telemetry streaming.
- React Router v6.22.3: Provides client-side declarative routing, deep linking (`/book`, `/carpool`, `/wallet`, `/rides`, `/safety-toolkit`, `/system-design`), and route guarding.
- Leaflet 1.9.4: An industry-standard open-source JavaScript mapping library for mobile-friendly interactive maps. Integrates OpenStreetMap tile layers, custom SVG vector markers, smooth polyline decoding, and map bounds recalculations.
- React-Bootstrap 2.10.1 & Bootstrap 5.3.3: Provides responsive CSS grid systems, modal dialogs, tab containers, and utility classes while adhering to strict accessibility guidelines.
- React Icons 5.0.1: Comprehensive icon library delivering scalable vector graphics for transport modes, navigation markers, and interface controls.
- React-Spinners 0.13.8 & React-Slick 0.30.2: Implements smooth loading indicators during asynchronous API calls and interactive carousel displays for career and safety showcase pages."""
        },
        {
            "id": "3.2",
            "title": "Backend Technologies",
            "content": """The backend service tier is designed around high concurrency, asynchronous non-blocking I/O, and microservice modularity:
- Node.js LTS (v18.x – v22.x): High-performance JavaScript runtime built on Google's V8 engine. Its single-threaded event loop and asynchronous libuv I/O multiplexer make it exceptionally well-suited for high-concurrency mobility APIs and persistent WebSocket streams.
- Express 5.3.0: Lightweight, robust web application framework providing routing pipelines, middleware chains, centralized error handling, and JSON body parsing.
- Modular Controller-Service-Data Architecture: The backend code is organized into distinct functional domains (`routes/auth.js`, `routes/rides.js`, `routes/carpools.js`, `routes/wallet.js`, `routes/geo.js`, `routes/contact.js`, `services/websocket.js`, `services/routing.js`), ensuring clean separation of concerns and straightforward extraction into standalone microservices."""
        },
        {
            "id": "3.3",
            "title": "Database Technologies",
            "content": """The data persistence layer is engineered with a clear separation between the implemented atomic prototype datastore and the production enterprise target:
- Implemented Datastore (File-Backed Atomic JSON Store): Implemented in `server/db.js`, this datastore uses a structured document store (`mobility_store.json`). It guarantees ACID isolation via synchronized file transactions, safe temporary-file write-and-rename mechanics (`fs.renameSync` atomic file swap), and automated forensic corruption backups on I/O failures.
- Production Target Architecture (PostgreSQL 16 + PostGIS 3.4): Designed for horizontal production scale, utilizing PostgreSQL for ACID-compliant relational data (users, rides, wallet transactions) and the PostGIS spatial extension for geospatial geometry storage (`GEOMETRY(Point, 4326)`), R-Tree spatial indexing (GIST), and spatial corridor calculations (`ST_DWithin`, `ST_Buffer`).
- In-Memory Caching & Distributed Locks (Redis 7.2 / Redlock Target): Designed for sub-millisecond driver spatial lookups (Redis GEO commands), 25-second bidding TTLs, and distributed mutex locking during concurrent bid acceptance."""
        },
        {
            "id": "3.4",
            "title": "Real-Time Communication",
            "content": """Real-time bidirectional communication is powered by:
- Native `ws` Library (v8.22.0): Lightweight, lightning-fast WebSocket implementation for Node.js.
- Full-Duplex Persistent WebSocket Gateway (`/ws`): Mounted on the main HTTP server, enabling instantaneous client-server communication without HTTP polling overhead.
- Room-Based Channel Isolation: Subscriptions are organized by `rideId` (`subscribe_ride`, `unsubscribe_ride`), ensuring that driver GPS coordinates and bidding counter-offers are dispatched strictly to authorized participants.
- Heartbeat Mechanism: 30-second ping/pong intervals automatically prune disconnected or dead sockets, maintaining memory hygiene."""
        },
        {
            "id": "3.5",
            "title": "Mapping and Geolocation",
            "content": """Geospatial and routing services are provided through an integrated multi-tier pipeline:
- OpenStreetMap (OSM): Open-source collaborative worldwide cartographic dataset supplying vector map tiles.
- Open Source Routing Machine (OSRM): High-performance routing engine that computes shortest-path driving distances, estimated travel durations, and high-fidelity road polyline geometries between coordinates via HTTP REST queries.
- Resilient Geometric Fallback Engine (`server/services/routing.js`): If external OSRM services experience latency or network outages, RideX seamlessly falls back to an internal mathematical engine computing great-circle Haversine distances and interpolating 30-point quadratic Bezier curve waypoints.
- Nominatim OSM Geocoding: Provides live address search, landmark resolution, and forward geocoding across Indian metropolitan areas."""
        },
        {
            "id": "3.6",
            "title": "Authentication and Security",
            "content": """Security mechanisms implemented within the codebase include:
- JSON Web Tokens (jsonwebtoken v9.0.3): Stateless HMAC-SHA256 tokens carrying cryptographically signed claims (`id`, `email`, `role`, `name`) with a 7-day expiration window.
- Password Cryptography (bcryptjs v3.0.3): One-way cryptographic adaptive hashing with salt generation (cost factor = 10), protecting user credentials against rainbow table and brute-force attacks.
- Helmet-Equivalent Security Headers (`server/middleware/security.js`): Strict HTTP headers including Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options: nosniff, and X-Frame-Options: DENY.
- Token-Bucket Rate Limiter: In-memory sliding rate limiting enforcing 300 requests/minute on general endpoints, 30 requests/15 minutes on authentication routes, and 10 requests/10 minutes on contact enquiries.
- Resource Ownership Guards: Middleware and route-level verification guaranteeing that only the ride creator can accept bids or cancel rides, and only assigned drivers can submit GPS telemetry."""
        },
        {
            "id": "3.7",
            "title": "Development Tools",
            "content": """The development and testing toolchain consists of:
- Development Environment: Visual Studio Code with ESLint and Prettier.
- Automated Test Runner: Jest 29.x and Supertest 7.3.1 for automated HTTP and WebSocket integration testing.
- Architecture Diagramming: diagrams.net (Draw.io), PlantUML, and Mermaid.js for structural and behavioural UML diagrams.
- Version Control: Git with GitHub for branch management and collaborative commit tracking."""
        },
        {
            "id": "3.8",
            "title": "Hardware Requirements",
            "content": """Minimum and recommended hardware configurations are defined as follows:

1. Developer / Evaluation Workstation:
   - Processor: Intel Core i5 / AMD Ryzen 5 (4 cores, 2.5 GHz or higher).
   - Memory: 8 GB RAM minimum (16 GB recommended for concurrent React build and Node.js testing).
   - Storage: 2 GB available SSD storage.
   - Network: Broadband internet connection for external OpenStreetMap tile streaming.

2. Production Server Node (Single Instance Benchmark):
   - Compute: 4 vCPU (x86_64 or ARM64 Graviton).
   - Memory: 8 GB DDR4 ECC RAM.
   - Storage: 100 GB NVMe SSD (minimum 3,000 IOPS).
   - Ingress Bandwidth: 1 Gbps network interface supporting peak 42.6 MB/s GPS ingestion."""
        },
        {
            "id": "3.9",
            "title": "Software Requirements",
            "content": """Software runtime dependencies and operating environment constraints:
- Operating System: Cross-platform (Windows 10/11, Ubuntu 22.04 LTS Linux, or macOS Sonoma).
- Runtime Environment: Node.js 18.x or 20.x LTS (Node 20.x LTS strongly recommended).
- Package Manager: npm v9.x or v10.x.
- Supported Client Browsers: Modern evergreen browsers with ES6 and WebSocket support (Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 115+, Safari 16+)."""
        }
    ]
}

CHAPTER_4 = {
    "title": "Chapter 4 — High-Level Design (HLD)",
    "sections": [
        {
            "id": "4.1",
            "title": "Overall System Architecture",
            "content": """The high-level architecture of RideX follows a modern tiered microservices pattern designed for high availability, fault isolation, and horizontal scalability. The platform decouples client interactions, ingress edge routing, application compute services, messaging pipelines, and persistent storage tiers.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|   +-----------------------+   +-----------------------+   +--------------------+  |
|   |   Rider Web/Mobile    |   |   Driver Partner App  |   | Intercity Carpool  |  |
|   |  React 18 SPA (Leaflet) | | (GPS Telemetry / Bids)|   |  Passenger Portal  |  |
|   +-----------------------+   +-----------------------+   +--------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
                                           v
+-----------------------------------------------------------------------------------+
|                            INGRESS & EDGE GATEWAY TIER                            |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Reverse Proxy / LB |  | Security Headers   |  | Rate Limiter (Token Bucket) |  |
|  | TLS 1.3 Offloading |  | (CSP, HSTS, CORS)  |  | (300 req/min, X-Request-ID) |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | Internal Routing
                     +---------------------+---------------------+
                     |                                           |
                     v                                           v
+------------------------------------+   +------------------------------------------+
|       STATELESS REST SERVICES      |   |        REAL-TIME WEBSOCKET GATEWAY       |
|  - Auth & RBAC Service             |   |  - Full-Duplex WSS Server (/ws)          |
|  - Ride Hailing & Dispatch Engine  |   |  - Room-Based Channel Router             |
|  - inDrive Dynamic Bidding Service |   |  - Driver Telemetry Streamer (<80ms)     |
|  - Intercity Carpool Manager       |   |  - Bid Broadcast Coordinator             |
|  - Double-Entry Wallet Ledger      |   |  - Heartbeat & Socket Lifecycle Watcher  |
|  - OSRM / Geocoding Service        |   +------------------------------------------+
+-----------------+------------------+                          |
                  |                                             |
                  +---------------------+-----------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                         PERSISTENCE & DATA STORAGE TIER                           |
|  +-------------------------------------+   +------------------------------------+ |
|  |        Implemented Prototype        |   |      Production Target Cluster     | |
|  | - Atomic File-Backed JSON Datastore |   | - Clustered PostgreSQL 16 + PostGIS| |
|  | - Synchronized Atomic Rename Swaps  |   | - GIST Spatial Spatial Indexing    | |
|  | - Automated Forensic Backup Engine  |   | - Redis 7.2 Cluster (Redlock / GEO)| |
|  +-------------------------------------+   +------------------------------------+ |
+-----------------------------------------------------------------------------------+
```"""
        },
        {
            "id": "4.2",
            "title": "Client-Server Architecture",
            "content": """The client-server interaction adheres to a hybrid synchronous/asynchronous model:
1. Synchronous REST Channel (HTTP/2 over TLS): Employed for request-response transactions requiring immediate transactional consistency, including user authentication, ride creation, bid acceptance, carpool booking, wallet top-ups, and user profile retrieval.
2. Asynchronous Real-Time Channel (WSS): A persistent, bi-directional WebSocket connection handles high-frequency location streaming, live driver counter-bids, and state machine transition broadcasts. When an event occurs on the REST channel (such as a passenger accepting a bid), the backend immediately triggers an internal broadcast to all WebSocket clients subscribed to that specific `rideId` room."""
        },
        {
            "id": "4.3",
            "title": "Frontend Architecture",
            "content": """The frontend application follows an idiomatic React 18 component hierarchy governed by single-directional data flow and centralized context state providers:
- Component Tree Organization:
  * Application Root (`src/App.js`): Houses global top-level providers (`ErrorBoundary`, `AuthProvider`, `DataProvider`) and route switchboards.
  * Navigation Bar (`src/Components/Navbar`): Manages authentication state, user badges, wallet balance pills, and navigation links.
  * Booking Application Core (`src/Components/Booking/BookingApp.jsx`): A rich master component managing multi-modal vehicle tabs, address search inputs, pricing steppers, driver bid cards, OTP modals, and trip completion receipts.
  * Interactive Map View (`src/Components/Booking/InteractiveMap.jsx`): Encapsulates the Leaflet map container, custom SVG marker rendering, animated driver position interpolation, and route polyline overlay.
  * System Design Visualizer (`src/Components/SystemDesign/SystemDesign.jsx`): Interactive educational dashboard displaying system architecture, capacity math, state machines, and PostGIS schemas.
- State Management: Centralized via React Context (`AuthContext.js` and `Context.js`), providing authentication tokens, user profiles, and active ride references throughout the component tree without prop-drilling."""
        },
        {
            "id": "4.4",
            "title": "Backend Service Architecture",
            "content": """The backend is constructed as a modular service platform:
- Ingress Layer (`server/index.js`): Configures security middleware, rate limiters, body parsers, health check probes (`GET /api/health`), and static SPA file delivery.
- Route Controllers (`server/routes/`): Decoupled routers managing domain endpoints:
  * `auth.js`: User registration, credential login, profile querying.
  * `rides.js`: Ride creation, bidding lifecycle, OTP validation, ride completion, rating, and cancellation.
  * `carpools.js`: Intercity corridor publishing, multi-city filtering, atomic seat reservation.
  * `wallet.js`: Ledger auditing, balance retrieval, idempotent simulated recharges.
  * `geo.js`: Road routing path queries, Nominatim forward geocoding, nearby driver fleet queries.
  * `contact.js`: Support enquiries and input sanitization.
- Business Logic & Services (`server/services/`):
  * `routing.js`: Encapsulates OSRM HTTP communication and mathematical fallback logic.
  * `websocket.js`: Manages WebSocket client metadata, subscription rooms, telemetry rate-limiting, and payload broadcasting."""
        },
        {
            "id": "4.5",
            "title": "Database Architecture",
            "content": """The database architecture bridges prototype implementation with enterprise production design:
- Implemented Datastore: Maintained in `server/db.js` using an in-memory transactional cache backed by a JSON document file (`mobility_store.json`). Mutations are wrapped in `db.transaction(fn)`, which reads the current state, executes the mutative lambda, writes to a temporary file (`mobility_store.json.tmp`), and executes an atomic file system rename (`fs.renameSync`).
- Production Database Blueprint: An enterprise relational schema engineered in PostgreSQL 16 with PostGIS spatial extensions. Relational integrity is enforced via foreign key constraints (`rides.rider_id REFERENCES users(user_id)`), CHECK constraints on status enums, and unique constraints on transaction idempotency keys. Spatial coordinates are indexed with Generalized Search Trees (GIST) on PostGIS geometries."""
        },
        {
            "id": "4.6",
            "title": "External Service Integration Architecture",
            "content": """RideX integrates with three key external infrastructure services:
1. OSRM Road Routing API (`router.project-osrm.org`): The backend issues asynchronous HTTP GET requests transmitting pickup and drop coordinates. OSRM returns driving distances (in meters), durations (in seconds), and detailed polyline coordinates reflecting actual road topography.
2. OpenStreetMap Nominatim Geocoding API (`nominatim.openstreetmap.org`): Provides structured forward geocoding across Indian cities. Queries are debounced on the client (300 ms) and restricted to Indian administrative boundaries (`countrycodes=in`).
3. OpenStreetMap Cartographic Tile Servers: The client-side Leaflet instance streams raster map tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) directly into the browser viewport under standard caching headers."""
        },
        {
            "id": "4.7",
            "title": "Data Flow Architecture",
            "content": """The platform's data flow is characterized by two distinct levels of abstraction:

1. Data Flow Diagram Level 0 (Context Diagram):
```
+--------------+               Ride Request / Proposed Fare              +-------------------+
|              | ------------------------------------------------------> |                   |
|              | <------------------------------------------------------ |                   |
|    Rider     |               Driver Counter-Bids & Live Map Telemetry   |                   |
|              |                                                         |                   |
|              |               Reserve Carpool Seats / Wallet Top-Up     |                   |
|              | ------------------------------------------------------> |                   |
+--------------+                                                         |                   |
                                                                         |   RIDEX MOBILITY  |
+--------------+               Live GPS Telemetry / Accept or Counter-Bid|      PLATFORM     |
|              | ------------------------------------------------------> |                   |
|    Driver    | <------------------------------------------------------ |                   |
|              |               Assigned Ride Notifications & Earnings    |                   |
+--------------+                                                         |                   |
                                                                         |                   |
+--------------+               Road Routing & Polyline Coordinates       |                   |
|   External   | <------------------------------------------------------ |                   |
| Routing/Maps | ------------------------------------------------------> |                   |
| (OSM / OSRM) |               Forward Geocoding & Route Geometries      +-------------------+
+--------------+
```

2. Data Flow Diagram Level 1 (Decomposed Architecture):
Passenger inputs flow through the API Gateway, which authenticates the JWT and hands off to the Ride Booking Service. The Ride Service computes the road distance via the Routing Engine, records the ride in the Datastore, and triggers the inDrive Bidding Engine. The Bidding Engine notifies nearby drivers via the WebSocket Gateway. Driver counter-bids flow into the Datastore and are broadcast back to the passenger. Upon passenger acceptance, the Atomic Mutex locks the ride, updates status to 'ASSIGNED', and initiates the trip lifecycle."""
        },
        {
            "id": "4.8",
            "title": "Deployment Architecture",
            "content": """RideX supports two deployment topologies:

1. Unified Single-Instance Deployment (Implemented & Verified):
A unified Node.js process hosts both the REST API, WebSocket server, and static React SPA assets. When `npm run build` is executed, production-optimized static files are generated in `build/`. `server/index.js` mounts `express.static('build')` with 1-year immutable caching for `/static/*` and SPA fallback routing for client URLs. This topology runs cleanly on a single cloud VM (e.g., AWS EC2, DigitalOcean Droplet, or Render) behind an Nginx reverse proxy.

2. Enterprise Microservices Target Deployment (Production Scaling Blueprint):
In production, services are partitioned into containerized pods managed by Kubernetes (EKS/GKE):
- Ingress: AWS Application Load Balancer / Cloudflare CDN terminating TLS 1.3 and distributing traffic.
- Compute Tier: Independent autoscaling deployment sets for the REST API and WebSocket Gateway pods.
- Message Broker: Multi-node Apache Kafka cluster for event streaming (`driver-locations`, `ride-offers`, `wallet-settle`).
- Caching Tier: AWS ElastiCache for Redis (cluster mode enabled) managing spatial geohashes and distributed locks.
- Database Tier: AWS RDS PostgreSQL 16 Multi-AZ with Read Replicas and PostGIS extensions."""
        },
        {
            "id": "4.9",
            "title": "System Boundary Diagram",
            "content": """The system boundary establishes strict trust perimeters across four discrete security rings:
- Ring 0: Public Untrusted Internet: Comprises passenger mobile browsers, driver smartphones, and third-party web crawlers. All data must arrive over TLS 1.3 (HTTPS/WSS).
- Ring 1: DMZ and Edge Gateway Perimeter: Governed by Nginx/Envoy reverse proxies and Express security middleware (`securityHeaders`, `rateLimiter`, `corsMiddleware`). Requests are inspected, rate-limited, and assigned a tracing `X-Request-Id`.
- Ring 2: Private Compute Subnet: Contains the Node.js application services, REST controllers, and WebSocket connection state. Unauthenticated requests are rejected at the perimeter by JWT verification middleware.
- Ring 3: Secure Data and Persistence Tier: Contains the database and ledger files. Direct external access is strictly prohibited; all read and write transactions must originate from authenticated application services."""
        }
    ]
}

CHAPTER_5 = {
    "title": "Chapter 5 — Low-Level Design (LLD)",
    "sections": [
        {
            "id": "5.1",
            "title": "Module Decomposition",
            "content": """The RideX platform is decomposed into 13 discrete, highly cohesive, and loosely coupled functional modules:
1. Authentication Module (`server/routes/auth.js`, `server/utils/auth.js`, `server/middleware/auth.js`)
2. User Management Module (`server/routes/auth.js`)
3. Ride Management Module (`server/routes/rides.js`)
4. Fare Negotiation Module (`server/routes/rides.js`, `src/Components/Booking/BookingApp.jsx`)
5. Driver Management Module (`server/routes/geo.js`, `server/routes/auth.js`)
6. Real-Time Location Tracking Module (`server/services/websocket.js`, `src/hooks/useRideSocket.js`)
7. Carpool Management Module (`server/routes/carpools.js`)
8. Seat Reservation Module (`server/routes/carpools.js`)
9. Payment and Wallet Ledger Module (`server/routes/wallet.js`, `server/routes/rides.js`)
10. Notification and Alerting Module (`server/services/websocket.js`, `src/Components/Booking/BookingApp.jsx`)
11. Routing and Geolocation Module (`server/services/routing.js`, `server/routes/geo.js`)
12. Database Access Layer (`server/db.js`)
13. Centralized Error Handling and Security Module (`server/middleware/security.js`, `server/index.js`)"""
        },
        {
            "id": "5.2",
            "title": "Authentication Module",
            "content": """- Purpose: Enforce secure identity onboarding, credential validation, role attribution, and cryptographic session generation.
- Inputs: User registration payload (`name`, `email`, `phone`, `password`, `role`, vehicle details) or login credentials (`email`, `password`).
- Outputs: HTTP 201 Created or HTTP 200 OK containing stateless JWT session token and sanitized user profile object.
- Processing Logic:
  1. Validate email syntax via regular expression (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
  2. Verify phone number length (8–20 chars) and password complexity (6–128 chars).
  3. Query database to ensure email uniqueness (case-insensitive check).
  4. Generate cryptographic salt and hash plaintext password using bcrypt (cost 10).
  5. Assign unique user identifier (`usr-<uuid>` or `drv-<uuid>`).
  6. Sign JWT with HMAC-SHA256 using server-secret key `JWT_SECRET` and 7-day expiration.
- Dependencies: `bcryptjs`, `jsonwebtoken`, `crypto`, `server/db.js`.
- Failure Scenarios: Duplicate email submission triggers HTTP 409 Conflict; malformed credentials trigger HTTP 400 Bad Request; invalid passwords trigger HTTP 401 Unauthorized; missing production `JWT_SECRET` causes immediate server startup abort."""
        },
        {
            "id": "5.3",
            "title": "User Management Module",
            "content": """- Purpose: Provide authenticated profile discovery, account role verification, and synchronized wallet state.
- Inputs: HTTP GET request with Bearer authorization header to `/api/auth/me`.
- Outputs: JSON payload containing user identity metadata, linked driver profile (if role is 'driver'), and current wallet balances.
- Processing Logic:
  1. Extract and decode JWT Bearer token via `authenticateToken` middleware.
  2. Query user entity by decoded `req.user.id`.
  3. Strip sensitive fields (`passwordHash`) via `sanitizeUser()`.
  4. Fetch user's dedicated wallet record from `wallets[userId]`.
  5. Return composite JSON response.
- Failure Scenarios: Missing or expired token yields HTTP 401 Unauthorized; deleted user accounts yield HTTP 404 Not Found."""
        },
        {
            "id": "5.4",
            "title": "Ride Management Module",
            "content": """- Purpose: Supervise the end-to-end lifecycle of on-demand intra-city rides across creation, vehicle allocation, OTP security validation, and completion.
- Inputs: Pickup and destination coordinates, vehicle classification, custom proposed fare, payment preference.
- Outputs: Initialized ride object containing tracking identifier (`RAP-XXXXX`), status 'BIDDING', 4-digit OTP, recommended fare, and initial counter-bids.
- Processing Logic:
  1. Validate coordinate boundaries: Latitude $\\in [-90, 90]$, Longitude $\\in [-180, 180]$.
  2. Query `services/routing.js` to obtain road path distance, duration, and route waypoints.
  3. Calculate baseline fare using vehicle rate cards:
     $$\text{Fare}_{\text{bike}} = 25 + \max(0, \text{dist} - 1.5) \\times 9$$
     $$\text{Fare}_{\text{auto}} = 35 + \max(0, \text{dist} - 1.5) \\times 14$$
     $$\text{Fare}_{\text{cab}} = 70 + \max(0, \text{dist} - 2.0) \\times 18$$
  4. Generate cryptographic 4-digit security OTP via `crypto.randomInt(1000, 10000)`.
  5. Commit ride record to storage within an atomic transaction.
- Failure Scenarios: Coordinates out of bounds trigger HTTP 400 Bad Request; invalid vehicle types trigger HTTP 400."""
        },
        {
            "id": "5.5",
            "title": "Fare Negotiation Module",
            "content": """- Purpose: Coordinate two-sided peer-to-peer fare bidding between riders and nearby drivers, guaranteeing atomic ride assignment.
- Inputs: Passenger proposed fare; driver counter-bids (`driverPrice`, `etaMins`, `distanceKm`); acceptance command with `bidId`.
- Outputs: Competitive bid objects broadcast over WebSockets; atomic assignment confirmation.
- Processing Logic:
  1. Passenger submits custom fare via stepper controls.
  2. Backend synthesizes or ingests competing bids from nearby available drivers.
  3. Bids are broadcast via WebSocket event `bid_created`.
  4. When the rider accepts a bid via `POST /api/rides/:id/accept-bid`:
     a. Assert requester identity matches `ride.riderId` (ownership check).
     b. Within atomic transaction, verify `ride.status === 'BIDDING'`.
     c. Transition ride status to 'ASSIGNED', bind `driverId` and `agreedFare`.
     d. Mark chosen bid 'ACCEPTED' and set all other competing bids to 'EXPIRED'.
     e. Broadcast `bid_accepted` and `ride_status_changed` events.
- Failure Scenarios: Unauthorized user attempting bid acceptance triggers HTTP 403 Forbidden; concurrent acceptance of already assigned rides triggers HTTP 409 Conflict."""
        },
        {
            "id": "5.6",
            "title": "Driver Management Module",
            "content": """- Purpose: Manage commercial driver partner profiles, ratings, vehicle classifications, registration plates, and online availability.
- Inputs: Driver onboarding data, vehicle model, plate number; status toggle requests ('ONLINE' / 'OFFLINE').
- Outputs: Publicly sanitized driver partner cards with ratings, vehicle details, and spatial coordinates.
- Processing Logic:
  1. Drivers register with initial 5.0 rating and 0 completed trips.
  2. Endpoint `GET /api/geo/drivers` filters sensitive personally identifiable information (PII) like phone numbers, exposing only public fields (name, vehicle type, rating, plate number, coordinates) for client map display.
  3. Successful ride completions automatically increment driver trip count and wallet earnings."""
        },
        {
            "id": "5.7",
            "title": "Real-Time Location Tracking Module",
            "content": """- Purpose: Ingest, validate, and broadcast real-time driver GPS coordinates to subscribed passenger clients with minimum latency.
- Inputs: WebSocket message `driver_location_updated` containing `rideId` and payload `[lat, lng]`, speed, heading, and remaining distance.
- Outputs: Real-time telemetry broadcast to all sockets in the ride's subscription room.
- Processing Logic:
  1. Authenticate socket metadata to confirm driver identity.
  2. Verify driver is assigned to the specified `rideId`.
  3. Validate GPS coordinates within legal geographic ranges.
  4. Apply high-frequency telemetry rate limiter: drop updates arriving faster than 10 Hz (100 ms threshold) to avoid socket queue exhaustion.
  5. Fan out location payload to all authorized active subscribers."""
        },
        {
            "id": "5.8",
            "title": "Carpool Management Module",
            "content": """- Purpose: Facilitate intercity route sharing by allowing vehicle owners to publish scheduled journeys and passengers to discover rides.
- Inputs: Origin city, destination city, departure time, car model, available seats, price per seat, features, and route notes.
- Outputs: Published carpool record with unique identifier (`CP-XXXX`).
- Processing Logic:
  1. Enforce authentication via JWT Bearer token.
  2. Validate total seat capacity (1–6 seats) and seat price bounds (> ₹0 and < ₹100,000).
  3. Generate unique carpool identifier and persist to storage.
  4. Provide query filtering via `GET /api/carpools?from=cityA&to=cityB` with case-insensitive substring matching."""
        },
        {
            "id": "5.9",
            "title": "Seat Reservation Module",
            "content": """- Purpose: Execute atomic seat bookings on intercity carpools, deducting passenger wallet balances and locking inventory.
- Inputs: Carpool identifier, number of seats requested.
- Outputs: Booking confirmation record (`CP-BK-<uuid>`) and updated carpool inventory.
- Processing Logic:
  1. Verify passenger is authenticated and is not the driver of the carpool.
  2. Within an atomic transaction:
     a. Assert `carpool.availableSeats >= requestedSeats`.
     b. Calculate `totalCost = carpool.pricePerSeat * requestedSeats`.
     c. Verify passenger's wallet balance $\\ge \text{totalCost}$.
     d. Deduct total cost from passenger wallet; insert debit entry in `walletLedger`.
     e. Decrement `availableSeats` by requested seats.
     f. Generate and record `carpoolBooking` receipt.
- Failure Scenarios: Booking one's own carpool returns HTTP 400; insufficient available seats returns HTTP 400; insufficient wallet balance returns HTTP 400 with recharge prompt."""
        },
        {
            "id": "5.10",
            "title": "Payment and Wallet Ledger Module",
            "content": """- Purpose: Maintain an auditable, double-entry financial ledger governing passenger payments, driver earnings, and wallet top-ups.
- Inputs: Wallet balance queries, simulated top-up requests (`amount`, `idempotencyKey`), ride settlement triggers, tips.
- Outputs: Updated wallet balances and chronological transaction ledger passbook.
- Processing Logic:
  1. Enforce idempotency: Before executing any balance modification, check whether `idempotencyKey` already exists in `walletLedger` for that user. If found, return the existing transaction record without duplicate balance mutations.
  2. Upon trip completion (`POST /api/rides/:id/complete`):
     a. Deduct agreed fare from rider wallet (or collect cash).
     b. Credit 85% of fare to driver wallet as net earnings (15% platform retention).
     c. Insert linked CREDIT and DEBIT transactions into `walletLedger` with unique UUIDs.
  3. Driver tips are transferred 100% directly from rider wallet to driver wallet."""
        },
        {
            "id": "5.11",
            "title": "Notification and Alerting Module",
            "content": """- Purpose: Dispatch asynchronous operational alerts, emergency SOS signals, and trip status updates.
- Inputs: State machine transitions, SOS trigger activations.
- Outputs: WebSocket event broadcasts (`ride_status_changed`, `ride_started`, `ride_completed`, `ride_cancelled`); emergency contact distress links.
- Processing Logic:
  1. In-app SOS button generates a cryptographic public tracking link (`https://ridex.app/track/<rideId>?token=...`).
  2. Formulates an SMS distress template with current GPS coordinates and driver vehicle plate number for rapid forwarding to emergency contacts."""
        },
        {
            "id": "5.12",
            "title": "Database Access Layer",
            "content": """- Purpose: Provide synchronized, thread-safe, and ACID-isolated read and write operations against the persistent datastore.
- Inputs: Datastore read calls; mutative transaction callbacks (`db.transaction(fn)`).
- Outputs: Consistent database snapshots or committed entity updates.
- Processing Logic:
  1. `db.read()`: Reads `mobility_store.json` using synchronous file I/O. If missing, initializes default seed structure; if corrupt, backs up damaged file with timestamp and recovers clean state.
  2. `db.write(data)`: Serializes JSON payload, writes to temporary file (`mobility_store.json.tmp`), and executes atomic OS-level rename (`fs.renameSync`).
  3. `db.transaction(fn)`: Synchronously executes mutative business logic inside a critical section, ensuring that concurrent operations execute sequentially without dirty writes."""
        },
        {
            "id": "5.13",
            "title": "Error Handling and Fault Resilience",
            "content": """- Purpose: Intercept runtime anomalies, prevent server crashes, sanitize error responses, and preserve audit trails.
- Processing Logic:
  1. Centralized Express error handler (`server/index.js` lines 105–116): Captures unhandled exceptions; suppresses stack traces in production (`process.env.NODE_ENV === 'production'`), returning generic 'Internal server error'.
  2. Distributed Tracing: Every HTTP request is tagged with a unique `X-Request-Id` UUID for correlation across application logs.
  3. Graceful Shutdown Handler: Intercepts `SIGINT` and `SIGTERM` signals, closes active HTTP/WebSocket servers, terminates client connections cleanly, and enforces a 10-second hard exit timeout."""
        }
    ]
}
