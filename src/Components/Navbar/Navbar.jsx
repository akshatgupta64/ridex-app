import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './navbar.css';
import logo from '../../Assets/logo.svg';
import { AiOutlineMenu } from "react-icons/ai";
import { FaMotorcycle, FaUserCircle, FaSignOutAlt, FaSignInAlt } from "react-icons/fa";
import Offcanvas from "react-bootstrap/Offcanvas";
import { useAuth } from '../../Context/AuthContext';

const Navbar = () => {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const nav = [
    { link: "Book Ride", path: "/book", highlight: true },
    { link: "Car Pool", path: "/carpool" },
    { link: "Parcel", path: "/parcel" },
    { link: "My Rides", path: "/rides" },
    { link: "Wallet", path: "/wallet" },
    { link: "System Design", path: "/system-design", isArchitecture: true }
  ];

  const isCurrentActive = (itemPath) => {
    if (itemPath === "/" && location.pathname === "/") return true;
    if (itemPath !== "/" && location.pathname.startsWith(itemPath)) return true;
    return false;
  };

  const handleLinkClick = (path) => {
    handleClose();
    navigate(path);
  };

  return (
    <div>
      <div className="nav-container">
        <div className="nav-wrapper px-md-4 py-md-2 p-2">
          <Link to="/" className="d-flex align-items-center text-decoration-none">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-3 text-dark" style={{ fontWeight: "900", letterSpacing: "-0.5px" }}>
                Ride<span className="text-warning">X</span>
              </span>
              <span className="badge bg-dark text-warning small px-2 py-1 rounded-pill d-none d-sm-inline-block" style={{ fontSize: "10px", fontWeight: "700" }}>
                PRO
              </span>
            </div>
          </Link>

          <div className="nav-items d-none d-lg-flex">
            <div className="nav-menu">
              {nav.map((item, index) => {
                const active = isCurrentActive(item.path);
                return (
                  <Link
                    to={item.path}
                    className={`${active ? "nav-links-active" : ""} ${
                      item.highlight
                        ? "nav-links-highlight"
                        : item.isArchitecture
                        ? "nav-links-arch"
                        : "nav-links"
                    }`}
                    key={index}
                  >
                    {item.highlight && <FaMotorcycle className="me-1 text-warning" />}
                    {item.link}
                  </Link>
                );
              })}
            </div>

            <div className="d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-flex align-items-center gap-1 bg-light border px-2 py-1 rounded-pill cursor-pointer shadow-sm"
                    title={`Logged in as ${user?.email} (${user?.role})`}
                    onClick={() => navigate("/wallet")}
                  >
                    <FaUserCircle className={user?.role === 'driver' ? 'text-primary' : 'text-success'} />
                    <span className="small fw-bold text-dark">{user?.name?.split(" ")[0]}</span>
                    <span className="badge bg-secondary text-uppercase" style={{ fontSize: "9px" }}>
                      {user?.role}
                    </span>
                  </div>

                  <button
                    className="btn btn-outline-danger btn-sm rounded-pill px-2 py-1 d-flex align-items-center gap-1"
                    onClick={logout}
                    title="Sign Out"
                  >
                    <FaSignOutAlt />
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-outline-dark btn-sm rounded-pill fw-bold px-3 py-1 d-flex align-items-center gap-1"
                  onClick={() => openAuthModal("rider")}
                >
                  <FaSignInAlt /> Sign In
                </button>
              )}

              <button
                className="app-book-now-btn"
                onClick={() => navigate("/book")}
              >
                <FaMotorcycle /> Book Now
              </button>
            </div>
          </div>

          <div className="menu-icons d-lg-none">
            {isAuthenticated ? (
              <span
                className="badge bg-light text-dark border me-2 py-2 px-2 cursor-pointer"
                onClick={() => navigate("/wallet")}
              >
                👤 {user?.name?.split(" ")[0]} ({user?.role})
              </span>
            ) : (
              <button
                className="btn btn-outline-dark btn-sm rounded-pill px-2 py-1 me-2"
                onClick={() => openAuthModal("rider")}
              >
                Sign In
              </button>
            )}

            <button
              className="btn btn-warning btn-sm fw-bold rounded-pill px-3 py-1 me-2"
              onClick={() => navigate("/book")}
            >
              Book
            </button>
            <AiOutlineMenu className="menu-bar cursor-pointer" onClick={handleShow} />

            <Offcanvas show={show} onHide={handleClose} placement="end" id="offcanvas-bar">
              <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                  <img src={logo} alt="Rapido" style={{ height: "30px" }} />
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                {/* User Mobile Status Banner */}
                {isAuthenticated ? (
                  <div className="p-3 bg-light rounded mb-3 border">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{user?.name}</div>
                        <div className="small text-muted">{user?.email}</div>
                        <span className="badge bg-primary text-uppercase mt-1">{user?.role}</span>
                      </div>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          logout();
                          handleClose();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded mb-3 border text-center">
                    <p className="small text-muted mb-2">Sign in to book rides & carpools</p>
                    <button
                      className="btn btn-sm btn-dark w-100 fw-bold rounded-pill text-warning"
                      onClick={() => {
                        handleClose();
                        openAuthModal("rider");
                      }}
                    >
                      Sign In / Register
                    </button>
                  </div>
                )}

                <div className="nav-menu d-flex flex-column gap-3">
                  {nav.map((item, index) => {
                    const active = isCurrentActive(item.path);
                    return (
                      <span
                        key={index}
                        className={`${active ? "fw-bold text-dark" : "text-secondary"} nav-links fs-5 cursor-pointer`}
                        onClick={() => handleLinkClick(item.path)}
                      >
                        {item.link}
                      </span>
                    );
                  })}
                  <div className="mt-4 pt-3 border-top">
                    <button
                      className="btn btn-dark w-100 py-2 fw-bold rounded-pill text-warning"
                      onClick={() => {
                        handleClose();
                        navigate("/book");
                      }}
                    >
                      Book a Ride Now
                    </button>
                  </div>
                </div>
              </Offcanvas.Body>
            </Offcanvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
