# RideX Complete API Specification & Interface Documentation

**Base API URL (Development)**: `http://localhost:5000/api`  
**Base API URL (Production)**: `/api` (or `https://ridex.app/api`)  
**WebSocket Gateway URL**: `ws://localhost:5000/ws` (or `wss://ridex.app/ws`)  
**Specification Version**: 1.0.0 (Production Benchmark)

---

## 1. Authentication & Identity Management

### 1.1 User Registration
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: Public (Rate Limit: 30 req / 15 min)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Aanya Sharma",
    "email": "aanya@example.com",
    "phone": "+91 91234 56789",
    "password": "Password@123",
    "role": "rider",
    "vehicleType": "bike",
    "model": "Honda Activa 6G",
    "plateNumber": "KA 05 MN 4821"
  }
  ```
- **Validation Rules**:
  - `name`: string, 1–120 characters, required.
  - `email`: valid email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, required, case-insensitive uniqueness check.
  - `phone`: string, 8–20 characters, required.
  - `password`: string, 6–128 characters, required.
  - `role`: `'rider'` or `'driver'`, required.
  - `vehicleType`: `'bike'`, `'auto'`, or `'cab_economy'` (for drivers).
- **Processing**:
  1. Validates input schema.
  2. Queries store for duplicate email (returns 409 if exists).
  3. Hashes password using bcrypt (salt cost 10).
  4. Generates unique ID (`usr-<uuid>` or `drv-<uuid>`).
  5. If driver, initializes linked driver profile in `drivers` collection.
  6. Provisions digital wallet with signup bonus (₹100 for riders, ₹0 for drivers).
  7. Generates signed JWT token (HMAC-SHA256, 7-day expiry).
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-8f3a91b2",
      "name": "Aanya Sharma",
      "email": "aanya@example.com",
      "phone": "+91 91234 56789",
      "role": "rider",
      "createdAt": "2026-10-30T10:00:00.000Z"
    },
    "message": "Account registered successfully"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Validation failure.
  - `409 Conflict`: "An account with this email address already exists".
  - `500 Internal Server Error`: Server failure.

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: Public (Rate Limit: 30 req / 15 min)
- **Request Body**:
  ```json
  {
    "email": "aanya@example.com",
    "password": "Password@123"
  }
  ```
- **Processing**: Constant-time bcrypt comparison against stored hash; signs JWT.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "usr-8f3a91b2",
      "name": "Aanya Sharma",
      "email": "aanya@example.com",
      "role": "rider"
    },
    "message": "Login successful"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: "Invalid email or password".

### 1.3 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Protected (Requires `Authorization: Bearer <token>`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-8f3a91b2",
      "name": "Aanya Sharma",
      "email": "aanya@example.com",
      "role": "rider"
    },
    "wallet": {
      "userId": "usr-8f3a91b2",
      "balance": 450.0,
      "currency": "INR"
    },
    "driverProfile": null
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid or expired session token.
  - `404 Not Found`: User no longer exists.

---

## 2. Intra-City Ride Dispatch & Lifecycle

### 2.1 Create Ride Request
- **Method**: `POST`
- **Path**: `/api/rides`
- **Auth**: Protected (Rider identity bound via JWT)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "pickupAddress": "Indiranagar Metro Station",
    "dropAddress": "MG Road Metro Station",
    "pickupCoords": [12.9784, 77.6408],
    "dropCoords": [12.9756, 77.6066],
    "vehicleType": "bike",
    "proposedFare": 50.0,
    "paymentMethod": "wallet"
  }
  ```
- **Validation**: Coordinates within legal boundaries; vehicle type in `['bike', 'auto', 'cab_economy', 'parcel']`; proposed fare positive number < 10000.
- **Processing**:
  1. Calls routing engine (`getRoadRoute`) to determine road distance and polyline waypoints.
  2. Calculates recommended system base fare:
     - Bike Taxi: ₹25 base (1.5 km) + ₹9/km
     - Rapido Auto: ₹35 base (1.5 km) + ₹14/km
     - Cab Economy: ₹70 base (2.0 km) + ₹18/km
  3. Sets status to `'BIDDING'`.
  4. Generates unique tracking ID (`RAP-XXXXX`) and 4-digit security OTP.
  5. Synthesizes competing driver bids from available online drivers.
  6. Broadcasts `ride_status_changed` and `bid_created` events over WebSocket.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "ride": {
      "id": "RAP-58219",
      "riderId": "usr-8f3a91b2",
      "riderName": "Aanya Sharma",
      "service": "Bike Taxi",
      "vehicleType": "bike",
      "pickupCoords": [12.9784, 77.6408],
      "dropCoords": [12.9756, 77.6066],
      "distanceKm": 4.2,
      "durationMins": 12,
      "recommendedFare": 50.0,
      "initialOfferFare": 50.0,
      "agreedFare": 50.0,
      "status": "BIDDING",
      "rideOtp": "6192",
      "createdAt": "2026-10-30T10:00:00.000Z"
    },
    "bids": [
      {
        "bidId": "BID-a1b2c3d4",
        "driverId": "drv-01",
        "driverName": "Ramesh Kumar",
        "driverRating": 4.89,
        "driverPrice": 50.0,
        "etaMins": 2,
        "distanceKm": 0.5,
        "status": "PENDING"
      }
    ]
  }
  ```

### 2.2 Accept Driver Bid
- **Method**: `POST`
- **Path**: `/api/rides/:id/accept-bid`
- **Auth**: Protected (Ride owner only)
- **Request Body**: `{ "bidId": "BID-a1b2c3d4" }`
- **Processing**:
  1. Asserts `ride.riderId === req.user.id`.
  2. Within atomic lock, asserts `ride.status === 'BIDDING'`.
  3. Transitions status to `'ASSIGNED'`, binds `driverId` and `agreedFare`.
  4. Marks chosen bid `'ACCEPTED'`; sets all competing bids to `'EXPIRED'`.
  5. Broadcasts `bid_accepted` and `ride_status_changed` events over WebSocket.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "ride": {
      "id": "RAP-58219",
      "status": "ASSIGNED",
      "driverId": "drv-01",
      "driverName": "Ramesh Kumar",
      "agreedFare": 50.0
    },
    "bid": {
      "bidId": "BID-a1b2c3d4",
      "status": "ACCEPTED"
    }
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Unauthorized user attempting acceptance.
  - `409 Conflict`: "Ride cannot be claimed or is already assigned".

### 2.3 Verify OTP and Start Ride
- **Method**: `POST`
- **Path**: `/api/rides/:id/start`
- **Auth**: Protected (Assigned driver, rider, or admin)
- **Request Body**: `{ "otp": "6192" }`
- **Processing**: Validates `String(otp).trim() === ride.rideOtp`; transitions status from `'ASSIGNED'` / `'ARRIVED'` to `'IN_PROGRESS'`; broadcasts `ride_started`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "ride": {
      "id": "RAP-58219",
      "status": "IN_PROGRESS",
      "startedAt": "2026-10-30T10:05:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: "Invalid Security OTP".
  - `403 Forbidden`: Caller not assigned driver or rider.
  - `409 Conflict`: Ride cannot be started from current status.

### 2.4 Complete Ride & Settle Fare
- **Method**: `POST`
- **Path**: `/api/rides/:id/complete`
- **Auth**: Protected (Assigned driver, rider, or admin)
- **Processing**:
  1. Asserts status is `'IN_PROGRESS'`.
  2. Transitions status to `'COMPLETED'`.
  3. Financial Settlement:
     - If payment method is `'wallet'`, deducts fare from rider wallet.
     - Credits 85% of collected fare to driver wallet (15% platform retention).
     - Appends double-entry CREDIT and DEBIT records to `walletLedger` with unique idempotency keys.
  4. Increments driver lifetime trip count.
  5. Broadcasts `ride_completed` and `ride_status_changed` over WebSocket.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "ride": {
      "id": "RAP-58219",
      "status": "COMPLETED",
      "agreedFare": 50.0,
      "amountPaid": 50.0,
      "driverEarning": 42.5,
      "completedAt": "2026-10-30T10:20:00.000Z"
    },
    "wallet": {
      "userId": "usr-8f3a91b2",
      "balance": 400.0
    }
  }
  ```

### 2.5 Submit Driver Rating & Tipping
- **Method**: `POST`
- **Path**: `/api/rides/:id/rate`
- **Auth**: Protected (Rider only)
- **Request Body**:
  ```json
  {
    "rating": 5,
    "feedbackTags": ["Punctual", "Clean Vehicle", "Polite"],
    "tipAmount": 20.0
  }
  ```
- **Processing**: Validates ride is `'COMPLETED'`; asserts no prior tip submitted; if `tipAmount > 0`, transfers 100% of tip from rider wallet to driver wallet with dual ledger entries.
- **Success Response (200 OK)**: `{ "success": true }`

### 2.6 Cancel Ride
- **Method**: `POST`
- **Path**: `/api/rides/:id/cancel`
- **Auth**: Protected (Rider, assigned driver, or admin)
- **Processing**: Transitions status to `'CANCELLED'`; records `cancelledBy`; broadcasts `ride_cancelled`.
- **Success Response (200 OK)**: `{ "success": true }`

---

## 3. Intercity Carpooling

### 3.1 List / Search Carpools
- **Method**: `GET`
- **Path**: `/api/carpools`
- **Auth**: Public / Optional Auth
- **Query Parameters**:
  - `from` (string, optional): Origin city substring filter (e.g., `Bengaluru`).
  - `to` (string, optional): Destination city substring filter (e.g., `Mysuru`).
- **Success Response (200 OK)**:
  ```json
  {
    "carpools": [
      {
        "id": "CP-101",
        "driverName": "Siddharth Rao",
        "fromCity": "Bengaluru",
        "toCity": "Mysuru",
        "departureTime": "Today, 05:30 PM",
        "carModel": "Honda City (White) - KA 04 MD 8821",
        "totalSeats": 3,
        "availableSeats": 2,
        "pricePerSeat": 340.0,
        "features": ["AC Available", "Instant Booking"]
      }
    ]
  }
  ```

### 3.2 Publish Carpool Journey
- **Method**: `POST`
- **Path**: `/api/carpools`
- **Auth**: Protected (Driver identity bound via JWT)
- **Request Body**:
  ```json
  {
    "fromCity": "Bengaluru",
    "fromPoint": "Silk Board Junction",
    "toCity": "Mysuru",
    "toPoint": "Suburban Bus Stand",
    "departureTime": "Tomorrow, 06:00 AM",
    "carModel": "Honda City (White)",
    "totalSeats": 3,
    "pricePerSeat": 350.0,
    "features": ["AC Available", "Luggage Allowed"],
    "notes": "Leaving strictly on time."
  }
  ```
- **Validation**: Seats between 1 and 6; price per seat positive number < 100,000.
- **Success Response (201 Created)**: `{ "success": true, "carpool": { ... } }`

### 3.3 Book Carpool Seats
- **Method**: `POST`
- **Path**: `/api/carpools/:id/book`
- **Auth**: Protected (Passenger identity bound via JWT)
- **Request Body**: `{ "seats": 2 }`
- **Processing**:
  1. Asserts caller is not the driver of the carpool.
  2. Verifies `availableSeats >= seats`.
  3. Calculates `totalCost = pricePerSeat * seats`.
  4. Verifies passenger wallet balance $\ge \text{totalCost}$.
  5. Atomically deducts totalCost from wallet; appends DEBIT ledger transaction.
  6. Decrements `availableSeats` by requested seats.
  7. Inserts reservation record in `carpoolBookings`.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "booking": {
      "bookingId": "CP-BK-f4e3d2c1",
      "carpoolId": "CP-101",
      "passengerId": "usr-8f3a91b2",
      "seats": 2,
      "totalCost": 680.0,
      "fromCity": "Bengaluru",
      "toCity": "Mysuru"
    },
    "carpool": { "id": "CP-101", "availableSeats": 0 },
    "wallet": { "balance": 320.0 }
  }
  ```

---

## 4. Cashless Digital Wallet & Ledger

### 4.1 Get Wallet & Ledger
- **Method**: `GET`
- **Path**: `/api/wallet`
- **Auth**: Protected (Bearer JWT)
- **Success Response (200 OK)**:
  ```json
  {
    "wallet": { "userId": "usr-8f3a91b2", "balance": 450.0, "currency": "INR" },
    "ledger": [
      {
        "id": "tx-init-01",
        "walletId": "usr-8f3a91b2",
        "type": "CREDIT",
        "amount": 450.0,
        "description": "Welcome Promo Balance",
        "idempotencyKey": "init-key-01",
        "createdAt": "2026-10-30T00:00:00.000Z"
      }
    ]
  }
  ```

### 4.2 Idempotent Wallet Top-Up
- **Method**: `POST`
- **Path**: `/api/wallet/topup`
- **Auth**: Protected (Bearer JWT)
- **Request Body**:
  ```json
  {
    "amount": 200.0,
    "idempotencyKey": "topup-usr-8f3a91b2-1730280000"
  }
  ```
- **Processing**: Validates amount > 0 and $\le$ 10,000; checks for existing `idempotencyKey` (returns existing entry if found without double-crediting); credits wallet balance; records ledger transaction.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "wallet": { "userId": "usr-8f3a91b2", "balance": 650.0 },
    "entry": {
      "id": "tx-1730280000",
      "type": "CREDIT",
      "amount": 200.0,
      "isSimulated": true
    }
  }
  ```

---

## 5. Geospatial & Fleet Services

### 5.1 Road Path Calculation
- **Method**: `GET`
- **Path**: `/api/geo/route`
- **Query Parameters**: `startLat`, `startLon`, `endLat`, `endLon`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "source": "OSRM_ROAD_NETWORK",
    "distanceKm": 5.2,
    "durationMins": 16,
    "waypoints": [[12.9784, 77.6408], [12.9750, 77.6380], [12.9352, 77.6245]]
  }
  ```

### 5.2 Forward Geocoding Search
- **Method**: `GET`
- **Path**: `/api/geo/search`
- **Query Parameters**: `q` (e.g., `Indiranagar`)
- **Success Response (200 OK)**:
  ```json
  {
    "results": [
      {
        "name": "Indiranagar",
        "address": "Indiranagar, Bengaluru, Karnataka, 560038, India",
        "coords": [12.9784, 77.6408]
      }
    ]
  }
  ```

### 5.3 Active Driver Fleet Query
- **Method**: `GET`
- **Path**: `/api/geo/drivers`
- **Auth**: Public
- **Success Response (200 OK)**:
  ```json
  {
    "drivers": [
      {
        "id": "drv-01",
        "name": "Ramesh Kumar",
        "rating": 4.89,
        "trips": 3420,
        "vehicleType": "bike",
        "model": "Honda Activa 6G",
        "plateNumber": "KA 05 MN 4821",
        "location": [12.9814, 77.6428],
        "status": "ONLINE"
      }
    ]
  }
  ```

---

## 6. Real-Time WebSocket Protocol (`/ws`)

### 6.1 Handshake & Authentication
- **Endpoint**: `ws://localhost:5000/ws` (or `ws://localhost:5000/ws?token=<jwt>`)
- **Server Greeting Event (`connection_established`)**:
  ```json
  {
    "type": "connection_established",
    "rideId": null,
    "payload": {
      "authenticated": true,
      "user": { "id": "usr-8f3a91b2", "name": "Aanya Sharma", "role": "rider" },
      "message": "Welcome Aanya Sharma! Connected to RideX Real-Time Gateway"
    },
    "timestamp": "2026-10-30T10:00:00.000Z"
  }
  ```

### 6.2 Subscribe to Ride Channel
- **Client Message**:
  ```json
  {
    "type": "subscribe_ride",
    "rideId": "RAP-58219"
  }
  ```
- **Server Response (`subscription_confirmed`)**:
  ```json
  {
    "type": "subscription_confirmed",
    "rideId": "RAP-58219",
    "payload": {
      "rideId": "RAP-58219",
      "status": "BIDDING",
      "role": "rider",
      "message": "Subscribed to real-time events for ride RAP-58219"
    },
    "timestamp": "2026-10-30T10:00:01.000Z"
  }
  ```

### 6.3 Driver Live GPS Telemetry
- **Driver Message**:
  ```json
  {
    "type": "driver_location_updated",
    "rideId": "RAP-58219",
    "payload": {
      "coords": [12.9784, 77.6408],
      "heading": 90,
      "speedKmH": 35,
      "etaMins": 3,
      "distanceRemainingKm": 1.2
    }
  }
  ```
- **Server Broadcast (to all subscribers of `RAP-58219`)**:
  Delivered to passenger map with matching telemetry coordinates and driver identity.
