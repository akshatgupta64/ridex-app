import React, { useState, useEffect } from "react";
import { Modal, Tab, Tabs, Form, Button, Alert, Badge } from "react-bootstrap";
import { useAuth } from "../../Context/AuthContext";
import { FaUser, FaMotorcycle, FaShieldAlt, FaKey, FaEnvelope } from "react-icons/fa";

const AuthModal = () => {
  const { authModalOpen, closeAuthModal, modalInitialTab, login, register, demoMode } = useAuth();

  const [activeTab, setActiveTab] = useState("rider");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("rider");
  const [regVehicleType, setRegVehicleType] = useState("bike");
  const [regModel, setRegModel] = useState("");
  const [regPlate, setRegPlate] = useState("");

  useEffect(() => {
    if (modalInitialTab) {
      setActiveTab(modalInitialTab);
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [modalInitialTab, authModalOpen]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await login(loginEmail, loginPassword);
      if (!res.ok) {
        setErrorMsg(res.error || "Login failed. Check your credentials.");
      } else {
        setSuccessMsg("Logged in successfully!");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to API server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const payload = {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: regRole,
        vehicleType: regVehicleType,
        model: regModel,
        plateNumber: regPlate
      };

      const res = await register(payload);
      if (!res.ok) {
        setErrorMsg(res.error || "Registration failed.");
      } else {
        setSuccessMsg("Account created and authenticated!");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to API server.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (email, pass, tab = "rider") => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setActiveTab(tab);
    setErrorMsg("");
  };

  return (
    <Modal show={authModalOpen} onHide={closeAuthModal} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <FaShieldAlt className="text-warning" />
          <span>RideX Authentication</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-2">
        <p className="text-muted small mb-3">
          Sign in or create an account to access real-time ride hailing, inDrive bidding, and intercity carpooling.
        </p>

        {errorMsg && <Alert variant="danger" className="py-2 small">{errorMsg}</Alert>}
        {successMsg && <Alert variant="success" className="py-2 small">{successMsg}</Alert>}

        {/* Quick Demo Logins Banner (development/demo deployments only) */}
        {demoMode && (
          <div className="bg-light p-2 rounded mb-3 border">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small fw-bold text-secondary">⚡ 1-Click Demo Accounts:</span>
              <Badge bg="dark" className="small">Pre-seeded</Badge>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline-primary"
                className="py-1 px-2 small"
                onClick={() => fillDemoAccount("rider@ridex.com", "Rider@123", "rider")}
              >
                👤 Demo Rider (Rahul)
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                className="py-1 px-2 small"
                onClick={() => fillDemoAccount("driver@ridex.com", "Driver@123", "driver")}
              >
                🏍️ Demo Driver (Ramesh)
              </Button>
              <Button
                size="sm"
                variant="outline-dark"
                className="py-1 px-2 small"
                onClick={() => fillDemoAccount("admin@ridex.com", "Admin@123", "rider")}
              >
                🛡️ Ops Admin
              </Button>
            </div>
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onSelect={(k) => {
            setActiveTab(k);
            setErrorMsg("");
          }}
          className="mb-3"
        >
          {/* Passenger Login Tab */}
          <Tab eventKey="rider" title={<span><FaUser className="me-1" /> Passenger Login</span>}>
            <Form onSubmit={handleLoginSubmit}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><FaEnvelope className="text-muted" /></span>
                  <Form.Control
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><FaKey className="text-muted" /></span>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Button
                variant="warning"
                type="submit"
                className="w-100 fw-bold py-2 shadow-sm"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In as Passenger"}
              </Button>
            </Form>
          </Tab>

          {/* Driver Login Tab */}
          <Tab eventKey="driver" title={<span><FaMotorcycle className="me-1" /> Driver Login</span>}>
            <Form onSubmit={handleLoginSubmit}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Driver Email / Mobile</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><FaEnvelope className="text-muted" /></span>
                  <Form.Control
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-white"><FaKey className="text-muted" /></span>
                  <Form.Control
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Button
                variant="dark"
                type="submit"
                className="w-100 fw-bold py-2 shadow-sm text-warning"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In as Driver"}
              </Button>
            </Form>
          </Tab>

          {/* Register Tab */}
          <Tab eventKey="register" title="Create Account">
            <Form onSubmit={handleRegisterSubmit}>
              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Priya Nair"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </Form.Group>

              <div className="row g-2 mb-2">
                <div className="col-7">
                  <Form.Label className="small fw-semibold">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="priya@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="col-5">
                  <Form.Label className="small fw-semibold">Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Password (min 6 characters)</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small fw-semibold">Account Role</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    type="radio"
                    id="role-rider"
                    label="Passenger (Book Rides & Carpools)"
                    name="regRole"
                    checked={regRole === "rider"}
                    onChange={() => setRegRole("rider")}
                  />
                  <Form.Check
                    type="radio"
                    id="role-driver"
                    label="Driver / Captain (Accept Rides)"
                    name="regRole"
                    checked={regRole === "driver"}
                    onChange={() => setRegRole("driver")}
                  />
                </div>
              </Form.Group>

              {regRole === "driver" && (
                <div className="p-2 border rounded bg-light mb-2">
                  <div className="row g-2">
                    <div className="col-6">
                      <Form.Label className="small fw-semibold">Vehicle Type</Form.Label>
                      <Form.Select
                        size="sm"
                        value={regVehicleType}
                        onChange={(e) => setRegVehicleType(e.target.value)}
                      >
                        <option value="bike">Bike (Two Wheeler)</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="cab_economy">Economy Cab (Car)</option>
                      </Form.Select>
                    </div>
                    <div className="col-6">
                      <Form.Label className="small fw-semibold">Vehicle Model</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. Activa 6G / Pulsar"
                        value={regModel}
                        onChange={(e) => setRegModel(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <Form.Label className="small fw-semibold">License Plate Number</Form.Label>
                      <Form.Control
                        size="sm"
                        placeholder="e.g. KA 05 MN 4821"
                        value={regPlate}
                        onChange={(e) => setRegPlate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="warning"
                type="submit"
                className="w-100 fw-bold py-2 mt-2 shadow-sm"
                disabled={loading}
              >
                {loading ? "Registering Account..." : "Create Account & Sign In"}
              </Button>
            </Form>
          </Tab>
        </Tabs>

        <div className="text-center mt-3 pt-2 border-top">
          <small className="text-muted d-flex align-items-center justify-content-center gap-1">
            <FaShieldAlt className="text-success" />
            <span>Encrypted with bcrypt (10 rounds) & JWT HS256 Authorization</span>
          </small>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;
