import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import "../Booking/booking.css";

const HeroBookingCard = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("bike");
  const [pickup, setPickup] = useState("Indiranagar 100ft Road");
  const [drop, setDrop] = useState("Koramangala 5th Block");

  const handleBookNow = (e) => {
    e.preventDefault();
    if (selectedService === "parcel") {
      navigate("/parcel", { state: { pickup, drop } });
    } else {
      navigate("/book", { state: { service: selectedService, pickup, drop } });
    }
  };

  return (
    <div className="hero-booking-widget mt-3 text-start shadow-lg">
      <div className="hero-booking-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="live-dot"></span>
          <span className="fw-bold small text-white">Instant Ride Booking & Dynamic Bidding</span>
        </div>
        <span className="badge bg-warning text-dark small fw-bold">Live in 100+ Cities</span>
      </div>

      <div className="p-3 bg-white">
        {/* Service Selector Tabs */}
        <div className="d-grid gap-1 mb-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <button
            type="button"
            className={`btn btn-sm fw-bold py-2 ${
              selectedService === "bike" ? "btn-dark text-warning shadow-sm" : "btn-light border"
            }`}
            onClick={() => setSelectedService("bike")}
          >
            🛵 Bike
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold py-2 ${
              selectedService === "auto" ? "btn-dark text-warning shadow-sm" : "btn-light border"
            }`}
            onClick={() => setSelectedService("auto")}
          >
            🛺 Auto
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold py-2 ${
              selectedService === "cab_economy" ? "btn-dark text-warning shadow-sm" : "btn-light border"
            }`}
            onClick={() => setSelectedService("cab_economy")}
          >
            🚗 Cab
          </button>
          <button
            type="button"
            className={`btn btn-sm fw-bold py-2 ${
              selectedService === "parcel" ? "btn-dark text-warning shadow-sm" : "btn-light border"
            }`}
            onClick={() => setSelectedService("parcel")}
          >
            📦 Parcel
          </button>
        </div>

        {/* Inputs Form */}
        <form onSubmit={handleBookNow}>
          <div className="mb-2">
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-3 border">
              <span className="text-success fw-bold">●</span>
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 fw-semibold text-dark"
                placeholder="Pickup location"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-light rounded-3 border">
              <span className="text-warning fw-bold">●</span>
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-transparent p-0 fw-semibold text-dark"
                placeholder="Destination"
                value={drop}
                onChange={(e) => setDrop(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-3 small px-1">
            <span className="text-muted fw-medium">
              {selectedService === "bike"
                ? "Fares from ₹25 • Helmet provided"
                : selectedService === "auto"
                ? "Fares from ₹35 • Up to 3 seats"
                : selectedService === "cab_economy"
                ? "Fares from ₹70 • Air-Conditioned"
                : "Fares from ₹30 • Express delivery"}
            </span>
            <span className="text-success fw-bold">⚡ 2 min pickup</span>
          </div>

          <button type="submit" className="rapido-primary-btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-bold">
            <span>Find Drivers & Propose Fare</span>
            <FaArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
};

export default HeroBookingCard;
