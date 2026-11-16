import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";
import HeroBookingCard from "./HeroBookingCard";
import Footer from "../Footer/Footer";
import {
  FaMotorcycle,
  FaBolt,
  FaArrowRight,
  FaMoneyBillWave,
  FaStar,
  FaNetworkWired,
  FaRoute
} from "react-icons/fa";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div className="row align-items-center g-4">
            {/* Hero Left Column */}
            <div className="col-lg-6">
              <div className="d-flex flex-column gap-3 text-start">
                <div>
                  <span className="hero-pill-badge">
                    <FaBolt /> Next-Gen Mobility & Real-Time Fare Bidding
                  </span>
                </div>

                <h1 className="hero-title">
                  Ride Smarter. <br />
                  <span style={{ color: "#d97706" }}>Propose Your Fare.</span> <br />
                  Share Highways.
                </h1>

                <p className="hero-subtitle mb-2">
                  RideX unifies on-demand Bike Taxis, Autos, Cabs, Express Parcels, and Intercity Corridor Carpooling into one high-throughput platform with inDrive-style mutual fare negotiation.
                </p>

                {/* Direct Action Buttons */}
                <div className="d-flex flex-wrap gap-2">
                  <button className="hero-btn-primary" onClick={() => navigate("/book")}>
                    <FaMotorcycle />
                    <span>Book City Ride</span>
                  </button>
                  <button className="hero-btn-secondary" onClick={() => navigate("/carpool")}>
                    <FaRoute />
                    <span>Intercity Carpool</span>
                  </button>
                </div>

                {/* Hero Booking Widget Card */}
                <HeroBookingCard />
              </div>
            </div>

            {/* Hero Right Column: Live App Preview & Telematics Showcase */}
            <div className="col-lg-6">
              <div className="hero-preview-card">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="live-dot"></span>
                    <span className="fw-bold small text-dark">Live Bidding & Telematics Preview</span>
                  </div>
                  <span className="badge bg-success-subtle text-success border border-success-subtle small fw-bold">
                    Connected to /ws
                  </span>
                </div>

                {/* Simulated Active Ride Context */}
                <div className="bg-light p-3 rounded-3 mb-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge bg-dark text-warning text-uppercase small">Ride #RAP-62716</span>
                    <span className="small text-muted fw-bold">Active in Bengaluru</span>
                  </div>
                  <div className="small text-dark fw-bold mb-1">
                    🟢 Pickup: <span className="text-secondary fw-normal">Indiranagar 100ft Road</span>
                  </div>
                  <div className="small text-dark fw-bold mb-2">
                    🔴 Drop: <span className="text-secondary fw-normal">Koramangala 5th Block (5.2 km)</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center small">
                    <span>Passenger Offer: <strong className="text-success fs-6">₹65</strong></span>
                    <span className="badge bg-warning text-dark fw-bold">0% Surge Guarantee</span>
                  </div>
                </div>

                {/* Driver Incoming Bids Simulation */}
                <div className="d-flex flex-column gap-2 mb-3">
                  <div className="hero-driver-bid-preview d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-warning text-dark p-2 rounded-circle fw-bold small">
                        RK
                      </div>
                      <div>
                        <div className="fw-bold small text-dark">Ramesh Kumar (Honda Activa)</div>
                        <div className="small text-muted">
                          <FaStar className="text-warning me-1" />
                          4.89 (3,420 trips) • <span className="text-success fw-bold">2 mins away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-dark fs-6">₹65</div>
                      <span className="badge bg-success text-white small">Direct Match</span>
                    </div>
                  </div>

                  <div className="hero-driver-bid-preview d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-secondary text-white p-2 rounded-circle fw-bold small">
                        VS
                      </div>
                      <div>
                        <div className="fw-bold small text-dark">Vikramjit Singh (TVS Jupiter)</div>
                        <div className="small text-muted">
                          <FaStar className="text-warning me-1" />
                          4.94 (1,890 trips) • <span className="text-secondary">3 mins away</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-dark fs-6">₹75</div>
                      <span className="badge bg-light text-dark border small">Counter-Offer</span>
                    </div>
                  </div>
                </div>

                {/* Live Platform Guarantees Banner */}
                <div className="row g-2 text-center pt-2 border-top">
                  <div className="col-4">
                    <div className="p-2 bg-light rounded-2">
                      <div className="fw-bold small text-dark">Sub-80ms</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>GPS Latency</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 bg-light rounded-2">
                      <div className="fw-bold small text-dark">4-Digit OTP</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>Security Gate</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 bg-light rounded-2">
                      <div className="fw-bold small text-dark">Double-Entry</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>Wallet Ledger</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 5 MULTI-MODAL SERVICES MATRIX */}
      <section className="py-5 bg-white border-bottom">
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div className="text-center mb-5">
            <span className="section-tag">Multi-Modal Mobility Ecosystem</span>
            <h2 className="section-heading mt-1">Five Services. One Unified Engine.</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: "650px" }}>
              From solo bike commutes to city-to-city carpooling corridors, RideX delivers complete transit flexibility without switching apps.
            </p>
          </div>

          <div className="row g-4">
            {/* Bike Taxi */}
            <div className="col-md-6 col-lg-4">
              <div className="modality-card">
                <div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="modality-icon-wrapper text-warning">🛵</div>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle modality-badge">
                      Most Popular
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mt-2 mb-1">Bike Taxi</h4>
                  <p className="text-muted small mb-3">
                    Bypass city traffic gridlock with solo motorcycle transit. Includes verified captains and mandatory safety helmets.
                  </p>
                  <div className="bg-light p-2 rounded-2 small mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Base Fare:</span>
                      <strong>₹25 (incl. 1.5 km)</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted">Per Km Rate:</span>
                      <strong>₹9 / km</strong>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline-dark btn-sm w-100 fw-bold" onClick={() => navigate("/book")}>
                  Book Bike Taxi
                </button>
              </div>
            </div>

            {/* Rapido Auto */}
            <div className="col-md-6 col-lg-4">
              <div className="modality-card">
                <div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="modality-icon-wrapper text-warning">🛺</div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle modality-badge">
                      Pocket Friendly
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mt-2 mb-1">Rapido Auto</h4>
                  <p className="text-muted small mb-3">
                    Comfortable 3-wheeler transit for up to 3 passengers. Weather-protected with metered rate cards and custom bidding.
                  </p>
                  <div className="bg-light p-2 rounded-2 small mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Base Fare:</span>
                      <strong>₹35 (incl. 1.5 km)</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted">Per Km Rate:</span>
                      <strong>₹14 / km</strong>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline-dark btn-sm w-100 fw-bold" onClick={() => navigate("/book")}>
                  Book Auto
                </button>
              </div>
            </div>

            {/* Cab Economy */}
            <div className="col-md-6 col-lg-4">
              <div className="modality-card">
                <div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="modality-icon-wrapper text-primary">🚗</div>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle modality-badge">
                      Air Conditioned
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mt-2 mb-1">Cab Economy</h4>
                  <p className="text-muted small mb-3">
                    Premium comfort in compact sedans and hatchbacks. Quiet, air-conditioned executive travel for families and professionals.
                  </p>
                  <div className="bg-light p-2 rounded-2 small mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Base Fare:</span>
                      <strong>₹70 (incl. 2.0 km)</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted">Per Km Rate:</span>
                      <strong>₹18 / km</strong>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline-dark btn-sm w-100 fw-bold" onClick={() => navigate("/book")}>
                  Book Cab
                </button>
              </div>
            </div>

            {/* Express Parcel */}
            <div className="col-md-6 col-lg-4">
              <div className="modality-card">
                <div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="modality-icon-wrapper text-secondary">📦</div>
                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle modality-badge">
                      Same-Day Doorstep
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mt-2 mb-1">Express Parcel</h4>
                  <p className="text-muted small mb-3">
                    Send documents, keys, lunchboxes, or packages up to 5 kg anywhere in the city. Real-time GPS waypoint tracking.
                  </p>
                  <div className="bg-light p-2 rounded-2 small mb-3">
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Base Fare:</span>
                      <strong>₹30 (incl. 1.5 km)</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-1">
                      <span className="text-muted">Per Km Rate:</span>
                      <strong>₹11 / km</strong>
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline-dark btn-sm w-100 fw-bold" onClick={() => navigate("/parcel")}>
                  Send Parcel
                </button>
              </div>
            </div>

            {/* Intercity Carpool */}
            <div className="col-md-6 col-lg-8">
              <div className="modality-card" style={{ background: "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)" }}>
                <div>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="modality-icon-wrapper text-dark">🚙</div>
                    <span className="badge bg-warning text-dark fw-bold modality-badge">
                      Intercity Corridor Engine
                    </span>
                  </div>
                  <h4 className="fw-bold text-dark mt-2 mb-1">Intercity Highway Carpooling</h4>
                  <p className="text-muted small mb-3">
                    Share scheduled city-to-city journeys (e.g. Bengaluru to Mysuru, Delhi to Chandigarh, Mumbai to Pune). Drivers publish per-seat prices; our spatial corridor algorithm buffers passenger pickups with 15% detour caps.
                  </p>
                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <div className="bg-white p-2 rounded-2 border small">
                        <span className="text-muted d-block">Detour Tolerance:</span>
                        <strong className="text-dark">&le; 15% Highway Buffer</strong>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="bg-white p-2 rounded-2 border small">
                        <span className="text-muted d-block">Seat Pricing:</span>
                        <strong className="text-success">Driver-Set Competitive Rates</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="hero-btn-primary w-100 justify-content-center py-2" onClick={() => navigate("/carpool")}>
                  <span>Explore Intercity Carpools</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. inDrive FARE NEGOTIATION EXPLAINER */}
      <section className="py-5 bg-light border-bottom">
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div className="bidding-feature-box">
            <div className="row align-items-center g-4">
              <div className="col-lg-7">
                <span className="badge bg-warning text-dark fw-bold mb-2 text-uppercase">
                  Decentralized Market Equilibrium
                </span>
                <h2 className="fw-black text-white mb-3" style={{ fontSize: "32px", fontWeight: "900" }}>
                  Say Goodbye to 300% Algorithmic Surge Multipliers
                </h2>
                <p className="text-secondary mb-4" style={{ lineHeight: "1.6" }}>
                  Traditional ride aggregators trap commuters and drivers inside closed surge pricing algorithms. RideX restores mutual agreement through a transparent two-sided reverse auction protocol:
                </p>

                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-start gap-3">
                    <div className="bidding-step-pill">1</div>
                    <div>
                      <h6 className="fw-bold text-warning mb-1">Rider Proposes Custom Fare</h6>
                      <p className="small text-secondary mb-0">Use the interactive fare stepper to set what you want to pay based on current demand.</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="bidding-step-pill">2</div>
                    <div>
                      <h6 className="fw-bold text-warning mb-1">Nearby Drivers Counter-Offer</h6>
                      <p className="small text-secondary mb-0">Drivers see full route details upfront and submit competitive bids within a 25-second TTL window.</p>
                    </div>
                  </div>

                  <div className="d-flex align-items-start gap-3">
                    <div className="bidding-step-pill">3</div>
                    <div>
                      <h6 className="fw-bold text-warning mb-1">Atomic Lock Winner Assignment</h6>
                      <p className="small text-secondary mb-0">Rider accepts the best bid. Distributed mutex locking ensures zero race conditions or double-bookings.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="bg-white p-4 rounded-4 text-dark shadow-lg">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <FaMoneyBillWave className="text-warning" />
                    <span>Traditional TNCs vs RideX</span>
                  </h5>
                  <div className="d-flex flex-column gap-3 small">
                    <div className="p-2 rounded bg-danger-subtle text-danger border border-danger-subtle">
                      <strong>❌ Traditional Aggregators:</strong> Non-negotiable 2.5x–3.5x surge pricing; destinations hidden from drivers; 25% take-rate commissions.
                    </div>
                    <div className="p-2 rounded bg-success-subtle text-success border border-success-subtle">
                      <strong>✅ RideX Platform:</strong> Transparent peer-to-peer bidding; upfront routes; 85% driver earnings split; auditable double-entry ledger.
                    </div>
                  </div>
                  <button className="btn btn-warning w-100 fw-bold mt-3 py-2 text-dark" onClick={() => navigate("/book")}>
                    Try Bidding Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SYSTEM SCALE & ARCHITECTURE METRICS */}
      <section className="py-5 bg-white border-bottom">
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div className="text-center mb-4">
            <span className="section-tag">Production Benchmark Engineering</span>
            <h2 className="section-heading mt-1">Built for Ultra-Scale Distributed Mobility</h2>
          </div>

          <div className="row g-3">
            <div className="col-sm-6 col-lg-3">
              <div className="metrics-card">
                <div className="metric-number">15 M+</div>
                <div className="metric-label">Daily Active Users Benchmark</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="metrics-card">
                <div className="metric-number text-warning">666 K</div>
                <div className="metric-label">Peak GPS Telematics QPS</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="metrics-card">
                <div className="metric-number">&lt; 80 ms</div>
                <div className="metric-label">P99 Broadcast Stream Latency</div>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="metrics-card">
                <div className="metric-number text-success">99.99%</div>
                <div className="metric-label">Stateless Service Availability</div>
              </div>
            </div>
          </div>

          {/* College Project Architecture Highlight Banner */}
          <div className="bg-light p-4 rounded-4 border mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div>
              <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FaNetworkWired className="text-primary" />
                <span>Explore the In-App System Design Documentation</span>
              </h5>
              <p className="text-muted small mb-0">
                Interactive diagrams, capacity planning math, database schemas (PostGIS), and REST API catalogs available live in the application.
              </p>
            </div>
            <button className="btn btn-dark fw-bold px-4 py-2 flex-shrink-0" onClick={() => navigate("/system-design")}>
              View System Design
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <Footer />
    </div>
  );
};

export default Home;
