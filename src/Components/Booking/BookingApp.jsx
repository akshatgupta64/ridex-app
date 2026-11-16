import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import InteractiveMap from "./InteractiveMap";
import * as api from "../../services/api";
import useRideSocket from "../../hooks/useRideSocket";
import { useAuth } from "../../Context/AuthContext";
import {
  CITIES,
  VEHICLE_TYPES,
  AVAILABLE_COUPONS
} from "./bookingData";
import "./booking.css";
import {
  FaWallet,
  FaShieldAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTag,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaCommentDots,
  FaCheckCircle,
  FaShareAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaUserFriends,
  FaPlus,
  FaMinus,
  FaGavel,
  FaCheck
} from "react-icons/fa";
import { RiPinDistanceFill } from "react-icons/ri";
import Modal from "react-bootstrap/Modal";

const BookingApp = ({ initialTab = "book" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  // Navigation & mode
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedCityId, setSelectedCityId] = useState("blr");

  // Keep activeTab in sync with route URL
  useEffect(() => {
    if (location.pathname === "/carpool") {
      setActiveTab("carpool");
    } else if (location.pathname === "/parcel") {
      setActiveTab("parcel");
      setSelectedVehicleId("parcel");
    } else if (location.pathname === "/rides") {
      setActiveTab("rides");
    } else if (location.pathname === "/wallet") {
      setActiveTab("wallet");
    } else if (location.pathname === "/safety-toolkit") {
      setActiveTab("safety");
    } else if (location.pathname === "/book") {
      setActiveTab("book");
      if (location.state?.service) {
        setSelectedVehicleId(location.state.service);
      }
    }
  }, [location.pathname, location.state]);

  const currentCity = useMemo(() => {
    return CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  }, [selectedCityId]);

  // Locations state
  const [pickup, setPickup] = useState(currentCity.locations[0]);
  const [drop, setDrop] = useState(currentCity.locations[1]);
  const [pickupQuery, setPickupQuery] = useState(currentCity.locations[0].name);
  const [dropQuery, setDropQuery] = useState(currentCity.locations[1].name);
  const [pickupResults, setPickupResults] = useState([]);
  const [dropResults, setDropResults] = useState([]);
  const searchTimerRef = useRef(null);

  // Real road route data from backend
  const [distanceKm, setDistanceKm] = useState(5.0);
  const [travelTimeMinutes, setTravelTimeMinutes] = useState(15);
  const [routeWaypoints, setRouteWaypoints] = useState([]);

  // Fetch real road routing whenever pickup or drop coordinates change
  const fetchRoadRoute = useCallback(async (p, d) => {
    if (!p?.coords || !d?.coords) return;
    try {
      const data = await api.getRoute(p.coords, d.coords);
      if (data && data.success) {
        setDistanceKm(data.distanceKm);
        setTravelTimeMinutes(data.durationMins);
        if (data.waypoints && data.waypoints.length > 0) {
          setRouteWaypoints(data.waypoints);
        }
      }
    } catch (err) {
      console.warn("Backend route fetch warning, using fallback math:", err);
    }
  }, []);

  // When city changes, reset pickup and drop
  useEffect(() => {
    const p = currentCity.locations[0];
    const d = currentCity.locations[1];
    setPickup(p);
    setDrop(d);
    setPickupQuery(p.name);
    setDropQuery(d.name);
    setPickupResults([]);
    setDropResults([]);
    fetchRoadRoute(p, d);
  }, [selectedCityId, currentCity, fetchRoadRoute]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const handleLocationSearch = (value, field) => {
    if (field === "pickup") {
      setPickupQuery(value);
    } else {
      setDropQuery(value);
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      if (field === "pickup") setPickupResults([]);
      else setDropResults([]);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchLocations(trimmed);
        const list = Array.isArray(results) ? results : [];
        if (field === "pickup") setPickupResults(list);
        else setDropResults(list);
      } catch (err) {
        if (field === "pickup") setPickupResults([]);
        else setDropResults([]);
      }
    }, 350);
  };

  const handleSelectLocation = (loc, field) => {
    if (!loc || !loc.coords) return;
    const point = {
      name: loc.name || loc.address || "Selected location",
      address: loc.address || loc.name || "Selected location",
      coords: loc.coords,
      type: "searched"
    };

    if (field === "pickup") {
      setPickup(point);
      setPickupQuery(point.name);
      setPickupResults([]);
      fetchRoadRoute(point, drop);
    } else {
      setDrop(point);
      setDropQuery(point.name);
      setDropResults([]);
      fetchRoadRoute(pickup, point);
    }
  };

  // Ride options & pricing
  const [selectedVehicleId, setSelectedVehicleId] = useState("bike");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  // inDrive Feature States
  const [enableInDriveBidding, setEnableInDriveBidding] = useState(true);
  const [userCustomFare, setUserCustomFare] = useState(null);
  const [incomingDriverBids, setIncomingDriverBids] = useState([]);

  // Backend Persisted Carpools
  const [carpools, setCarpools] = useState([]);
  const [carpoolSearch, setCarpoolSearch] = useState({
    from: "",
    to: ""
  });
  const [showPublishCarpoolModal, setShowPublishCarpoolModal] = useState(false);
  const [showBookCarpoolModal, setShowBookCarpoolModal] = useState(false);
  const [selectedCarpool, setSelectedCarpool] = useState(null);
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [newCarpool, setNewCarpool] = useState({
    fromCity: "Bengaluru",
    fromPoint: "Indiranagar 100ft Rd / Silk Board",
    toCity: "Chennai",
    toPoint: "Koyambedu / Guindy",
    departureTime: "Tomorrow, 06:00 AM",
    carModel: "Honda City (White) - KA 04 MD 8821",
    totalSeats: 3,
    pricePerSeat: 450,
    features: "AC Available, Max 2 in back, Large Trunk",
    notes: "Comfortable drive. Leaving on time."
  });

  // Backend Persisted Wallet & Ledger
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLedger, setWalletLedger] = useState([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(200);

  // Modals & Tools
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Chat messages
  const [chatMessages, setChatMessages] = useState([
    { sender: "captain", text: "Hello! I am on my way to your pickup location." }
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Parcel fields
  const [parcelDetails, setParcelDetails] = useState({
    receiverName: "Priya Sharma",
    receiverPhone: "9876543210",
    itemCategory: "Documents",
    weight: "Up to 1 kg",
    instructions: "Please hand over at front desk"
  });

  // Past rides history from Backend DB
  const [pastRides, setPastRides] = useState([]);

  // Active Ride Lifecycle State (Linked to backend ride ID)
  const [activeRide, setActiveRide] = useState(null);
  const [rideStatus, setRideStatus] = useState("idle");
  const [assignedCaptain, setAssignedCaptain] = useState(null);
  const [captainCoords, setCaptainCoords] = useState(null);
  const [rideOtp, setRideOtp] = useState("7482");
  const [finalAgreedFare, setFinalAgreedFare] = useState(null);
  const [rating, setRating] = useState(5);
  const [selectedFeedbackTags, setSelectedFeedbackTags] = useState([]);
  const [tipAmount, setTipAmount] = useState(0);
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const simTimerRef = useRef(null);

  // Load Real Data from Backend on Mount
  const loadInitialData = useCallback(async () => {
    try {
      // Public carpool listings are visible without an account.
      const carpoolsRes = await api.getCarpools();
      if (carpoolsRes && carpoolsRes.carpools) {
        setCarpools(carpoolsRes.carpools);
      }

      if (!isAuthenticated) {
        setWalletBalance(0);
        setWalletLedger([]);
        setPastRides([]);
        return;
      }

      // 1. Wallet & Ledger
      const walletRes = await api.getWallet();
      if (walletRes && walletRes.wallet) {
        setWalletBalance(walletRes.wallet.balance);
        setWalletLedger(walletRes.ledger || []);
      }

      // 2. Ride History
      const ridesRes = await api.getRideHistory();
      if (ridesRes && ridesRes.rides) {
        setPastRides(ridesRes.rides);
      }
    } catch (err) {
      console.warn("Backend initial data sync warning:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Ambient nearby drivers for the map
  const nearbyDrivers = useMemo(() => {
    if (!pickup?.coords) return [];
    const [lat, lng] = pickup.coords;
    return [
      { coords: [lat + 0.0035, lng + 0.0028], type: "bike" },
      { coords: [lat - 0.0025, lng - 0.0031], type: "bike" },
      { coords: [lat + 0.0042, lng - 0.0019], type: "auto" },
      { coords: [lat - 0.0038, lng + 0.004], type: "cab_economy" }
    ];
  }, [pickup]);

  // Standard recommended fare
  const calculateFare = (vehicle) => {
    const extraDist = Math.max(0, distanceKm - vehicle.baseKm);
    let fare = vehicle.baseFare + Math.round(extraDist * vehicle.perKm);

    if (appliedCoupon) {
      if (
        appliedCoupon.applicableVehicles &&
        !appliedCoupon.applicableVehicles.includes(vehicle.id)
      ) {
        // Not applicable
      } else {
        if (appliedCoupon.flatDiscount) {
          fare = Math.max(15, fare - appliedCoupon.flatDiscount);
        } else if (appliedCoupon.discountPercent) {
          const discount = Math.min(
            appliedCoupon.maxDiscount,
            Math.round((fare * appliedCoupon.discountPercent) / 100)
          );
          fare = Math.max(15, fare - discount);
        }
      }
    }
    return fare;
  };

  const selectedVehicleObj = useMemo(() => {
    return VEHICLE_TYPES.find((v) => v.id === selectedVehicleId) || VEHICLE_TYPES[0];
  }, [selectedVehicleId]);

  const recommendedFare = calculateFare(selectedVehicleObj);

  const activeOfferedFare = userCustomFare !== null ? userCustomFare : recommendedFare;
  const currentFare = finalAgreedFare !== null ? finalAgreedFare : activeOfferedFare;

  const tripProgress = useMemo(() => {
    const total = activeRide?.distanceKm || distanceKm || 0;
    const remaining = liveTelemetry?.distanceRemainingKm;
    if (!total || remaining === null || remaining === undefined) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }, [activeRide, distanceKm, liveTelemetry]);

  // Trigger Toast Notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const ensureAuthenticated = (action) => {
    if (isAuthenticated) return true;
    showToast(`Please log in to ${action}.`);
    openAuthModal();
    return false;
  };

  // REAL BACKEND BOOKING CALL: Creates ride row in DB and broadcasts bids
  const handleStartBooking = async () => {
    if (!ensureAuthenticated("book a ride")) return;
    if (!pickup || !drop) {
      showToast("Please choose valid pickup and drop locations.");
      return;
    }

    if (paymentMethod === "wallet" && walletBalance < activeOfferedFare) {
      showToast("Insufficient wallet balance! Please recharge or select Cash/UPI.");
      setShowWalletModal(true);
      return;
    }

    setRideStatus("bidding");
    showToast(`Connecting to backend... broadcasting fare ₹${activeOfferedFare}`);

    try {
      const payload = {
        pickupAddress: pickup.name,
        dropAddress: drop.name,
        pickupCoords: pickup.coords,
        dropCoords: drop.coords,
        vehicleType: selectedVehicleId,
        proposedFare: activeOfferedFare,
        paymentMethod,
        parcelDetails: selectedVehicleId === "parcel" ? parcelDetails : null
      };

      const res = await api.createRide(payload);

      if (res && res.success && res.ride) {
        setActiveRide(res.ride);
        setIncomingDriverBids(res.bids || []);
        if (res.ride.waypoints && res.ride.waypoints.length > 0) {
          setRouteWaypoints(res.ride.waypoints);
        }
        showToast(`Ride #${res.ride.id} registered! Received ${res.bids.length} driver offers.`);
      } else {
        throw new Error(res?.error || "Failed to create ride");
      }
    } catch (err) {
      console.error("Booking error:", err);
      showToast("Error connecting to backend API. Please retry.");
      setRideStatus("idle");
    }
  };

  // REAL BACKEND BID ACCEPTANCE: Locks ride and assigns driver
  const handleAcceptDriverBid = async (bid) => {
    if (!activeRide) return;
    try {
      const res = await api.acceptBid(activeRide.id, bid.bidId);
      if (res && res.success && res.ride) {
        setActiveRide(res.ride);
        setFinalAgreedFare(res.ride.agreedFare);
        setRideOtp(res.ride.rideOtp);

        const assignedDrv = {
          name: res.ride.driverName,
          rating: res.ride.driverRating,
          bikeModel: res.ride.driverVehicle,
          plateNumber: res.ride.driverPlate,
          avatar: res.ride.driverAvatar,
          phone: "+91 98765 43210"
        };
        setAssignedCaptain(assignedDrv);

        const [pLat, pLng] = pickup.coords;
        setCaptainCoords([pLat + 0.005, pLng + 0.004]);
        setRideStatus("assigned");

        showToast(`Offer accepted! ${res.ride.driverName} assigned for ₹${res.ride.agreedFare}`);
      } else {
        showToast(res?.error || "Could not claim bid");
      }
    } catch (err) {
      console.error("Bid accept error:", err);
      showToast("Network error accepting bid.");
    }
  };

  // REAL-TIME WEBSOCKET INTEGRATION
  const handleDriverLocation = useCallback((telemetry) => {
    if (telemetry && telemetry.coords) {
      setCaptainCoords(telemetry.coords);
      setLiveTelemetry(telemetry);
      if (
        telemetry.distanceRemainingKm !== null &&
        telemetry.distanceRemainingKm < 0.05 &&
        rideStatus === "assigned"
      ) {
        setRideStatus("arrived");
        showToast("Captain has arrived at your pickup! Share OTP with captain.");
      }
    }
  }, [rideStatus]);

  const handleBidCreated = useCallback(({ bid }) => {
    if (bid) {
      setIncomingDriverBids((prev) => {
        if (prev.some((b) => b.bidId === bid.bidId)) return prev;
        return [bid, ...prev];
      });
      showToast(`⚡ New bid: ${bid.driverName} offers ₹${bid.driverPrice}`);
    }
  }, []);

  const handleBidAccepted = useCallback(({ ride, bid }) => {
    if (ride) {
      setActiveRide(ride);
      setRideStatus("assigned");
      if (bid) {
        setAssignedCaptain({
          id: bid.driverId,
          name: bid.driverName,
          rating: bid.driverRating,
          trips: bid.driverTrips,
          bikeModel: bid.driverVehicle,
          plateNumber: bid.driverPlate,
          avatar: bid.driverAvatar,
          eta: `${bid.etaMins || 2} mins away`
        });
        if (bid.driverPrice) setFinalAgreedFare(bid.driverPrice);
      }
    }
  }, []);

  const handleRideStarted = useCallback(({ ride }) => {
    setRideStatus("in_progress");
    if (ride) setActiveRide(ride);
    showToast("Ride is now in progress!");
  }, []);

  const handleRideCompleted = useCallback(async ({ ride }) => {
    setRideStatus("completed");
    setShowRatingModal(true);
    if (ride) setActiveRide(ride);
    showToast("Destination reached! Fare settled successfully.");
    const wRes = await api.getWallet();
    if (wRes && wRes.wallet) setWalletBalance(wRes.wallet.balance);
    const histRes = await api.getRideHistory();
    if (histRes && histRes.rides) setPastRides(histRes.rides);
  }, []);

  const handleRideCancelled = useCallback(() => {
    setRideStatus("idle");
    setActiveRide(null);
    setCaptainCoords(null);
    setAssignedCaptain(null);
    showToast("Ride was cancelled.");
  }, []);

  const { isConnected: isWsConnected, sendLocationUpdate } = useRideSocket(
    activeRide?.id,
    {
      onDriverLocation: handleDriverLocation,
      onBidCreated: handleBidCreated,
      onBidAccepted: handleBidAccepted,
      onRideStarted: handleRideStarted,
      onRideCompleted: handleRideCompleted,
      onRideCancelled: handleRideCancelled
    }
  );

  // Controlled Browser Driver GPS Simulation via WebSocket
  const startBrowserGpsSimulation = () => {
    if (!activeRide || isSimulatingGps) return;
    setIsSimulatingGps(true);
    showToast("📡 Streaming simulated driver GPS coordinates over WebSocket...");

    const waypoints = routeWaypoints.length > 1 ? routeWaypoints : [pickup.coords, drop.coords];
    let step = 0;
    const totalSteps = 12;
    const p1 = waypoints[0];
    const p2 = waypoints[waypoints.length - 1];

    simTimerRef.current = setInterval(async () => {
      step++;
      const fraction = Math.min(1.0, step / totalSteps);
      const curLat = +(p1[0] + (p2[0] - p1[0]) * fraction).toFixed(6);
      const curLng = +(p1[1] + (p2[1] - p1[1]) * fraction).toFixed(6);
      const remainingKm = +((1.0 - fraction) * (activeRide.distanceKm || 5.0)).toFixed(2);
      const remainingEta = Math.max(1, Math.round((1.0 - fraction) * (activeRide.durationMins || 15)));

      sendLocationUpdate([curLat, curLng], {
        heading: Math.round(fraction * 360) % 360,
        speedKmH: 35,
        etaMins: remainingEta,
        distanceRemainingKm: remainingKm,
        isSimulated: true
      });

      if (step >= totalSteps) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        setIsSimulatingGps(false);
        const compRes = await api.completeRide(activeRide.id);
        if (compRes && compRes.success) {
          setRideStatus("completed");
          setShowRatingModal(true);
        }
      }
    }, 1200);
  };

  // REAL BACKEND TRIP START (OTP Verification)
  const handleStartRide = async () => {
    if (!activeRide) return;
    try {
      const res = await api.startRide(activeRide.id, rideOtp);
      if (res && res.success) {
        setRideStatus("in_progress");
        showToast("OTP verified! Ride is now in progress.");
      } else {
        showToast(res?.error || "Invalid OTP");
      }
    } catch (err) {
      console.error("Start ride error:", err);
      showToast("Error starting trip.");
    }
  };

  const handleCancelRide = async () => {
    if (activeRide) {
      try {
        await api.cancelRide(activeRide.id);
      } catch (e) {}
    }
    setRideStatus("idle");
    setAssignedCaptain(null);
    setCaptainCoords(null);
    setIncomingDriverBids([]);
    setFinalAgreedFare(null);
    setActiveRide(null);
    showToast("Ride cancelled.");
  };

  const handleSubmitRating = async () => {
    if (activeRide) {
      try {
        await api.rateRide(activeRide.id, { rating, feedbackTags: selectedFeedbackTags, tipAmount });
        if (tipAmount > 0) {
          const wRes = await api.getWallet();
          if (wRes && wRes.wallet) setWalletBalance(wRes.wallet.balance);
        }
      } catch (e) {}
    }

    showToast("Thank you for your rating!");
    setShowRatingModal(false);
    setRideStatus("idle");
    setAssignedCaptain(null);
    setCaptainCoords(null);
    setFinalAgreedFare(null);
    setActiveRide(null);
    setTipAmount(0);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const userMsg = { sender: "user", text: inputMessage.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: "captain", text: "Got it! Reaching your pickup location now." }
      ]);
    }, 1200);
  };

  // REAL BACKEND WALLET RECHARGE
  const handleRechargeWallet = async (amt) => {
    if (!ensureAuthenticated("recharge your wallet")) return;
    try {
      const res = await api.topupWallet(amt);
      if (res && res.success && res.wallet) {
        setWalletBalance(res.wallet.balance);
        showToast(`₹${amt} added to your Rapido Wallet successfully!`);
        setShowWalletModal(false);
        const wData = await api.getWallet();
        if (wData && wData.ledger) setWalletLedger(wData.ledger);
      }
    } catch (err) {
      console.error("Top-up error:", err);
      showToast("Wallet recharge error.");
    }
  };

  // REAL BACKEND CARPOOL PUBLISH
  const handlePublishCarpool = async (e) => {
    e.preventDefault();
    if (!ensureAuthenticated("offer a car pool")) return;
    try {
      const res = await api.publishCarpool(newCarpool);
      if (res && res.success && res.carpool) {
        setCarpools((prev) => [res.carpool, ...prev]);
        setShowPublishCarpoolModal(false);
        showToast(`Car pool published to database! Price: ₹${newCarpool.pricePerSeat}/seat.`);
      }
    } catch (err) {
      console.error("Carpool publish error:", err);
      showToast("Failed to publish carpool.");
    }
  };

  // REAL BACKEND CARPOOL SEAT RESERVATION
  const handleConfirmCarpoolBooking = async () => {
    if (!selectedCarpool) return;
    if (!ensureAuthenticated("book a car pool seat")) return;
    try {
      const res = await api.bookCarpool(selectedCarpool.id, seatsToBook);
      if (res && res.success) {
        showToast(
          `🎉 ${seatsToBook} seat(s) booked for ${selectedCarpool.fromCity} ➔ ${selectedCarpool.toCity}! Total: ₹${res.booking.totalCost}`
        );
        setShowBookCarpoolModal(false);
        if (res.wallet) setWalletBalance(res.wallet.balance);
        // Refresh carpools list
        const cRes = await api.getCarpools();
        if (cRes && cRes.carpools) setCarpools(cRes.carpools);
      } else {
        showToast(res?.error || "Could not complete booking");
      }
    } catch (err) {
      console.error("Carpool booking error:", err);
      showToast("Booking failed.");
    }
  };

  const handleDownloadReceipt = (ride) => {
    const lines = [
      "RideX — Trip Receipt",
      "==============================",
      `Ride ID: ${ride.id}`,
      `Date: ${ride.createdAt ? new Date(ride.createdAt).toLocaleString() : "N/A"}`,
      `Service: ${ride.service || ride.vehicleType || "Ride"}`,
      `Status: ${ride.status || "N/A"}`,
      "",
      `Pickup: ${ride.pickupAddress || "N/A"}`,
      `Drop: ${ride.dropAddress || "N/A"}`,
      "",
      `Captain: ${ride.driverName || "Assigned Driver"}`,
      `Payment method: ${ride.paymentMethod ? ride.paymentMethod.toUpperCase() : "N/A"}`,
      `Fare: ₹${ride.agreedFare || ride.fare || 0}`,
      ride.tipAmount ? `Tip: ₹${ride.tipAmount}` : null,
      ride.rating ? `Rating: ${ride.rating}/5` : null,
      "",
      "Thank you for riding with RideX."
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ridex-receipt-${ride.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`Receipt for ride #${ride.id} downloaded.`);
  };

  const handleRebookRide = (ride) => {
    const p = ride.pickupCoords
      ? {
          name: ride.pickupAddress || "Previous pickup",
          address: ride.pickupAddress || "Previous pickup",
          coords: ride.pickupCoords,
          type: "history"
        }
      : pickup;
    const d = ride.dropCoords
      ? {
          name: ride.dropAddress || "Previous drop",
          address: ride.dropAddress || "Previous drop",
          coords: ride.dropCoords,
          type: "history"
        }
      : drop;

    setPickup(p);
    setDrop(d);
    setPickupQuery(p.name);
    setDropQuery(d.name);
    setPickupResults([]);
    setDropResults([]);
    setUserCustomFare(null);
    if (VEHICLE_TYPES.some((v) => v.id === ride.vehicleType)) {
      setSelectedVehicleId(ride.vehicleType);
    }
    fetchRoadRoute(p, d);
    setActiveTab("book");
    navigate("/book");
    showToast("Route loaded for rebooking!");
  };

  return (
    <div className="booking-app-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-4 z-3 alert alert-warning shadow-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
          style={{ minWidth: "300px", maxWidth: "90%", zIndex: 9999 }}
        >
          <span className="live-dot"></span>
          <span className="fw-bold text-dark">{toastMessage}</span>
        </div>
      )}

      {/* Top App Sub-Bar */}
      {activeTab !== "carpool" && (
        <div className="booking-top-bar px-3 px-md-4 py-2 d-flex flex-wrap align-items-center justify-content-end gap-2">
          <div className="d-flex align-items-center gap-1">
            <FaMapMarkerAlt className="text-warning" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="city-select-dropdown"
            >
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wallet-badge" onClick={() => setShowWalletModal(true)}>
            <FaWallet />
            <span>₹{walletBalance}</span>
            <small className="text-muted fw-normal ms-1">(+Add)</small>
          </div>
        </div>
      )}

      {/* RIDE BOOKING WITH inDrive NEGOTIATION */}
      {activeTab === "book" || activeTab === "parcel" ? (
        <div className="booking-layout-grid">
          {/* Left Booking Sidebar */}
          <div className="booking-sidebar-panel p-3 p-md-4">
            {rideStatus === "idle" && (
              <>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h5 className="fw-bold mb-0">
                      {activeTab === "parcel" ? "Instant Parcel" : "Choose Ride & Fare"}
                    </h5>
                    <small className="text-muted">
                      {enableInDriveBidding
                        ? "inDrive mode: Set your price & choose driver's bid"
                        : "Fast fixed fare intra-city ride"}
                    </small>
                  </div>
                  <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">
                    {currentCity.name}
                  </span>
                </div>

                {/* Pickup & Drop Location Card */}
                <div className="location-inputs-card mb-3">
                  <div className="route-connector-line"></div>

                  <div className="location-input-group mb-3">
                    <div className="location-icon-circle pickup">A</div>
                    <div className="w-100">
                      <label className="text-muted small fw-semibold mb-1 d-block">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        className="location-input"
                        placeholder="Enter pickup point"
                        value={pickupQuery}
                        onChange={(e) => handleLocationSearch(e.target.value, "pickup")}
                        autoComplete="off"
                        aria-label="Pickup location"
                      />
                      {pickupResults.length > 0 && (
                        <div className="location-suggestions list-group mt-2">
                          {pickupResults.map((loc, idx) => (
                            <button
                              type="button"
                              key={`pickup-${idx}-${loc.address}`}
                              className="list-group-item list-group-item-action py-2 text-start"
                              onClick={() => handleSelectLocation(loc, "pickup")}
                            >
                              <div className="fw-semibold small">{loc.name}</div>
                              <div className="text-muted text-truncate" style={{ fontSize: "11px" }}>
                                {loc.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="location-input-group">
                    <div className="location-icon-circle drop">B</div>
                    <div className="w-100">
                      <label className="text-muted small fw-semibold mb-1 d-block">
                        Drop Location
                      </label>
                      <input
                        type="text"
                        className="location-input"
                        placeholder="Enter drop destination"
                        value={dropQuery}
                        onChange={(e) => handleLocationSearch(e.target.value, "drop")}
                        autoComplete="off"
                        aria-label="Drop location"
                      />
                      {dropResults.length > 0 && (
                        <div className="location-suggestions list-group mt-2">
                          {dropResults.map((loc, idx) => (
                            <button
                              type="button"
                              key={`drop-${idx}-${loc.address}`}
                              className="list-group-item list-group-item-action py-2 text-start"
                              onClick={() => handleSelectLocation(loc, "drop")}
                            >
                              <div className="fw-semibold small">{loc.name}</div>
                              <div className="text-muted text-truncate" style={{ fontSize: "11px" }}>
                                {loc.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-top">
                    <small className="text-muted fw-semibold d-block mb-1">
                      Quick landmarks in {currentCity.name}:
                    </small>
                    <div className="quick-suggestions">
                      {currentCity.locations.slice(0, 5).map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="suggestion-chip"
                          onClick={() => {
                            setDrop(loc);
                            setDropQuery(loc.name);
                            fetchRoadRoute(pickup, loc);
                          }}
                        >
                          <FaMapMarkerAlt className="text-warning small" /> {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real Road Distance & Time Bar */}
                <div className="d-flex align-items-center justify-content-between px-2 py-2 mb-3 bg-light rounded-3 border">
                  <div className="d-flex align-items-center gap-2">
                    <RiPinDistanceFill className="text-warning fs-5" />
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                        Road Distance
                      </small>
                      <span className="fw-bold text-dark">{distanceKm} km</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <FaClock className="text-muted fs-5" />
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                        Estimated Time
                      </small>
                      <span className="fw-bold text-dark">~{travelTimeMinutes} mins</span>
                    </div>
                  </div>
                </div>

                {/* Parcel Extra Details (When Parcel tab is selected) */}
                {activeTab === "parcel" && (
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <h6 className="fw-bold mb-2">Package & Recipient Details</h6>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="small text-muted">Receiver Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={parcelDetails.receiverName}
                          onChange={(e) =>
                            setParcelDetails({ ...parcelDetails, receiverName: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-6">
                        <label className="small text-muted">Receiver Mobile</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={parcelDetails.receiverPhone}
                          onChange={(e) =>
                            setParcelDetails({ ...parcelDetails, receiverPhone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <span className="badge bg-secondary">Docs / Keys</span>
                      <span className="badge bg-secondary">Food box</span>
                      <span className="badge bg-secondary">Electronics</span>
                    </div>
                  </div>
                )}

                {/* Vehicle Selection List */}
                <div className="mb-3">
                  <label className="fw-bold small text-muted text-uppercase letter-spacing-1 mb-2 d-block">
                    Choose Vehicle
                  </label>
                  <div className="d-flex flex-column gap-2">
                    {VEHICLE_TYPES.filter((v) =>
                      activeTab === "parcel" ? v.id === "parcel" : v.id !== "parcel"
                    ).map((veh) => {
                      const fare = calculateFare(veh);
                        return (
                        <div
                          key={veh.id}
                          className={`vehicle-card d-flex align-items-center justify-content-between ${
                            selectedVehicleId === veh.id ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSelectedVehicleId(veh.id);
                            setUserCustomFare(null);
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="vehicle-emoji-box">{veh.icon}</div>
                            <div>
                              <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold text-dark">{veh.title}</span>
                                <span className="vehicle-badge-tag">{veh.tag}</span>
                              </div>
                              <small className="text-muted d-block">{veh.timeEta}</small>
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="fare-main">₹{fare}</span>
                            <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                              Recommended
                            </small>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* inDrive: NAME YOUR FARE / BIDDING SECTION */}
                <div className="indrive-offer-box mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <FaGavel className="text-warning" />
                      <span className="fw-bold small">inDrive: Name Your Fare</span>
                    </div>
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={enableInDriveBidding}
                        onChange={(e) => setEnableInDriveBidding(e.target.checked)}
                      />
                    </div>
                  </div>

                  {enableInDriveBidding ? (
                    <div>
                      <small className="text-muted d-block mb-2">
                        Drivers can accept your price or offer counter-bids.
                      </small>
                      <div className="indrive-price-stepper my-2">
                        <button
                          type="button"
                          className="indrive-step-btn"
                          onClick={() => setUserCustomFare((prev) => Math.max(15, (prev !== null ? prev : recommendedFare) - 5))}
                          aria-label="Decrease offer"
                        >
                          <FaMinus />
                        </button>
                        <div className="indrive-current-offer">
                          ₹{activeOfferedFare}
                        </div>
                        <button
                          type="button"
                          className="indrive-step-btn"
                          onClick={() => setUserCustomFare((prev) => (prev !== null ? prev : recommendedFare) + 5)}
                          aria-label="Increase offer"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <div className="text-center">
                        <small className="text-muted">
                          Recommended fare is ₹{recommendedFare}. You can offer higher for faster pickup or lower to save!
                        </small>
                      </div>
                    </div>
                  ) : (
                    <small className="text-muted">
                      Standard fixed fare mode active (₹{recommendedFare}).
                    </small>
                  )}
                </div>

                {/* Payment & Coupon Footer */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <FaTag className="text-warning" />
                      <div>
                        {appliedCoupon ? (
                          <span className="fw-bold text-success small">
                            {appliedCoupon.code} Applied!
                          </span>
                        ) : (
                          <span className="fw-semibold small">Coupons & Offers</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark py-1 px-2"
                      onClick={() => setShowCouponModal(true)}
                    >
                      {appliedCoupon ? "Change" : "Apply"}
                    </button>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <FaMoneyBillWave className="text-success" />
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                          Payment
                        </small>
                        <select
                          className="form-select form-select-sm border-0 bg-transparent p-0 fw-bold"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value="wallet">Rapido Wallet (₹{walletBalance})</option>
                          <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                          <option value="cash">Cash to Captain</option>
                        </select>
                      </div>
                    </div>
                    <span className="fw-bold text-dark fs-5">
                      ₹{enableInDriveBidding ? activeOfferedFare : recommendedFare}
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="button"
                  className="rapido-primary-btn"
                  onClick={handleStartBooking}
                >
                  <span>
                    {enableInDriveBidding
                      ? `Find Drivers at ₹${activeOfferedFare}`
                      : `Book ${selectedVehicleObj.title}`}
                  </span>
                  <FaArrowRight />
                </button>
              </>
            )}

            {/* inDrive: DRIVER BIDS SCREEN */}
            {rideStatus === "bidding" && (
              <div className="my-auto">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <div>
                    <span className="badge bg-warning text-dark fw-bold mb-1">
                      inDrive Bidding Mode
                    </span>
                    <h5 className="fw-bold mb-0">Driver Counter-Offers</h5>
                    <small className="text-muted">
                      Your offer: <strong>₹{activeOfferedFare}</strong> • Ride #{activeRide?.id || "..."}
                    </small>
                  </div>
                  <button
                    className="btn btn-outline-danger btn-sm rounded-pill"
                    onClick={handleCancelRide}
                  >
                    Cancel
                  </button>
                </div>

                {incomingDriverBids.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning mb-3" role="status"></div>
                    <h6 className="fw-bold">Broadcasting your fare to nearby drivers...</h6>
                    <p className="text-muted small">Drivers are putting their prices.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {incomingDriverBids.map((bid, idx) => (
                      <div key={idx} className="driver-bid-card">
                        <div className="bid-timer-bar"></div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={bid.driverAvatar}
                              alt={`${bid.driverName} avatar`}
                              className="rounded-circle border border-warning"
                              style={{ width: "45px", height: "45px", objectFit: "cover" }}
                            />
                            <div>
                              <div className="d-flex align-items-center gap-1">
                                <strong className="text-dark">{bid.driverName}</strong>
                                <span className="badge bg-warning text-dark small py-0 px-1">
                                  ★ {bid.driverRating}
                                </span>
                              </div>
                              <small className="text-muted d-block">{bid.driverVehicle}</small>
                            </div>
                          </div>

                          <div className="text-end">
                            <div
                              className={
                                bid.driverPrice <= activeOfferedFare
                                  ? "driver-bid-price-tag"
                                  : "driver-bid-higher-tag"
                              }
                            >
                              ₹{bid.driverPrice}
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                              {bid.etaMins} mins away ({bid.distanceKm} km)
                            </small>
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                          <small className="text-muted">{bid.message}</small>
                          <button
                            type="button"
                            className="btn btn-warning btn-sm fw-bold px-3 py-1 rounded-pill"
                            onClick={() => handleAcceptDriverBid(bid)}
                          >
                            Accept ₹{bid.driverPrice}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Captain Assigned & Approaching */}
            {(rideStatus === "assigned" || rideStatus === "arrived") && assignedCaptain && (
              <div className="captain-match-card my-auto">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <span
                      className={`trip-status-badge ${
                        rideStatus === "arrived" ? "arrived" : "approaching"
                      }`}
                    >
                      {rideStatus === "arrived" ? "Captain Arrived!" : "Captain En Route"}
                    </span>
                    <h5 className="fw-bold mt-1 mb-0">
                      {rideStatus === "arrived" ? "Meet at pickup" : `Arriving in ~${liveTelemetry?.etaMins || 2} mins`}
                    </h5>
                  </div>
                  <div className="text-end">
                    <small className="text-muted d-block" style={{ fontSize: "11px" }}>
                      Ride OTP
                    </small>
                    <div className="otp-pill">{rideOtp}</div>
                  </div>
                </div>

                {/* Real-time WebSocket Telemetry Indicator */}
                <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded bg-light border small">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${isWsConnected ? "bg-success" : "bg-warning"} small`}>
                      {isWsConnected ? "🟢 Live WS Sync" : "🟡 Reconnecting..."}
                    </span>
                    {liveTelemetry && (
                      <span className="text-secondary fw-semibold">
                        {liveTelemetry.speedKmH ? `${liveTelemetry.speedKmH} km/h` : ""} {liveTelemetry.distanceRemainingKm ? `• ${liveTelemetry.distanceRemainingKm}km left` : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm py-0 px-2"
                    style={{ fontSize: "11px" }}
                    onClick={startBrowserGpsSimulation}
                    disabled={isSimulatingGps}
                  >
                    {isSimulatingGps ? "Transmitting..." : "🛰️ Test Driver GPS"}
                  </button>
                </div>

                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={assignedCaptain.avatar}
                    alt={assignedCaptain.name}
                    className="rounded-circle border border-warning"
                    style={{ width: "64px", height: "64px", objectFit: "cover" }}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold mb-0">{assignedCaptain.name}</h6>
                      <span className="badge bg-warning text-dark small">
                        ★ {assignedCaptain.rating}
                      </span>
                    </div>
                    <p className="small text-muted mb-0">{assignedCaptain.bikeModel}</p>
                    <span className="fw-bold text-dark small bg-light px-2 py-0.5 rounded border">
                      {assignedCaptain.plateNumber}
                    </span>
                  </div>
                </div>

                <div className="d-flex justify-content-around py-2 my-3 bg-light rounded-3 border">
                  <button
                    type="button"
                    className="action-circle-btn"
                    title="Call Captain"
                    aria-label="Call captain"
                    onClick={() => setShowCallModal(true)}
                  >
                    <FaPhoneAlt className="text-success" />
                  </button>
                  <button
                    type="button"
                    className="action-circle-btn"
                    title="Chat with Captain"
                    aria-label="Chat with captain"
                    onClick={() => setShowChatModal(true)}
                  >
                    <FaCommentDots className="text-primary" />
                  </button>
                  <button
                    type="button"
                    className="action-circle-btn"
                    title="Share Live Ride"
                    aria-label="Share live ride link"
                    onClick={() => {
                      const link = `${window.location.origin}/book${activeRide ? `?ride=${activeRide.id}` : ""}`;
                      navigator.clipboard?.writeText(link);
                      showToast("Live ride link copied!");
                    }}
                  >
                    <FaShareAlt className="text-secondary" />
                  </button>
                  <button
                    type="button"
                    className="action-circle-btn sos"
                    title="Emergency SOS"
                    aria-label="Emergency SOS"
                    onClick={() => setShowSosModal(true)}
                  >
                    <FaShieldAlt />
                  </button>
                </div>

                <div className="p-2 mb-3 bg-white rounded border small">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span>
                      <strong>Agreed Fare:</strong> ₹{currentFare}
                    </span>
                    <span className="badge bg-success-subtle text-success">
                      Negotiated via inDrive
                    </span>
                  </div>
                  <div className="text-truncate text-muted">To: {drop.name}</div>
                </div>

                {rideStatus === "arrived" ? (
                  <button
                    type="button"
                    className="rapido-primary-btn mb-2"
                    onClick={handleStartRide}
                  >
                    <FaCheckCircle /> Start Trip (Verify OTP)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-warning w-100 fw-bold py-2 mb-2"
                    onClick={() => {
                      setRideStatus("arrived");
                      setCaptainCoords(pickup.coords);
                      showToast("Captain arrived at pickup!");
                    }}
                  >
                    Simulate: Captain Arrived
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm w-100"
                  onClick={handleCancelRide}
                >
                  Cancel Ride
                </button>
              </div>
            )}

            {/* Ride In Progress */}
            {rideStatus === "in_progress" && (
              <div className="captain-match-card my-auto">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="trip-status-badge in_progress">Ride In Progress</span>
                  <div className="d-flex align-items-center gap-1">
                    <span className={`badge ${isWsConnected ? "bg-success" : "bg-warning"} small`}>
                      {isWsConnected ? "🟢 Live GPS" : "🟡 Syncing"}
                    </span>
                    <span className="badge bg-dark text-warning">
                      {liveTelemetry?.speedKmH || 34} km/h
                    </span>
                  </div>
                </div>
                <h5 className="fw-bold mb-1">Heading to Destination</h5>
                <p className="text-muted small mb-3">{drop.name}</p>

                <div className="progress mb-3" style={{ height: "8px" }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                    role="progressbar"
                    aria-label="Trip progress"
                    aria-valuenow={tripProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{ width: `${tripProgress}%` }}
                  ></div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border mb-3">
                  <div>
                    <small className="text-muted d-block">Captain</small>
                    <strong className="text-dark">{assignedCaptain?.name}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Fare Due</small>
                    <strong className="text-success fs-6">₹{currentFare}</strong>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-danger flex-grow-1"
                    onClick={() => setShowSosModal(true)}
                  >
                    <FaShieldAlt /> SOS Safety
                  </button>
                  <button
                    type="button"
                    className="btn btn-success flex-grow-1"
                    onClick={async () => {
                      if (activeRide) {
                        const compRes = await api.completeRide(activeRide.id);
                        if (compRes && compRes.wallet) setWalletBalance(compRes.wallet.balance);
                      }
                      setRideStatus("completed");
                      setShowRatingModal(true);
                      showToast("Destination reached!");
                    }}
                  >
                    End Ride
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Interactive Map with Real Road Waypoints */}
          <div className="booking-map-panel">
            <InteractiveMap
              centerCoords={currentCity.coords}
              pickup={pickup}
              drop={drop}
              nearbyDrivers={nearbyDrivers}
              assignedCaptainCoords={captainCoords}
              vehicleType={selectedVehicleId}
              rideStatus={rideStatus}
              routeWaypoints={routeWaypoints}
              onMapClick={(coords) => {
                const newPoint = {
                  name: `Map Point (${coords[0].toFixed(3)}, ${coords[1].toFixed(3)})`,
                  address: "Custom selected point on map",
                  coords: coords,
                  type: "custom"
                };
                setDrop(newPoint);
                setDropQuery(newPoint.name);
                fetchRoadRoute(pickup, newPoint);
                showToast("Drop location and road route updated from map click!");
              }}
            />
          </div>
        </div>
      ) : null}

      {/* CAR POOL INTERCITY CARPOOLING TAB (REAL PERSISTENCE) */}
      {activeTab === "carpool" && (
        <div className="container py-4" style={{ maxWidth: "900px" }}>
          {/* Carpool Header & Actions */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-warning text-dark fw-bold">Car Pool Mode</span>
                <span className="badge bg-success-subtle text-success">Intercity Rideshare</span>
              </div>
              <h3 className="fw-bolder mb-0 mt-1">Intercity Car Pool</h3>
              <p className="text-muted small mb-0">
                Share long-distance rides between cities. Drivers set their own seat prices!
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-dark fw-bold rounded-pill text-warning px-3"
                onClick={() => setShowPublishCarpoolModal(true)}
              >
                + Offer a Ride (Driver Pricing)
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="carpool-search-bar mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-md-5">
                <div className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-2 border">
                  <span className="text-success small">●</span>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent"
                    placeholder="Leaving from (e.g. Bengaluru)"
                    value={carpoolSearch.from}
                    onChange={(e) => setCarpoolSearch({ ...carpoolSearch, from: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-5">
                <div className="d-flex align-items-center gap-2 px-2 py-1 bg-light rounded-2 border">
                  <span className="text-warning small">●</span>
                  <input
                    type="text"
                    className="form-control form-control-sm border-0 bg-transparent"
                    placeholder="Going to (e.g. Mysuru / Pune)"
                    value={carpoolSearch.to}
                    onChange={(e) => setCarpoolSearch({ ...carpoolSearch, to: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-warning w-100 fw-bold btn-sm py-2"
                  onClick={async () => {
                    const res = await api.getCarpools(carpoolSearch.from, carpoolSearch.to);
                    if (res && res.carpools) setCarpools(res.carpools);
                    showToast("Filtered car pools from database!");
                  }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Carpools List */}
          <div className="d-flex flex-column gap-3">
            {carpools.map((cp) => (
              <div key={cp.id} className="carpool-card">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="carpool-time-badge">{cp.departureTime}</span>
                      {cp.isSelfPublished && (
                        <span className="badge bg-primary text-white">Your Published Ride</span>
                      )}
                    </div>
                    <h5 className="fw-bold mb-0">
                      {cp.fromCity} ➔ {cp.toCity}
                    </h5>
                    <small className="text-muted d-block">
                      Pickup: {cp.fromPoint} • Drop: {cp.toPoint}
                    </small>
                  </div>

                  <div className="text-end">
                    <div className="carpool-price">₹{cp.pricePerSeat}</div>
                    <small className="text-muted d-block">per seat (Driver Price)</small>
                    <span
                      className={`carpool-seat-indicator mt-1 ${
                        cp.availableSeats > 1 ? "available" : "few"
                      }`}
                    >
                      <FaUserFriends /> {cp.availableSeats} of {cp.totalSeats} seats left
                    </span>
                  </div>
                </div>

                {/* Driver Card & Amenities */}
                <div className="d-flex flex-wrap align-items-center justify-content-between pt-3 border-top gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <img
                      src={cp.driverAvatar}
                      alt={`${cp.driverName} avatar`}
                      className="rounded-circle border"
                      style={{ width: "48px", height: "48px", objectFit: "cover" }}
                    />
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark">{cp.driverName}</strong>
                        <span className="badge bg-warning text-dark small">
                          ★ {cp.driverRating}
                        </span>
                      </div>
                      <small className="text-muted">{cp.carModel}</small>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-1">
                    {(Array.isArray(cp.features) ? cp.features : []).map((feat, i) => (
                      <span key={i} className="carpool-amenity-chip">
                        ✓ {feat}
                      </span>
                    ))}
                  </div>

                  <div>
                    <button
                      className="rapido-primary-btn py-2 px-4 btn-sm"
                      disabled={cp.availableSeats === 0}
                      onClick={() => {
                        setSelectedCarpool(cp);
                        setShowBookCarpoolModal(true);
                      }}
                    >
                      {cp.availableSeats > 0 ? "Book Seat" : "Full"}
                    </button>
                  </div>
                </div>

                {cp.notes && (
                  <div className="mt-2 pt-2 border-top small text-secondary fst-italic">
                    "{cp.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY RIDES TAB (REAL PERSISTENCE) */}
      {activeTab === "rides" && (
        <div className="container py-4" style={{ maxWidth: "800px" }}>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h4 className="fw-bold mb-1">My Ride History</h4>
              <p className="text-muted small mb-0">All rides fetched directly from the database</p>
            </div>
            <button
              className="btn btn-warning fw-bold btn-sm"
              onClick={() => {
                setActiveTab("book");
                navigate("/book");
              }}
            >
              + Book New Ride
            </button>
          </div>

          <div className="d-flex flex-column gap-3">
            {pastRides.map((ride) => (
              <div key={ride.id} className="past-ride-card">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fs-4">
                      {ride.vehicleType === "auto" ? "🛺" : ride.vehicleType === "cab_economy" ? "🚗" : ride.vehicleType === "parcel" ? "📦" : "🛵"}
                    </span>
                    <div>
                      <h6 className="fw-bold mb-0">{ride.service}</h6>
                      <small className="text-muted">{new Date(ride.createdAt).toLocaleString()}</small>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="fw-bold fs-5 text-dark">₹{ride.agreedFare || ride.fare}</span>
                    <span className="badge bg-success-subtle text-success d-block small">
                      {ride.status}
                    </span>
                  </div>
                </div>

                <div className="p-2 bg-light rounded-2 border small mb-2">
                  <div className="mb-1 text-truncate">
                    <strong className="text-success">Pickup:</strong> {ride.pickupAddress}
                  </div>
                  <div className="text-truncate">
                    <strong className="text-warning">Drop:</strong> {ride.dropAddress}
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-1 small text-muted">
                  <span>
                    Captain: <strong>{ride.driverName || "Assigned Driver"}</strong> • Paid via {ride.paymentMethod?.toUpperCase()}
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                      onClick={() => handleDownloadReceipt(ride)}
                    >
                      Receipt
                    </button>
                    <button
                      className="btn btn-outline-dark btn-sm py-0 px-2"
                      onClick={() => handleRebookRide(ride)}
                    >
                      Rebook
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WALLET TAB (REAL PERSISTENCE & DOUBLE-ENTRY LEDGER) */}
      {activeTab === "wallet" && (
        <div className="container py-4" style={{ maxWidth: "650px" }}>
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div
              className="p-4 text-white"
              style={{ background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)" }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="text-warning fw-bold">Rapido Wallet</span>
                <span className="badge bg-warning text-dark">Double-Entry Ledger</span>
              </div>
              <h1 className="fw-bolder mb-1">₹{walletBalance}</h1>
              <p className="small text-secondary mb-0">Use on Rapido, inDrive bids & Car Pools</p>
            </div>
            <div className="p-4 bg-white">
              <h6 className="fw-bold mb-3">Quick Add Money</h6>
              <div className="d-flex gap-2 mb-3">
                {[100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    className="btn btn-outline-dark flex-grow-1 fw-bold"
                    onClick={() => handleRechargeWallet(amt)}
                  >
                    + ₹{amt}
                  </button>
                ))}
              </div>
              <button
                className="rapido-primary-btn w-100"
                onClick={() => setShowWalletModal(true)}
              >
                Custom Recharge Amount
              </button>
            </div>
          </div>

          {/* Real Transaction Passbook */}
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <h6 className="fw-bold mb-3">Passbook & Audit Ledger</h6>
            {walletLedger.length === 0 ? (
              <p className="text-muted small">No transactions yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {walletLedger.map((tx) => (
                  <div key={tx.id} className="d-flex justify-content-between align-items-center py-2 border-bottom small">
                    <div>
                      <strong>{tx.description}</strong>
                      <div className="text-muted" style={{ fontSize: "11px" }}>
                        {new Date(tx.createdAt).toLocaleString()} • ID: {tx.idempotencyKey}
                      </div>
                    </div>
                    <span className={`fw-bold fs-6 ${tx.type === "CREDIT" ? "text-success" : "text-danger"}`}>
                      {tx.type === "CREDIT" ? "+" : "-"} ₹{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAFETY TOOLKIT TAB */}
      {activeTab === "safety" && (
        <div className="container py-4" style={{ maxWidth: "700px" }}>
          <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="p-3 bg-warning-subtle rounded-circle text-warning fs-3">
                <FaShieldAlt />
              </div>
              <div>
                <h4 className="fw-bold mb-0">Rapido Safety Center</h4>
                <p className="text-muted small mb-0">Your safety is guaranteed on every city & intercity trip</p>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-light h-100">
                  <h6 className="fw-bold text-danger mb-1">🚨 24x7 Emergency SOS</h6>
                  <p className="small text-muted mb-3">
                    Instantly share GPS coordinates with Police Control (112) and emergency contacts.
                  </p>
                  <button
                    className="btn btn-outline-danger btn-sm fw-bold w-100"
                    onClick={() => setShowSosModal(true)}
                  >
                    Trigger Emergency Alert
                  </button>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 border rounded-3 bg-light h-100">
                  <h6 className="fw-bold text-success mb-1">📲 Share Live Ride</h6>
                  <p className="small text-muted mb-3">
                    Let family follow your live movement on map until you arrive.
                  </p>
                  <button
                    className="btn btn-outline-success btn-sm fw-bold w-100"
                    onClick={() => {
                      const link = `${window.location.origin}/book${activeRide ? `?ride=${activeRide.id}` : ""}`;
                      navigator.clipboard?.writeText(link);
                      showToast("Live ride link copied to share!");
                    }}
                  >
                    Copy Live Tracking Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CAR POOL: PUBLISH CARPOOL RIDE MODAL */}
      <Modal
        show={showPublishCarpoolModal}
        onHide={() => setShowPublishCarpoolModal(false)}
        centered
        size="lg"
      >
        <div className="custom-modal-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-warning text-dark fw-bold">Car Pool Publisher</span>
            <h5 className="fw-bold mb-0">Offer an Intercity Ride</h5>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowPublishCarpoolModal(false)}
          ></button>
        </div>
        <div className="custom-modal-body">
          <form onSubmit={handlePublishCarpool}>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-bold">From City & Landmark</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bengaluru (Silk Board)"
                  value={newCarpool.fromPoint}
                  onChange={(e) => setNewCarpool({ ...newCarpool, fromPoint: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">To City & Landmark</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chennai (Guindy)"
                  value={newCarpool.toPoint}
                  onChange={(e) => setNewCarpool({ ...newCarpool, toPoint: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold">Departure Date & Time</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tomorrow, 07:00 AM"
                  value={newCarpool.departureTime}
                  onChange={(e) =>
                    setNewCarpool({ ...newCarpool, departureTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-bold text-success">
                  💰 Your Price Per Seat (Set By You!)
                </label>
                <div className="input-group">
                  <span className="input-group-text fw-bold">₹</span>
                  <input
                    type="number"
                    className="form-control fw-bold"
                    placeholder="350"
                    value={newCarpool.pricePerSeat}
                    onChange={(e) =>
                      setNewCarpool({ ...newCarpool, pricePerSeat: +e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-bold">Available Seats</label>
                <select
                  className="form-select"
                  value={newCarpool.totalSeats}
                  onChange={(e) => setNewCarpool({ ...newCarpool, totalSeats: +e.target.value })}
                >
                  <option value={1}>1 Seat</option>
                  <option value={2}>2 Seats</option>
                  <option value={3}>3 Seats</option>
                  <option value={4}>4 Seats</option>
                </select>
              </div>
              <div className="col-md-8">
                <label className="form-label small fw-bold">Vehicle Model & Plate Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Honda City (White) - KA 04 MD 8821"
                  value={newCarpool.carModel}
                  onChange={(e) => setNewCarpool({ ...newCarpool, carModel: e.target.value })}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold">Amenities (comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={newCarpool.features}
                  onChange={(e) => setNewCarpool({ ...newCarpool, features: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold">Notes for Passengers</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Leaving strictly on time, music welcome, etc."
                  value={newCarpool.notes}
                  onChange={(e) => setNewCarpool({ ...newCarpool, notes: e.target.value })}
                ></textarea>
              </div>
            </div>

            <button type="submit" className="rapido-primary-btn">
              <span>Publish Ride to Database at ₹{newCarpool.pricePerSeat}/Seat</span>
              <FaArrowRight />
            </button>
          </form>
        </div>
      </Modal>

      {/* CAR POOL: BOOK SEAT MODAL */}
      <Modal show={showBookCarpoolModal} onHide={() => setShowBookCarpoolModal(false)} centered>
        {selectedCarpool && (
          <div>
            <div className="custom-modal-header d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0">Book Car Pool Seat</h5>
                <small className="text-muted">
                  {selectedCarpool.fromCity} ➔ {selectedCarpool.toCity}
                </small>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowBookCarpoolModal(false)}
              ></button>
            </div>
            <div className="custom-modal-body">
              <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border mb-3">
                <img
                  src={selectedCarpool.driverAvatar}
                  alt={`${selectedCarpool.driverName} avatar`}
                  className="rounded-circle"
                  style={{ width: "48px", height: "48px" }}
                />
                <div>
                  <h6 className="fw-bold mb-0">{selectedCarpool.driverName}</h6>
                  <small className="text-muted">{selectedCarpool.carModel}</small>
                </div>
                <div className="ms-auto text-end">
                  <span className="fs-5 fw-bold text-dark">₹{selectedCarpool.pricePerSeat}</span>
                  <small className="text-muted d-block">per seat</small>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Select Number of Seats</label>
                <div className="d-flex gap-2">
                  {Array.from(
                    { length: Math.min(3, selectedCarpool.availableSeats) },
                    (_, i) => i + 1
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`btn flex-grow-1 fw-bold ${
                        seatsToBook === st ? "btn-dark text-warning" : "btn-outline-secondary"
                      }`}
                      onClick={() => setSeatsToBook(st)}
                    >
                      {st} {st === 1 ? "Seat" : "Seats"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-white rounded border mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Price ({seatsToBook} seat):</span>
                  <strong>₹{selectedCarpool.pricePerSeat * seatsToBook}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small text-muted">
                  <span>Departure Time:</span>
                  <span>{selectedCarpool.departureTime}</span>
                </div>
                <div className="d-flex justify-content-between small text-muted">
                  <span>Pickup Point:</span>
                  <span className="text-truncate ms-2">{selectedCarpool.fromPoint}</span>
                </div>
              </div>

              <button className="rapido-primary-btn" onClick={handleConfirmCarpoolBooking}>
                <span>Confirm & Pay ₹{selectedCarpool.pricePerSeat * seatsToBook}</span>
                <FaCheck />
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* COUPONS MODAL */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
        <div className="custom-modal-header d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Apply Coupon Code</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowCouponModal(false)}
          ></button>
        </div>
        <div className="custom-modal-body">
          <div className="d-flex flex-column gap-3">
            {AVAILABLE_COUPONS.map((cpn) => (
              <div
                key={cpn.code}
                className="coupon-card d-flex align-items-center justify-content-between"
              >
                <div>
                  <span className="badge bg-warning text-dark fw-bold mb-1">{cpn.code}</span>
                  <p className="small text-muted mb-0">{cpn.desc}</p>
                </div>
                <button
                  className="btn btn-sm btn-dark"
                  onClick={() => {
                    setAppliedCoupon(cpn);
                    setShowCouponModal(false);
                    showToast(`Coupon ${cpn.code} applied!`);
                  }}
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* WALLET RECHARGE MODAL */}
      <Modal show={showWalletModal} onHide={() => setShowWalletModal(false)} centered>
        <div className="custom-modal-header d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Recharge Rapido Wallet</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowWalletModal(false)}
          ></button>
        </div>
        <div className="custom-modal-body">
          <p className="text-muted small">
            Current balance: <strong>₹{walletBalance}</strong>
          </p>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Enter Amount (₹)</label>
            <input
              type="number"
              className="form-control"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(+e.target.value)}
            />
          </div>
          <div className="d-flex gap-2 mb-4">
            {[100, 200, 500].map((amt) => (
              <button
                key={amt}
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setRechargeAmount(amt)}
              >
                +₹{amt}
              </button>
            ))}
          </div>
          <button
            className="rapido-primary-btn"
            onClick={() => handleRechargeWallet(rechargeAmount)}
          >
            Add ₹{rechargeAmount} via UPI / Card
          </button>
        </div>
      </Modal>

      {/* CHAT WITH CAPTAIN MODAL */}
      <Modal show={showChatModal} onHide={() => setShowChatModal(false)} centered>
        <div className="custom-modal-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <img
              src={assignedCaptain?.avatar}
              alt={assignedCaptain ? `${assignedCaptain.name} avatar` : "Captain avatar"}
              className="rounded-circle"
              style={{ width: "36px", height: "36px" }}
            />
            <div>
              <h6 className="fw-bold mb-0">{assignedCaptain?.name}</h6>
              <small className="text-success">● Active Captain</small>
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowChatModal(false)}
          ></button>
        </div>
        <div className="custom-modal-body">
          <div className="chat-window mb-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.sender === "user" ? "chat-bubble-sent" : "chat-bubble-received"}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="d-flex gap-1 overflow-auto pb-2 mb-2">
            {["I am at the gate", "Please bring extra helmet", "Coming down in 1 min"].map(
              (preset, i) => (
                <button
                  key={i}
                  className="btn btn-outline-secondary btn-sm py-0 px-2 text-nowrap"
                  style={{ fontSize: "11px" }}
                  onClick={() => {
                    setChatMessages((prev) => [...prev, { sender: "user", text: preset }]);
                  }}
                >
                  {preset}
                </button>
              )
            )}
          </div>

          <form onSubmit={handleSendMessage} className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Type message to Captain..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-warning btn-sm fw-bold">
              Send
            </button>
          </form>
        </div>
      </Modal>

      {/* CALL CAPTAIN MODAL */}
      <Modal show={showCallModal} onHide={() => setShowCallModal(false)} centered size="sm">
        <div className="p-4 text-center">
          <div
            className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center bg-warning text-dark"
            style={{ width: "70px", height: "70px", fontSize: "28px" }}
          >
            <FaPhoneAlt />
          </div>
          <h5 className="fw-bold mb-1">Calling {assignedCaptain?.name}</h5>
          <p className="text-muted small mb-3">{assignedCaptain?.phone || "+91 98765 43210"}</p>
          <span className="badge bg-light text-dark border mb-3">Rapido Free In-App Call</span>
          <div>
            <button
              className="btn btn-danger rounded-pill px-4"
              onClick={() => setShowCallModal(false)}
            >
              End Call
            </button>
          </div>
        </div>
      </Modal>

      {/* SOS EMERGENCY MODAL */}
      <Modal show={showSosModal} onHide={() => setShowSosModal(false)} centered>
        <div className="p-4">
          <div className="d-flex align-items-center gap-2 text-danger mb-3">
            <FaExclamationTriangle className="fs-3" />
            <h5 className="fw-bold mb-0">Emergency Safety Response</h5>
          </div>
          <p className="small text-muted mb-3">
            Transmitting live GPS coordinates to Police Control Room (112) and your emergency contacts.
          </p>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary w-50"
              onClick={() => setShowSosModal(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger w-50 fw-bold"
              onClick={() => {
                setShowSosModal(false);
                showToast("🚨 SOS Emergency alert dispatched! Police & contacts notified.");
              }}
            >
              Call 112 & Send SOS
            </button>
          </div>
        </div>
      </Modal>

      {/* TRIP COMPLETED & RATING MODAL */}
      <Modal show={showRatingModal} onHide={() => setShowRatingModal(false)} centered>
        <div className="p-4 text-center">
          <div className="mb-2 fs-1 text-success">
            <FaCheckCircle />
          </div>
          <h4 className="fw-bold mb-1">Trip Completed!</h4>
          <p className="text-muted small mb-3">
            You travelled {distanceKm} km with {assignedCaptain?.name || "Ramesh"}.
          </p>

          <div className="p-3 bg-light rounded-3 border mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Agreed inDrive Fare</span>
              <strong className="fs-5">₹{currentFare}</strong>
            </div>
            <div className="d-flex justify-content-between small text-muted">
              <span>Paid via {paymentMethod.toUpperCase()}</span>
              <span className="text-success fw-bold">Settled in Database</span>
            </div>
          </div>

          <h6 className="fw-bold mb-2">Rate your Captain</h6>
          <div className="d-flex justify-content-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-btn ${star <= rating ? "active" : ""}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>

          <div className="d-flex flex-wrap justify-content-center gap-1 mb-3">
            {["Clean Helmet", "Polite Captain", "Fair Price", "Smooth Driving"].map((tag) => (
              <button
                key={tag}
                type="button"
                className={`btn btn-sm py-0 px-2 rounded-pill ${
                  selectedFeedbackTags.includes(tag)
                    ? "btn-warning text-dark fw-bold"
                    : "btn-outline-secondary"
                }`}
                style={{ fontSize: "12px" }}
                onClick={() => {
                  if (selectedFeedbackTags.includes(tag)) {
                    setSelectedFeedbackTags(selectedFeedbackTags.filter((t) => t !== tag));
                  } else {
                    setSelectedFeedbackTags([...selectedFeedbackTags, tag]);
                  }
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="small text-muted d-block mb-1">Add a Tip for Captain</label>
            <div className="d-flex justify-content-center gap-2">
              {[10, 20, 50].map((tip) => (
                <button
                  key={tip}
                  type="button"
                  className={`btn btn-sm ${
                    tipAmount === tip ? "btn-dark text-warning" : "btn-outline-secondary"
                  }`}
                  onClick={() => setTipAmount(tipAmount === tip ? 0 : tip)}
                >
                  +₹{tip}
                </button>
              ))}
            </div>
          </div>

          <button className="rapido-primary-btn w-100" onClick={handleSubmitRating}>
            Submit Feedback & Save to DB
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default BookingApp;
