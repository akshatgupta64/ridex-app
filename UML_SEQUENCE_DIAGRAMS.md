# RideX UML Sequence Diagrams (Complete 12 Execution Workflows)

This document provides the complete, production-grade UML sequence diagrams in editable **Mermaid.js** and **PlantUML** formats for **RideX — A Smart Ride-Hailing and Intercity Carpooling Platform**.

---

## 1. User Registration and Login Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor User as Passenger / Driver
    participant Frontend as React Client
    participant Gateway as Express Gateway (Auth)
    participant Crypto as Bcrypt & JWT Engine
    participant Database as Transactional Store

    User->>Frontend: Enter credentials (Name, Email, Password, Role)
    Frontend->>Gateway: POST /api/auth/register
    Gateway->>Database: Query user by email (Unique check)
    alt Email already exists
        Database-->>Gateway: Existing user found
        Gateway-->>Frontend: HTTP 409 Conflict ("Email already exists")
        Frontend-->>User: Display duplicate warning
    else Email is unique
        Database-->>Gateway: Null (Unique)
        Gateway->>Crypto: hashPassword(password, salt=10)
        Crypto-->>Gateway: passwordHash ($2b$10$...)
        Gateway->>Database: Insert User record & Init Wallet (Bonus ₹100)
        Database-->>Gateway: Commit success
        Gateway->>Crypto: generateToken({ id, email, role, name })
        Crypto-->>Gateway: Signed JWT token
        Gateway-->>Frontend: HTTP 201 Created (Token, Sanitized User)
        Frontend-->>User: Redirect to Authenticated Session
    end
```

---

## 2. Passenger Ride Request Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Rider as Passenger
    participant Frontend as React Client (Leaflet)
    participant Gateway as Express REST API
    participant Routing as OSRM / Geocoding Service
    participant Database as Transactional Store
    participant WS as WebSocket Gateway

    Rider->>Frontend: Select Pickup & Drop on Map, Choose Vehicle
    Frontend->>Gateway: POST /api/rides (Pickup, Drop, Vehicle, ProposedFare)
    Gateway->>Routing: getRoadRoute(pickupCoords, dropCoords)
    alt OSRM Server Online
        Routing-->>Gateway: Road distance (km), duration (mins), waypoints
    else OSRM Offline / Timeout
        Routing->>Routing: Fallback: Haversine distance + Bezier curve waypoints
        Routing-->>Gateway: Fallback distance & waypoints
    end
    Gateway->>Gateway: Calculate System Base Fare & Generate 4-digit OTP
    Gateway->>Database: Insert Ride record (status: 'BIDDING')
    Gateway->>Database: Generate initial competing driver bids
    Database-->>Gateway: Commit Success (Ride ID: RAP-XXXXX)
    Gateway->>WS: broadcastToRide(rideId, 'ride_status_changed')
    Gateway->>WS: broadcastToRide(rideId, 'bid_created')
    Gateway-->>Frontend: HTTP 201 Created (Ride object, Bids array)
    Frontend-->>Rider: Display Radar animation & Competing Bids
```

---

## 3. Driver Discovery and Ride Response Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver Partner
    participant DriverApp as Driver App
    participant WS as WebSocket Gateway
    participant Database as Transactional Store

    WS->>DriverApp: Broadcast new ride proposal (Pickup, Drop, Distance, Offer)
    Driver->>DriverApp: Review route difficulty and passenger fare
    alt Driver accepts proposed fare
        DriverApp->>WS: Submit bid matching passenger fare
    else Driver counter-bids (+₹10 / discount)
        DriverApp->>WS: Submit counter-offer with custom fare & ETA
    end
    WS->>Database: Insert bid into ride_bids (status: 'PENDING')
    WS->>WS: Broadcast 'bid_created' event to subscribed rider
```

---

## 4. Fare Negotiation Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Rider as Passenger
    participant Frontend as React Client
    participant WS as WebSocket Gateway

    WS-->>Frontend: Event 'bid_created' (Driver Ramesh: ₹50, 2 mins)
    WS-->>Frontend: Event 'bid_created' (Driver Vikramjit: ₹60, 3 mins)
    Frontend-->>Rider: Render live bidding cards
    Rider->>Frontend: Click [-] / [+] Stepper to adjust proposed fare
    Frontend->>Frontend: Recalculate bounds (0.6x to 3.0x base fare)
    Frontend->>WS: Send adjusted proposal
    WS-->>Driver: Broadcast updated offer to candidate drivers
```

---

## 5. Fare Acceptance and Driver Assignment Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Rider as Passenger
    participant Frontend as React Client
    participant Gateway as Express REST API
    participant Database as Transactional Store (Mutex)
    participant WS as WebSocket Gateway

    Rider->>Frontend: Click "Accept Bid" on Driver Ramesh (₹50)
    Frontend->>Gateway: POST /api/rides/:id/accept-bid { bidId }
    Gateway->>Gateway: Verify Caller Identity (Must be ride creator)
    Gateway->>Database: Atomic Mutex: Check ride.status == 'BIDDING'
    alt Ride already claimed / Race Condition
        Database-->>Gateway: Lock failed / status != 'BIDDING'
        Gateway-->>Frontend: HTTP 409 Conflict ("Already claimed")
        Frontend-->>Rider: Display Conflict Alert
    else Lock Acquired
        Database->>Database: Set ride.status = 'ASSIGNED', driverId = 'drv-01'
        Database->>Database: Set selected bid = 'ACCEPTED', other bids = 'EXPIRED'
        Database-->>Gateway: Commit Success
        Gateway->>WS: broadcastToRide('bid_accepted', { ride, bid })
        Gateway->>WS: broadcastToRide('ride_status_changed', { status: 'ASSIGNED' })
        Gateway-->>Frontend: HTTP 200 OK (Confirmed Assignment)
        WS-->>Frontend: Live update: Show Driver Details & Vehicle Pin
    end
```

---

## 6. Ride Start and OTP Verification Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver Partner
    actor Rider as Passenger
    participant Frontend as Client Interface
    participant Gateway as Express REST API
    participant Database as Transactional Store
    participant WS as WebSocket Gateway

    Rider->>Driver: Communicates 4-digit Security OTP (e.g., '6192')
    Driver->>Frontend: Enter OTP in Verification Modal
    Frontend->>Gateway: POST /api/rides/:id/start { otp: '6192' }
    Gateway->>Gateway: Verify Caller is Assigned Driver or Rider
    Gateway->>Database: Assert status in ['ASSIGNED', 'ARRIVED']
    Gateway->>Database: Verify otp === ride.rideOtp
    alt Invalid OTP
        Gateway-->>Frontend: HTTP 400 Bad Request ("Invalid Security OTP")
        Frontend-->>Driver: Display error indicator
    else Valid OTP Match
        Database->>Database: Set ride.status = 'IN_PROGRESS', startedAt = NOW()
        Database-->>Gateway: Commit Success
        Gateway->>WS: broadcastToRide('ride_started', { ride })
        Gateway->>WS: broadcastToRide('ride_status_changed', { status: 'IN_PROGRESS' })
        Gateway-->>Frontend: HTTP 200 OK
        WS-->>Frontend: Transition UI to En-Route Live Navigation
    end
```

---

## 7. Live GPS Tracking Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver Device
    participant DriverWS as Driver WebSocket Client
    participant GatewayWS as WebSocket Gateway Server
    participant Limiter as In-Memory Telemetry Limiter
    participant RiderMap as Rider Leaflet Map

    loop Every 1 to 3 Seconds
        Driver->>DriverWS: Hardware GPS ping [lat, lon], heading, speed
        DriverWS->>GatewayWS: Message 'driver_location_updated' { coords, speed }
        GatewayWS->>GatewayWS: Authenticate Socket & Verify Driver Assigned to Ride
        GatewayWS->>Limiter: Rate limit check (< 10 Hz)
        alt Rate limit exceeded (telemetry spam)
            Limiter-->>GatewayWS: Drop frame
        else Rate limit OK
            GatewayWS->>RiderMap: Broadcast 'driver_location_updated'
            RiderMap->>RiderMap: Smoothly interpolate vehicle marker along polyline
        end
    end
```

---

## 8. Ride Completion and Financial Settlement Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Driver Partner
    participant Frontend as Driver / Rider App
    participant Gateway as Express REST API
    participant Database as Transactional Store
    participant WS as WebSocket Gateway

    Driver->>Frontend: Click "Complete Trip" upon destination arrival
    Frontend->>Gateway: POST /api/rides/:id/complete
    Gateway->>Database: Assert ride.status == 'IN_PROGRESS'
    Gateway->>Database: Execute Atomic Settlement Transaction:
    Note over Database: 1. Set ride.status = 'COMPLETED'<br/>2. If wallet: Deduct fare from rider wallet<br/>3. Credit 85% to driver wallet (15% platform take)<br/>4. Append CREDIT & DEBIT entries in walletLedger<br/>5. Increment driver lifetime trip count
    Database-->>Gateway: Commit Success
    Gateway->>WS: broadcastToRide('ride_completed', { ride })
    Gateway->>WS: broadcastToRide('ride_status_changed', { status: 'COMPLETED' })
    Gateway-->>Frontend: HTTP 200 OK (Trip Receipt, Updated Wallet)
    Frontend-->>Driver: Show Net Earnings & Return to Online
    Frontend-->>Rider: Open Rating and Tipping Modal
```

---

## 9. Driver Rating and Tipping Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Rider as Passenger
    participant Frontend as React Client
    participant Gateway as Express REST API
    participant Database as Transactional Store

    Rider->>Frontend: Select 5 Stars, Feedback Tags, Enter ₹20 Tip
    Frontend->>Gateway: POST /api/rides/:id/rate { rating: 5, tipAmount: 20 }
    Gateway->>Gateway: Verify Caller is Ride Owner & ride.status == 'COMPLETED'
    Gateway->>Database: Check rider wallet balance >= ₹20
    Gateway->>Database: Deduct ₹20 from rider wallet; Credit ₹20 to driver wallet
    Gateway->>Database: Record dual tip transactions in walletLedger
    Gateway->>Database: Store rating and feedback tags on ride
    Database-->>Gateway: Commit Success
    Gateway-->>Frontend: HTTP 200 OK
    Frontend-->>Rider: Display Thank You & Trip Summary
```

---

## 10. Intercity Carpool Publishing Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Driver as Car Owner
    participant Frontend as React Client
    participant Gateway as Express REST API
    participant Database as Transactional Store

    Driver->>Frontend: Enter Origin, Destination, Time, Model, Price, Seats
    Frontend->>Gateway: POST /api/carpools (Payload)
    Gateway->>Gateway: Authenticate Driver via JWT
    Gateway->>Gateway: Validate seat bounds (1-6) and price bounds
    Gateway->>Database: Insert carpool record (ID: CP-XXXX, availableSeats: N)
    Database-->>Gateway: Commit Success
    Gateway-->>Frontend: HTTP 201 Created (Published Carpool)
    Frontend-->>Driver: Display Carpool Card in Marketplace
```

---

## 11. Carpool Search Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Passenger as Commuter
    participant Frontend as React Client
    participant Gateway as Express REST API
    participant Database as Transactional Store

    Passenger->>Frontend: Search "Bengaluru" to "Mysuru"
    Frontend->>Gateway: GET /api/carpools?from=Bengaluru&to=Mysuru
    Gateway->>Database: Filter carpools by city substring match
    Database-->>Gateway: Return matching carpool list
    Gateway->>Gateway: Strip private driver phone numbers (Privacy Filter)
    Gateway-->>Frontend: HTTP 200 OK (Sanitized Carpool Listings)
    Frontend-->>Passenger: Render Carpool Cards with Amenities & Seat Count
```

---

## 12. Seat Reservation and Balance Debit Workflow

### Mermaid
```mermaid
sequenceDiagram
    autonumber
    actor Passenger as Commuter
    participant Frontend as React Client
    participant Gateway as Express REST API
    participant Database as Transactional Store (Mutex)

    Passenger->>Frontend: Select 2 Seats on CP-101 (₹340/seat = ₹680 total)
    Frontend->>Gateway: POST /api/carpools/CP-101/book { seats: 2 }
    Gateway->>Gateway: Authenticate Passenger via JWT
    Gateway->>Database: Assert passengerId != carpool.driverId
    Gateway->>Database: Atomic Reservation Transaction:
    Note over Database: 1. Check carpool.availableSeats >= 2<br/>2. Check passenger wallet balance >= ₹680<br/>3. Deduct ₹680 from passenger wallet<br/>4. Append DEBIT entry to walletLedger<br/>5. Decrement availableSeats from 3 to 1<br/>6. Insert booking record in carpoolBookings
    alt Insufficient Seats or Wallet Balance
        Database-->>Gateway: Validation failure
        Gateway-->>Frontend: HTTP 400 Bad Request ("Insufficient balance/seats")
        Frontend-->>Passenger: Display prompt to recharge wallet
    else Transaction Committed
        Database-->>Gateway: Commit Success
        Gateway-->>Frontend: HTTP 200 OK (Booking Receipt, Updated Wallet)
        Frontend-->>Passenger: Show Confirmed Booking with Driver Contact
    end
```
