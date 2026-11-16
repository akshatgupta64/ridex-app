import React from "react";
import { Link } from "react-router-dom";
import Footer from "../Footer/Footer";

const NotFound = () => {
  return (
    <>
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <h1 className="display-4 fw-bold mb-2">404</h1>
        <h2 className="h4 text-muted mb-4">This road doesn&apos;t exist yet.</h2>
        <p className="mb-4">The page you are looking for may have moved or been removed.</p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/" className="btn btn-warning fw-bold px-4">
            Go Home
          </Link>
          <Link to="/book" className="btn btn-outline-dark fw-bold px-4">
            Book a Ride
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
