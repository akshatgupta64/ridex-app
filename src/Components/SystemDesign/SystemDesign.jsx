import React, { useState } from "react";
import "./systemDesign.css";
import {
  FaNetworkWired,
  FaCalculator,
  FaGavel,
  FaCarSide,
  FaDatabase,
  FaShieldAlt,
  FaLayerGroup,
  FaCheckCircle,
  FaBolt,
  FaServer
} from "react-icons/fa";

const SystemDesign = () => {
  const [activeTab, setActiveTab] = useState("architecture");

  return (
    <div className="system-design-container">
      {/* Top Header */}
      <div className="sd-header text-center">
        <div className="container" style={{ maxWidth: "1000px" }}>
          <span className="badge bg-warning text-dark fw-bold mb-2 px-3 py-1 text-uppercase">
            Final Project Documentation
          </span>
          <h2 className="fw-bolder mb-2 text-white">
            System Design & Architecture: Multi-Modal Mobility Platform
          </h2>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: "750px" }}>
            Comprehensive architectural specifications for an ultra-scale ride hailing,
            inDrive-style dynamic fare negotiation, and intercity carpooling distributed system.
          </p>

          {/* Navigation Pills */}
          <div className="d-flex justify-content-center gap-2 overflow-auto pb-2">
            <button
              className={`sd-nav-pill ${activeTab === "architecture" ? "active" : ""}`}
              onClick={() => setActiveTab("architecture")}
            >
              <FaNetworkWired className="me-1" /> High-Level Architecture
            </button>
            <button
              className={`sd-nav-pill ${activeTab === "capacity" ? "active" : ""}`}
              onClick={() => setActiveTab("capacity")}
            >
              <FaCalculator className="me-1" /> Scale & Capacity Math
            </button>
            <button
              className={`sd-nav-pill ${activeTab === "bidding" ? "active" : ""}`}
              onClick={() => setActiveTab("bidding")}
            >
              <FaGavel className="me-1" /> inDrive Bidding Protocol
            </button>
            <button
              className={`sd-nav-pill ${activeTab === "carpool" ? "active" : ""}`}
              onClick={() => setActiveTab("carpool")}
            >
              <FaCarSide className="me-1" /> Carpool Corridor Algorithm
            </button>
            <button
              className={`sd-nav-pill ${activeTab === "schema" ? "active" : ""}`}
              onClick={() => setActiveTab("schema")}
            >
              <FaDatabase className="me-1" /> Data & Schema Design
            </button>
            <button
              className={`sd-nav-pill ${activeTab === "resilience" ? "active" : ""}`}
              onClick={() => setActiveTab("resilience")}
            >
              <FaShieldAlt className="me-1" /> Resilience & Security
            </button>
          </div>
        </div>
      </div>

      <div className="container mt-4" style={{ maxWidth: "1100px" }}>
        {/* TAB 1: HIGH-LEVEL ARCHITECTURE */}
        {activeTab === "architecture" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaLayerGroup className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">Tiered Microservices Architecture</h4>
              </div>
              <p className="text-secondary small">
                The platform is decoupled into event-driven microservices designed for 99.99% availability,
                sub-100ms API response latency, and massive horizontal scaling.
              </p>

              {/* Architecture Tier Visualization */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="arch-node">
                    <span className="sd-tag mb-2">Client Tier</span>
                    <h6 className="fw-bold text-white mb-1">Rider & Driver Apps</h6>
                    <small className="text-secondary d-block">
                      React 18 SPA, PWA, WebSocket Client, Leaflet/MapLibre
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="arch-node">
                    <span className="sd-tag mb-2">Ingress Tier</span>
                    <h6 className="fw-bold text-white mb-1">API Gateway</h6>
                    <small className="text-secondary d-block">
                      Envoy / NGINX, TLS Termination, Token Bucket Rate Limiting, JWT Auth
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="arch-node">
                    <span className="sd-tag mb-2">Compute Tier</span>
                    <h6 className="fw-bold text-white mb-1">Microservices</h6>
                    <small className="text-secondary d-block">
                      Location Engine, inDrive Bidding Service, Carpool Matching, Wallet Ledger
                    </small>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="arch-node">
                    <span className="sd-tag mb-2">Persistence Tier</span>
                    <h6 className="fw-bold text-white mb-1">Storage & Streaming</h6>
                    <small className="text-secondary d-block">
                      PostgreSQL + PostGIS, Redis Cluster (Spatial), Apache Kafka, S3
                    </small>
                  </div>
                </div>
              </div>

              {/* Functional Microservices Breakdown */}
              <h5 className="fw-bold text-white mt-4 mb-3">Core Microservices Breakdown</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-warning text-dark">01</span>
                      <strong className="text-white">Geospatial & Location Service</strong>
                    </div>
                    <p className="text-secondary small mb-2">
                      Ingests driver telemetry via WebSockets every 3 seconds. Uses Uber H3
                      hexagonal hierarchical spatial index (Resolution 8 ~ 460m radius) cached in
                      Redis Geospatial sets for constant-time radius queries: O(N) where N &lt; 50 drivers.
                    </p>
                    <span className="sd-tag">Redis GEOADD / GEORADIUS</span>
                    <span className="sd-tag ms-1">Uber H3 Index</span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-warning text-dark">02</span>
                      <strong className="text-white">inDrive Fare Negotiation Engine</strong>
                    </div>
                    <p className="text-secondary small mb-2">
                      Handles dynamic bidding state machine. Broadcasts customer fare proposals to
                      qualified nearby drivers over WebSocket channels with a 25-second TTL. Prevents
                      race conditions via Redis distributed locks (Redlock).
                    </p>
                    <span className="sd-tag">Distributed State Machine</span>
                    <span className="sd-tag ms-1">Redlock Mutex</span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-warning text-dark">03</span>
                      <strong className="text-white">Intercity Carpool Matching Service</strong>
                    </div>
                    <p className="text-secondary small mb-2">
                      Computes corridor route deviation polygons. Matches passenger pickup/drop
                      points with planned intercity driver routes within an allowed 15-minute / 5km
                      detour tolerance using PostGIS ST_DWithin and R-Tree spatial indexing.
                    </p>
                    <span className="sd-tag">PostGIS ST_DWithin</span>
                    <span className="sd-tag ms-1">R-Tree Spatial Index</span>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-warning text-dark">04</span>
                      <strong className="text-white">Transactional Wallet Ledger Service</strong>
                    </div>
                    <p className="text-secondary small mb-2">
                      Implements double-entry bookkeeping with ACID transactions in PostgreSQL.
                      Guarantees zero double-spend or race conditions using Idempotency Keys and
                      optimistic concurrency control (`version` column).
                    </p>
                    <span className="sd-tag">Double-Entry Bookkeeping</span>
                    <span className="sd-tag ms-1">Idempotency Keys</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCALE & CAPACITY MATH */}
        {activeTab === "capacity" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCalculator className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">Mathematical Scale & Capacity Estimation</h4>
              </div>
              <p className="text-secondary small">
                First-principles capacity planning based on 25 Million registered users, 1 Million
                daily active drivers, and 5 Million rides per day across 100+ cities.
              </p>

              {/* Metrics Grid */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <div className="metric-box">
                    <div className="metric-value">5M</div>
                    <div className="metric-label">Rides Per Day</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="metric-box">
                    <div className="metric-value">333k</div>
                    <div className="metric-label">Peak Location QPS</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="metric-box">
                    <div className="metric-value">13.5 TB</div>
                    <div className="metric-label">5-Year Ride Storage</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="metric-box">
                    <div className="metric-value">&lt; 85 ms</div>
                    <div className="metric-label">P99 Dispatch Latency</div>
                  </div>
                </div>
              </div>

              {/* Formal Calculations Breakdown */}
              <h5 className="fw-bold text-white mb-3">First-Principles Calculations</h5>

              <div className="p-3 bg-dark rounded-3 border border-secondary mb-3">
                <h6 className="fw-bold text-warning mb-2">1. Driver Location Ingestion Throughput</h6>
                <div className="sd-code-box mb-2">
                  Active drivers online concurrently = 1,000,000 drivers<br />
                  Driver GPS ping frequency = 1 ping every 3 seconds<br />
                  Average QPS = 1,000,000 / 3 ≈ 333,333 QPS<br />
                  Peak QPS (2x during rush hour) = 666,666 QPS<br />
                  Payload per location ping = [driver_id (16B), lat (8B), lon (8B), bearing (4B), timestamp (8B)] ≈ 64 Bytes<br />
                  Peak Ingestion Bandwidth = 666,666 * 64 Bytes ≈ 42.6 MB/s (easily handled by 6 Kafka partitions)
                </div>
              </div>

              <div className="p-3 bg-dark rounded-3 border border-secondary mb-3">
                <h6 className="fw-bold text-warning mb-2">2. Ride Requests & Bidding Throughput</h6>
                <div className="sd-code-box mb-2">
                  Total completed rides per day = 5,000,000 rides<br />
                  Average ride booking QPS = 5,000,000 / 86,400s ≈ 58 QPS<br />
                  Peak Booking QPS (5x peak multiplier) = 58 * 5 ≈ 290 QPS<br />
                  inDrive Bidding multiplier (3 to 5 counter-bids per request) = 290 * 4 ≈ 1,160 Bid events/sec
                </div>
              </div>

              <div className="p-3 bg-dark rounded-3 border border-secondary">
                <h6 className="fw-bold text-warning mb-2">3. Long-Term Storage Requirement (5 Years)</h6>
                <div className="sd-code-box mb-2">
                  Average Ride Record size (metadata, route points, fare, bids, rating) ≈ 1.5 KB<br />
                  Daily Ride Storage = 5,000,000 rides * 1.5 KB ≈ 7.5 GB/day<br />
                  Annual Storage = 7.5 GB * 365 ≈ 2.73 TB/year<br />
                  5-Year Primary Storage = 2.73 TB * 5 ≈ 13.65 TB<br />
                  With 3x PostgreSQL replication + write-ahead logs (WAL) ≈ 41 TB total SAN storage
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: inDrive BIDDING PROTOCOL */}
        {activeTab === "bidding" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaGavel className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">inDrive Fare Negotiation Protocol</h4>
              </div>
              <p className="text-secondary small">
                Unlike algorithmic surge-pricing black boxes, the inDrive module implements a
                two-sided peer-to-peer bidding protocol with strict time-to-live (TTL) and atomic locks.
              </p>

              {/* Protocol Step-by-Step Flow */}
              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3 p-3 bg-dark rounded-3 border border-secondary">
                  <div className="sd-step-indicator">1</div>
                  <div>
                    <strong className="text-white">Customer Submits Proposed Fare</strong>
                    <p className="text-secondary small mb-1">
                      Customer enters pickup/drop and proposes a fare (e.g. ₹55). The API Gateway
                      validates boundary limits: <code>0.6 * BaseFare &lt;= CustomerOffer &lt;= 3.0 * BaseFare</code>.
                    </p>
                    <span className="sd-tag">POST /api/v1/rides/offer</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 p-3 bg-dark rounded-3 border border-secondary">
                  <div className="sd-step-indicator">2</div>
                  <div>
                    <strong className="text-white">Spatial Broadcast via Kafka & WebSockets</strong>
                    <p className="text-secondary small mb-1">
                      Location service retrieves candidate drivers in a 3km radius (H3 grid k-ring=3).
                      The bidding coordinator broadcasts the request via WebSocket channels to online drivers.
                    </p>
                    <span className="sd-tag">Kafka Topic: ride-proposals</span>
                    <span className="sd-tag ms-1">WebSocket broadcast</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 p-3 bg-dark rounded-3 border border-secondary">
                  <div className="sd-step-indicator">3</div>
                  <div>
                    <strong className="text-white">Driver Pricing & Counter-Bidding</strong>
                    <p className="text-secondary small mb-1">
                      Drivers can either accept the customer's fare directly (₹55) or submit a
                      counter-bid (e.g., ₹60, ₹70). Bids are stored in Redis Hash with a 25-second TTL.
                    </p>
                    <span className="sd-tag">Redis HSET ride:bids:&#123;id&#125;</span>
                    <span className="sd-tag ms-1">TTL 25s</span>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 p-3 bg-dark rounded-3 border border-secondary">
                  <div className="sd-step-indicator">4</div>
                  <div>
                    <strong className="text-white">Atomic Acceptance via Distributed Lock</strong>
                    <p className="text-secondary small mb-1">
                      When the rider accepts driver B's bid, an atomic lock (Redlock) is acquired on
                      <code>lock:ride:&#123;id&#125;</code> to prevent multiple drivers from claiming the same ride.
                      Other drivers receive cancellation events.
                    </p>
                    <span className="sd-tag">Redlock Mutex</span>
                    <span className="sd-tag ms-1">Status: RIDE_ASSIGNED</span>
                  </div>
                </div>
              </div>

              {/* State Machine JSON Representation */}
              <h6 className="fw-bold text-white mb-2">Bidding Lifecycle State Machine</h6>
              <div className="sd-code-box">
                {`[INIT] 
   └──> [OFFER_PROPOSED] (Customer proposes ₹55)
           ├──> Broadcast to candidate drivers (Radius: 3km, H3 Res: 8)
           ├──> [DRIVER_BIDS_RECEIVED] (Driver A: ₹55, Driver B: ₹65, Driver C: ₹50)
           │       ├──> Timeout (25s expired) ──> [OFFER_EXPIRED]
           │       ├──> Customer cancels ───────> [CANCELLED]
           │       └──> Customer accepts Bid B ──> Acquire Redlock(ride_id)
           └──> [RIDE_CONFIRMED] (OTP generated: 7482)
                   └──> [IN_PROGRESS] ──> [COMPLETED] ──> [SETTLED]`}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CARPOOL MATCHING ALGORITHM */}
        {activeTab === "carpool" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaCarSide className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">Car Pool Corridor Routing & Seat Allocation</h4>
              </div>
              <p className="text-secondary small">
                Intercity carpooling matches ad-hoc riders along a driver's long-distance route vector
                while bounding total detour delay and locking seat inventory.
              </p>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary h-100">
                    <h6 className="fw-bold text-warning mb-2">Route Corridor Filtering</h6>
                    <p className="text-secondary small">
                      Drivers publish an origin (e.g. Bengaluru), destination (e.g. Mysuru), departure
                      time, and seat price. The polyline path is buffered by a 5 km corridor polygon in
                      PostGIS using:
                    </p>
                    <div className="sd-code-box">
                      ST_Buffer(driver_route_linestring, 5000 /* meters */)
                    </div>
                    <small className="text-secondary d-block mt-2">
                      A passenger's pickup and drop must both intersect this corridor with departure
                      time delta &lt;= 30 minutes.
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary h-100">
                    <h6 className="fw-bold text-warning mb-2">Atomic Seat Inventory Locking</h6>
                    <p className="text-secondary small">
                      To prevent overbooking when multiple passengers attempt to book the last seat
                      simultaneously, seat counts are managed with Redis atomic decrement (`DECRBY`)
                      or SQL conditional update:
                    </p>
                    <div className="sd-code-box">
                      UPDATE carpools<br />
                      SET available_seats = available_seats - $seats<br />
                      WHERE id = $id AND available_seats &gt;= $seats;
                    </div>
                    <small className="text-secondary d-block mt-2">
                      If rows affected == 0, the booking is rejected immediately without race conditions.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DATA & SCHEMA DESIGN */}
        {activeTab === "schema" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaDatabase className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">Relational & Geospatial Schema Design</h4>
              </div>
              <p className="text-secondary small">
                PostgreSQL with PostGIS extension for relational entities and spatial queries; Redis
                for real-time ephemeral state.
              </p>

              {/* Database Tables */}
              <div className="d-flex flex-column gap-3">
                <div className="p-3 bg-dark rounded-3 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-warning">Table: rides (Intra-city Ride Transactions)</strong>
                    <span className="sd-tag">Partitioned by City / Date</span>
                  </div>
                  <div className="sd-code-box">
                    {`CREATE TABLE rides (
    ride_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID NOT NULL REFERENCES users(user_id),
    driver_id UUID REFERENCES drivers(driver_id),
    vehicle_type VARCHAR(20) NOT NULL, -- 'bike', 'auto', 'cab_economy'
    status VARCHAR(25) NOT NULL,       -- 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'
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
CREATE INDEX idx_rides_rider ON rides(rider_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_pickup_spatial ON rides USING GIST(pickup_geom);`}
                  </div>
                </div>

                <div className="p-3 bg-dark rounded-3 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-warning">Table: ride_bids (inDrive Counter-Offers)</strong>
                    <span className="sd-tag">Hot Storage (Redis + Archive)</span>
                  </div>
                  <div className="sd-code-box">
                    {`CREATE TABLE ride_bids (
    bid_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES rides(ride_id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(driver_id),
    driver_proposed_price DECIMAL(8, 2) NOT NULL,
    driver_distance_km DECIMAL(4, 1),
    driver_eta_mins INT,
    status VARCHAR(15) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_bids_ride_id ON ride_bids(ride_id);`}
                  </div>
                </div>

                <div className="p-3 bg-dark rounded-3 border border-secondary">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-warning">Table: carpools (Intercity Carpooling)</strong>
                    <span className="sd-tag">Spatial Corridor Indexed</span>
                  </div>
                  <div className="sd-code-box">
                    {`CREATE TABLE carpools (
    carpool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES users(user_id),
    from_city VARCHAR(100) NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    route_geom GEOMETRY(LineString, 4326),
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price_per_seat DECIMAL(8, 2) NOT NULL, -- Set by driver
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_carpools_spatial ON carpools USING GIST(route_geom);`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RESILIENCE & SECURITY */}
        {activeTab === "resilience" && (
          <div>
            <div className="sd-card">
              <div className="d-flex align-items-center gap-2 mb-3">
                <FaShieldAlt className="text-warning fs-4" />
                <h4 className="fw-bold mb-0 text-white">Fault Tolerance, Security & High Availability</h4>
              </div>
              <p className="text-secondary small">
                Enterprise engineering mechanisms to prevent systemic cascade failures, protect
                financial transactions, and provide safety-critical guarantees.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaBolt className="text-warning" />
                      <strong className="text-white">Circuit Breaker & Fallbacks</strong>
                    </div>
                    <p className="text-secondary small mb-0">
                      If the inDrive Bidding Engine experiences latency spikes (&gt; 2 seconds) or
                      error rates &gt; 5%, the circuit breaker trips. The system automatically
                      falls back to the Standard Algorithmic Pricing Mode without disrupting rides.
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaCheckCircle className="text-success" />
                      <strong className="text-white">Idempotent Payment Processing</strong>
                    </div>
                    <p className="text-secondary small mb-0">
                      Every payment deduction requires an <code>X-Idempotency-Key</code> header.
                      Prevents double debits during network reconnects or mobile client retry storms
                      using Redis TTL set with NX (Set if Not Exists).
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaServer className="text-primary" />
                      <strong className="text-white">Active-Active Multi-Region Redis</strong>
                    </div>
                    <p className="text-secondary small mb-0">
                      Redis Clusters with Redis Sentinel are deployed across availability zones with
                      sub-millisecond in-memory read/write latencies for driver positions, bidding states,
                      and session caches.
                    </p>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 bg-dark rounded-3 border border-secondary">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <FaShieldAlt className="text-danger" />
                      <strong className="text-white">24/7 SOS & Real-time Live Tracking</strong>
                    </div>
                    <p className="text-secondary small mb-0">
                      Emergency SOS bypasses all queues and connects directly to high-priority
                      police emergency dispatch sockets with encrypted GPS telemetry published to
                      dedicated isolated safety nodes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemDesign;
