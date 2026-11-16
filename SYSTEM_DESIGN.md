# System Design Document: Multi-Modal Mobility & Dynamic Bidding Platform

**Project Title**: Distributed Architecture for Real-Time Ride Hailing, Dynamic Fare Negotiation (inDrive), and Intercity Carpooling  
**Course / Track**: Distributed Systems & Software Architecture (Final Project)  
**Author**: Engineering Team  
**Evaluation Target**: System Design Final Project Submission  

---

## 1. Executive Summary & Problem Statement

Urban and inter-city transportation platforms demand low-latency matching, geospatial filtering, high throughput location tracking, and fault-tolerant financial settlement. 

This project designs and implements an enterprise-grade multi-modal mobility platform that unifies three distinct transport paradigms:
1. **Intra-City On-Demand Mobility (Rapido model)**: Real-time location tracking and instant matching for Bike Taxi, Auto, Cab Economy, and Parcel Delivery.
2. **Peer-to-Peer Fare Negotiation (inDrive model)**: Two-sided dynamic bidding marketplace where passengers propose fares and nearby drivers submit counter-offers with guaranteed atomic matching.
3. **Intercity Corridor Carpooling (Carpool model)**: Route corridor deviation algorithms allowing car owners to set their own seat prices and match with long-distance co-travelers.

---

## 2. Requirements & System Scope

### 2.1 Functional Requirements
- **FR-1 (Geospatial Location Tracking)**: Real-time GPS ingestion of 1,000,000+ drivers every 3 seconds with radius-based proximity search (< 3 km).
- **FR-2 (Dynamic Fare Negotiation)**: Riders can propose custom fares; qualified drivers receive live broadcast notifications and can accept or counter-bid within a 25-second window.
- **FR-3 (Atomic Ride Assignment)**: When a passenger selects a driver bid, exactly one assignment is guaranteed; duplicate bids are immediately invalidated.
- **FR-4 (Intercity Carpooling)**: Drivers publish origin, destination, departure time, and per-seat prices; passengers can search and reserve available seats.
- **FR-5 (Cashless Wallet & Double-Entry Ledger)**: Secure wallet balance, atomic deductions upon ride completion, and complete transaction auditability.
- **FR-6 (Safety Shield & Real-Time Tracking)**: One-click SOS emergency response link generation, 4-digit security OTP verification, and live tracking map.

### 2.2 Non-Functional Requirements
- **NFR-1 (Low Latency)**: P99 latency for ride matching & driver radius search < 100 ms.
- **NFR-2 (High Availability)**: 99.99% system availability (maximum 52 minutes of downtime per year).
- **NFR-3 (Consistency)**: Strong consistency for wallet balances and seat allocations; eventual consistency for driver location pings.
- **NFR-4 (Scalability)**: Horizontally scalable compute tier supporting 10x traffic spikes during peak commute hours.
- **NFR-5 (Idempotency)**: All payment and booking write operations must be idempotent to protect against network retries.

---

## 3. Scale & Capacity Estimations

### 3.1 Assumptions
- **Daily Active Users (DAU)**: 15,000,000 riders
- **Concurrent Active Drivers**: 1,000,000 drivers online
- **Total Completed Rides / Day**: 5,000,000 rides
- **Driver Telemetry Frequency**: 1 location update every 3 seconds

### 3.2 Throughput Calculations
$$\text{Average Location Ingestion QPS} = \frac{1,000,000 \text{ drivers}}{3 \text{ seconds}} \approx 333,333 \text{ QPS}$$
$$\text{Peak Location Ingestion QPS (2x)} = 333,333 \times 2 \approx 666,666 \text{ QPS}$$

$$\text{Average Ride Booking QPS} = \frac{5,000,000 \text{ rides}}{86,400 \text{ seconds}} \approx 58 \text{ QPS}$$
$$\text{Peak Booking QPS (5x commute spike)} = 58 \times 5 \approx 290 \text{ QPS}$$
$$\text{Peak inDrive Bidding Events QPS (4 bids / request)} = 290 \times 4 \approx 1,160 \text{ events/sec}$$

### 3.3 Network Bandwidth
- **Driver GPS Payload**: `[driver_id (16B), lat (8B), lon (8B), bearing (4B), timestamp (8B), speed (4B)]` $\approx 64 \text{ Bytes}$ (JSON/Protobuf over WebSocket)
$$\text{Ingress Bandwidth} = 666,666 \text{ QPS} \times 64 \text{ Bytes} \approx 42.6 \text{ MB/s} \approx 341 \text{ Mbps}$$

### 3.4 Storage Estimations (5-Year Horizon)
- **Ride Record Payload**: $\approx 1.5 \text{ KB}$ per record
$$\text{Daily Storage} = 5,000,000 \times 1.5 \text{ KB} \approx 7.5 \text{ GB/day}$$
$$\text{Annual Storage} = 7.5 \text{ GB} \times 365 \approx 2.73 \text{ TB/year}$$
$$\text{5-Year Ride Database Storage} = 2.73 \text{ TB} \times 5 \approx 13.65 \text{ TB}$$
*(With 3x PostgreSQL cross-AZ read replicas + Write-Ahead Logging: $\approx 41 \text{ TB}$ total).*

---

## 4. High-Level Architecture (HLD)

```
                       ┌──────────────────────────────────────────────┐
                       │           Clients (Web SPA / Mobile)         │
                       │    (Riders, Drivers, Carpool Passengers)     │
                       └──────────────────────┬───────────────────────┘
                                              │ HTTPS / WSS
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          API Gateway & Load Balancer         │
                       │    (Envoy / NGINX: Rate Limiting, TLS)       │
                       └──────┬───────────────────────┬───────────────┘
                              │                       │
               ┌──────────────┴──────────────┐        │ WebSocket Sessions
               ▼                             ▼        ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      HTTP Microservices     │ │  Location Tracking Service  │
│ - inDrive Bidding Service   │ │ - Ingests 333k QPS GPS      │
│ - Carpool Corridor Service  │ │ - Spatial Indexing (Uber H3)│
│ - Wallet & Ledger Service   │ │ - Broadcasts to Nearby Units│
│ - Notification / SMS Service│ └──────────────┬──────────────┘
└──────────────┬──────────────┘                │
               │ Event Streams                 │
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Message Broker: Apache Kafka                  │
│ Topics: `driver-locations`, `ride-offers`, `bids`, `settle` │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Redis Cluster          │ │  PostgreSQL + PostGIS       │
│ - Driver spatial sets (GEO) │ │ - Persistent Ride Records   │
│ - Active Bids Hash (TTL 25s)│ │ - User & Driver Profiles    │
│ - Redlock distributed locks │ │ - Double-Entry Wallet Ledger│
│ - Session caches            │ │ - Carpool Corridors (GIST)  │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

## 5. Low-Level Component Design & Protocols

### 5.1 Geospatial Indexing: Uber H3 vs. QuadTree / Geohash
- **Choice**: **Uber H3 (Hierarchical Hexagonal Spatial Index)**
- **Justification**:
  - Regular squares/geohashes have unequal neighbor distances (diagonal neighbors are $\sqrt{2}$ times further than orthogonal neighbors).
  - Hexagons have identical distances to all 6 adjacent neighbors, eliminating spatial distortion in radius queries.
  - **Resolution 8**: Average hexagon area of $0.737 \text{ km}^2$ and edge length of $461 \text{ meters}$. A 3 km search radius corresponds precisely to an H3 `k-ring(3)` query (37 cells total), executing in under $0.5 \text{ ms}$ in memory.

### 5.2 inDrive Dynamic Bidding Protocol & State Machine
1. **Offer Submission**: Rider posts ride with custom fare $F_{\text{offer}}$. API Gateway enforces $0.6 \times F_{\text{base}} \le F_{\text{offer}} \le 3.0 \times F_{\text{base}}$.
2. **Proximity Fanout**: Location service identifies active drivers in H3 `k-ring(3)`. Request published to Kafka `ride-proposals`.
3. **Driver Counter-Offers**: Candidate drivers submit counter-bids $F_{\text{driver}}$. Stored in Redis Hash: `HSET ride:bids:{ride_id} {driver_id} {payload}` with `EXPIRE 25`.
4. **Atomic Matching & Concurrency Protection**:
   ```
   Rider clicks "Accept Bid (Driver_X)"
            │
            ▼
   Acquire Redlock mutex: "lock:ride:{ride_id}" (TTL: 5s)
            ├──> Lock Acquired:
            │       Check ride.status == 'BIDDING'
            │       UPDATE rides SET status = 'ASSIGNED', driver_id = Driver_X, agreed_fare = F
            │       Publish cancellation event to Kafka for other bidders
            │       Release Redlock
            └──> Lock Failed:
                    Return HTTP 409 Conflict ("Ride already claimed")
   ```

### 5.3 Intercity Carpool Corridor Algorithm
- **Route Polygon Buffering**: Driver registers route $R$ between cities. The route polyline is buffered by $5 \text{ km}$:
  $$\text{Corridor} = \text{ST\_Buffer}(R, 5000)$$
- **Passenger Inclusion Filter**: Passenger pickup $P_{\text{pickup}}$ and drop $P_{\text{drop}}$ must both evaluate true:
  $$\text{ST\_Contains}(\text{Corridor}, P_{\text{pickup}}) \land \text{ST\_Contains}(\text{Corridor}, P_{\text{drop}}) = \text{TRUE}$$
- **Detour Cap**: The detour path $(P_{\text{start}} \to P_{\text{pickup}} \to P_{\text{drop}} \to P_{\text{end}})$ must not exceed driver's direct route by more than $15\%$.
- **Inventory Locking**: Seat count decremented using optimistic atomic updates:
  ```sql
  UPDATE carpools
  SET available_seats = available_seats - $requested_seats
  WHERE carpool_id = $id AND available_seats >= $requested_seats;
  ```

---

## 6. Database Schema Design (PostgreSQL + PostGIS)

```sql
-- 1. Intra-City Ride Transactions
CREATE TABLE rides (
    ride_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES users(user_id),
    driver_id UUID REFERENCES drivers(driver_id),
    vehicle_type VARCHAR(20) NOT NULL, -- 'bike', 'auto', 'cab_economy', 'parcel'
    status VARCHAR(25) NOT NULL,       -- 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    pickup_geom GEOMETRY(Point, 4326) NOT NULL,
    drop_geom GEOMETRY(Point, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    drop_address TEXT NOT NULL,
    initial_offer_fare DECIMAL(8, 2) NOT NULL,
    agreed_fare DECIMAL(8, 2),
    ride_otp VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_pickup_spatial ON rides USING GIST(pickup_geom);

-- 2. inDrive Counter Bids
CREATE TABLE ride_bids (
    bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(driver_id),
    driver_proposed_price DECIMAL(8, 2) NOT NULL,
    driver_distance_km DECIMAL(4, 1),
    driver_eta_mins INT,
    status VARCHAR(15) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_bids_ride_id ON ride_bids(ride_id);

-- 3. Intercity Carpooling
CREATE TABLE carpools (
    carpool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(user_id),
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    from_point TEXT NOT NULL,
    to_point TEXT NOT NULL,
    route_geom GEOMETRY(LineString, 4326),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price_per_seat DECIMAL(8, 2) NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_carpools_spatial ON carpools USING GIST(route_geom);

-- 4. Double-Entry Wallet Ledger
CREATE TABLE wallet_ledger (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    ride_id UUID REFERENCES rides(ride_id),
    transaction_type VARCHAR(20) NOT NULL, -- 'CREDIT', 'DEBIT', 'REFUND'
    amount DECIMAL(10, 2) NOT NULL,
    idempotency_key VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Fault Tolerance & Failure Scenarios

| Failure Scenario | Mitigation Strategy |
| :--- | :--- |
| **Bidding Service Spike / Redis Outage** | Circuit Breaker trips; automatically degrades to Standard Algorithmic Pricing mode without dropping requests. |
| **Driver Drops Network in-Ride** | Client-side heartbeat check (timeout 15s). Redis keeps last known valid coordinates with dead-reckoning extrapolation. |
| **Network Retry / Duplicate Deductions** | API Gateway enforces `X-Idempotency-Key` header with Redis `SET key val NX EX 86400`. Double spend mathematically impossible. |
| **Database Master Failover** | Patroni-orchestrated PostgreSQL cluster with automated Raft consensus failover in < 15 seconds. |

---

## 8. Conclusion

This system design document validates the theoretical feasibility, low-latency execution, and ACID reliability of a unified mobility architecture combining Rapido on-demand rides, inDrive fair pricing, and intercity carpooling at industrial scale.
