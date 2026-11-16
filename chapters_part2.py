# -*- coding: utf-8 -*-
"""
RideX System Design Report - Part 2: Chapters 6 to 10
"""

CHAPTER_6 = {
    "title": "Chapter 6 — Database Design",
    "sections": [
        {
            "id": "6.1",
            "title": "Database Overview",
            "content": """The persistence tier of RideX is designed to fulfill two critical architectural functions:
1. Operational Prototype Datastore: An atomic, file-backed transactional JSON document store (`server/data/mobility_store.json`), managed by the custom `Database` class in `server/db.js`. It maintains collections for `users`, `drivers`, `wallets`, `walletLedger`, `rides`, `bids`, `carpools`, `carpoolBookings`, and `contactMessages`.
2. Enterprise Production Blueprint: A relational PostgreSQL 16 schema augmented with PostGIS 3.4 spatial extensions. This enterprise blueprint provides ACID transaction guarantees, Foreign Key referential constraints, CHECK constraints, and Generalized Search Tree (GIST) spatial indexes for sub-millisecond geospatial range and route buffer queries."""
        },
        {
            "id": "6.2",
            "title": "Entity Relationship Diagram (ERD)",
            "content": """The Entity Relationship Diagram (ERD) defines the logical and physical data relationships across the system:

```
+------------------+             1:1              +-------------------+
|      USERS       | ---------------------------> |      WALLETS      |
|------------------|                              |-------------------|
| PK  id (UUID)    | <-----------+                | PK  userId (UUID) |
|     name         |             |                |     balance       |
|     email (UQ)   |             |                |     currency      |
|     phone        |             |                |     updatedAt     |
|     role         |             |                +-------------------+
|     passwordHash |             |                          |
|     createdAt    |             |                          | 1:N
+------------------+             |                          v
         |                       |                +-------------------+
         | 1:1 (if driver)       |                |   WALLET_LEDGER   |
         v                       |                |-------------------|
+------------------+             |                | PK  id (UUID)     |
|     DRIVERS      |             |                | FK  walletId      |
|------------------|             |                | FK  rideId (opt)  |
| PK  id (UUID)    |             |                |     type          |
| FK  userId       |             |                |     amount        |
|     vehicleType  |             |                |     description   |
|     model        |             |                |     idempotencyKey|
|     plateNumber  |             |                |     createdAt     |
|     rating       |             |                +-------------------+
|     trips        |             |
|     status       |             | 1:N (rider)
+------------------+             |
         |                       |
         | 1:N (as driver)       |
         v                       v
+------------------------------------+
|               RIDES                |
|------------------------------------|
| PK  id (VARCHAR / UUID)            |
| FK  riderId (UUID)                 |
| FK  driverId (UUID, opt)           |
|     service                        |
|     vehicleType                    |
|     pickupAddress / dropAddress    |
|     pickupCoords / dropCoords      |
|     distanceKm / durationMins      |
|     initialOfferFare / agreedFare  |
|     status (ENUM)                  |
|     paymentMethod / paymentStatus  |
|     rideOtp (VARCHAR 4)            |
|     rating / feedbackTags / tip    |
|     createdAt / completedAt        |
+------------------------------------+
         |                      |
         | 1:N                  | 1:N
         v                      v
+------------------+   +-------------------+
|    RIDE_BIDS     |   |     CARPOOLS      |
|------------------|   |-------------------|
| PK  bidId (UUID) |   | PK  id (VARCHAR)  |
| FK  rideId       |   | FK  driverId      |
| FK  driverId     |   |     fromCity      |
|     driverPrice  |   |     toCity        |
|     etaMins      |   |     departureTime |
|     distanceKm   |   |     totalSeats    |
|     status (ENUM)|   |     availableSeats|
|     createdAt    |   |     pricePerSeat  |
+------------------+   +-------------------+
                                 |
                                 | 1:N
                                 v
                       +-------------------+
                       | CARPOOL_BOOKINGS  |
                       |-------------------|
                       | PK  bookingId     |
                       | FK  carpoolId     |
                       | FK  passengerId   |
                       |     seats         |
                       |     totalCost     |
                       |     createdAt     |
                       +-------------------+
```"""
        },
        {
            "id": "6.3",
            "title": "Entity Descriptions",
            "content": """The schema entities and their structural attributes are defined as follows:

1. `users` Entity:
   - `id` (VARCHAR / UUID, PK): Unique user identifier (`usr-...` for riders, `drv-...` for drivers, `adm-...` for admins).
   - `name` (VARCHAR(120), NOT NULL): Full legal name of user.
   - `email` (VARCHAR(160), UNIQUE, NOT NULL): Primary contact and authentication email.
   - `phone` (VARCHAR(20), NOT NULL): Mobile telecommunication contact number.
   - `role` (VARCHAR(20), NOT NULL): User classification (`rider`, `driver`, `admin`).
   - `passwordHash` (VARCHAR(255), NOT NULL): Bcrypt salted hash (cost factor 10).
   - `createdAt` (TIMESTAMP, NOT NULL): ISO 8601 registration timestamp.

2. `drivers` Entity:
   - `id` (VARCHAR / UUID, PK): Unique driver profile identifier.
   - `userId` (VARCHAR / UUID, FK): Reference to parent `users.id`.
   - `name` (VARCHAR(120)): Commercial driver name.
   - `rating` (DECIMAL(3, 2)): Cumulative passenger rating average (1.00 to 5.00).
   - `trips` (INT): Total lifetime completed trips.
   - `vehicleType` (VARCHAR(20)): Vehicle category (`bike`, `auto`, `cab_economy`).
   - `model` (VARCHAR(100)): Vehicle make, model, and color specification.
   - `plateNumber` (VARCHAR(20)): Government vehicle registration number.
   - `location` (POINT / ARRAY): Current geographic coordinates `[latitude, longitude]`.
   - `status` (VARCHAR(20)): Operating status (`ONLINE`, `OFFLINE`, `IN_TRIP`).
   - `walletEarnings` (DECIMAL(10, 2)): Cumulative earnings balance.

3. `rides` Entity:
   - `id` (VARCHAR(30), PK): Unique booking tracking code (`RAP-XXXXX`).
   - `riderId` (VARCHAR / UUID, FK): User initiating the ride.
   - `driverId` (VARCHAR / UUID, FK, Nullable): Assigned driver partner.
   - `service` (VARCHAR(50)): Display name (`Bike Taxi`, `Rapido Auto`, `Cab Economy`, `Rapido Parcel`).
   - `vehicleType` (VARCHAR(20)): Category code (`bike`, `auto`, `cab_economy`, `parcel`).
   - `pickupAddress` / `dropAddress` (TEXT): Human-readable geocoded addresses.
   - `pickupCoords` / `dropCoords` (POINT / ARRAY): Geographic coordinates `[lat, lon]`.
   - `distanceKm` (DECIMAL(6, 2)): Calculated road travel distance.
   - `durationMins` (INT): Estimated travel duration in minutes.
   - `initialOfferFare` (DECIMAL(8, 2)): Rider's initial proposed fare.
   - `agreedFare` (DECIMAL(8, 2)): Final accepted bid fare.
   - `status` (VARCHAR(25)): State machine lifecycle status (`BIDDING`, `ASSIGNED`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - `paymentMethod` (VARCHAR(20)): Selected payment channel (`wallet`, `cash`, `upi`).
   - `paymentStatus` (VARCHAR(20)): Settlement state (`UNPAID`, `PAID`, `PARTIAL`).
   - `rideOtp` (VARCHAR(6)): 4-digit security verification code.
   - `rating` (INT, 1–5): Passenger evaluation score.
   - `tipAmount` (DECIMAL(8, 2)): Optional gratuity transferred to driver.

4. `ride_bids` Entity:
   - `bidId` (VARCHAR / UUID, PK): Unique bid identifier (`BID-...`).
   - `rideId` (VARCHAR, FK): Target ride reference.
   - `driverId` (VARCHAR, FK): Bidding driver partner.
   - `driverPrice` (DECIMAL(8, 2)): Counter-bid fare amount.
   - `etaMins` (INT): Driver's estimated arrival time to pickup.
   - `distanceKm` (DECIMAL(4, 1)): Driver's distance to pickup point.
   - `status` (VARCHAR(15)): Bid lifecycle (`PENDING`, `ACCEPTED`, `EXPIRED`).

5. `carpools` Entity:
   - `id` (VARCHAR(30), PK): Unique corridor ride identifier (`CP-XXXX`).
   - `driverId` (VARCHAR, FK): Publishing vehicle owner.
   - `fromCity` / `toCity` (VARCHAR(80)): Origin and destination cities.
   - `fromPoint` / `toPoint` (VARCHAR(160)): Specific pickup and drop landmarks.
   - `departureTime` (VARCHAR(80)): Scheduled departure time string.
   - `carModel` (VARCHAR(120)): Vehicle make and registration details.
   - `totalSeats` / `availableSeats` (INT): Total capacity and unreserved inventory.
   - `pricePerSeat` (DECIMAL(8, 2)): Driver-set fare per passenger seat.
   - `features` (ARRAY / TEXT): Amenities (`AC Available`, `Luggage Allowed`, etc.).

6. `carpool_bookings` Entity:
   - `bookingId` (VARCHAR / UUID, PK): Unique reservation receipt (`CP-BK-...`).
   - `carpoolId` (VARCHAR, FK): Booked carpool reference.
   - `passengerId` (VARCHAR, FK): Reserving passenger.
   - `seats` (INT): Quantity of seats reserved.
   - `totalCost` (DECIMAL(8, 2)): Total cost deducted from wallet (`pricePerSeat * seats`).

7. `wallets` and `wallet_ledger` Entities:
   - `wallets`: Stores primary balance per user (`userId` PK, `balance`, `currency`, `updatedAt`).
   - `wallet_ledger`: Append-only audit passbook (`id` PK, `walletId` FK, `rideId` FK, `type` ['CREDIT', 'DEBIT'], `amount`, `idempotencyKey` UNIQUE, `createdAt`)."""
        },
        {
            "id": "6.4",
            "title": "Primary Keys and Foreign Keys",
            "content": """Primary and foreign key constraints enforce relational integrity:
- Primary Keys:
  * `users.id` (UUIDv4 format string with role prefix: `usr-...`, `drv-...`).
  * `drivers.id` (UUID string matching or linked to `users.id`).
  * `rides.id` (Alphanumeric string format `RAP-XXXXX`).
  * `ride_bids.bidId` (Alphanumeric string format `BID-...`).
  * `carpools.id` (Alphanumeric string format `CP-XXXX`).
  * `carpool_bookings.bookingId` (UUID string format `CP-BK-...`).
  * `wallets.userId` (UUID string mapping 1:1 with `users.id`).
  * `wallet_ledger.id` (UUID string format `tx-...`).
- Foreign Keys:
  * `drivers.userId` references `users.id` (CASCADE on delete).
  * `rides.riderId` references `users.id` (RESTRICT on delete).
  * `rides.driverId` references `drivers.id` (SET NULL on delete).
  * `ride_bids.rideId` references `rides.id` (CASCADE on delete).
  * `ride_bids.driverId` references `drivers.id` (CASCADE on delete).
  * `carpools.driverId` references `users.id` (RESTRICT on delete).
  * `carpool_bookings.carpoolId` references `carpools.id` (CASCADE on delete).
  * `carpool_bookings.passengerId` references `users.id` (RESTRICT on delete).
  * `wallet_ledger.walletId` references `wallets.userId` (CASCADE on delete).
  * `wallet_ledger.rideId` references `rides.id` (SET NULL on delete)."""
        },
        {
            "id": "6.5",
            "title": "Relationships and Cardinality",
            "content": """The logical entity cardinalities are:
1. `users` to `wallets`: One-to-One (1:1). Every registered user account is automatically provisioned exactly one digital wallet ledger.
2. `users` to `drivers`: One-to-One (1:1 optional). A user registered under the 'driver' role has exactly one associated driver profile.
3. `users` (Rider) to `rides`: One-to-Many (1:N). A passenger can request multiple rides over time; each ride belongs to exactly one requesting rider.
4. `drivers` to `rides`: Zero-or-One to Many (0..1:N). A driver partner can fulfill many rides; an unassigned ride has no driver, while an assigned ride has exactly one driver.
5. `rides` to `ride_bids`: One-to-Many (1:N). A ride request in bidding status can receive multiple competing driver bids; each bid belongs to exactly one ride.
6. `users` (Driver) to `carpools`: One-to-Many (1:N). A car owner can publish multiple scheduled intercity corridor journeys.
7. `carpools` to `carpool_bookings`: One-to-Many (1:N). A carpool journey can accommodate multiple seat booking reservations up to its seat capacity.
8. `wallets` to `wallet_ledger`: One-to-Many (1:N). A user wallet contains an append-only sequence of immutable credit and debit ledger records."""
        },
        {
            "id": "6.6",
            "title": "Normalization",
            "content": """The database schema was rigorously normalized through the classical normal forms to eliminate data redundancy, insertion anomalies, and deletion anomalies:
- First Normal Form (1NF): All attributes are atomic and indivisible. Multi-valued arrays (such as coordinates) are formally modeled as spatial geometric points (`Point(lon, lat)`) or separate 1:N relational tables. Every relation has a defined primary key.
- Second Normal Form (2NF): All non-key attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies. In `ride_bids`, driver vehicle details are normalized into the `drivers` table rather than duplicated across individual bids.
- Third Normal Form (3NF): All transitive dependencies have been removed ($X \to Y$ and $Y \to Z$). Passenger details (name, phone) are not stored in the `rides` table; rather, `rides.rider_id` references `users.id`, preventing update anomalies when a user edits their profile.
- Boyce-Codd Normal Form (BCNF): Every determinant in the schema is a candidate key. Financial balances in `wallets` represent the materialized sum of transactions in `wallet_ledger`, where each transaction is uniquely determined by `idempotencyKey`."""
        },
        {
            "id": "6.7",
            "title": "Indexing Strategy",
            "content": """In high-throughput mobility systems, index design directly governs API query latency and throughput. The recommended indexing strategy for the production PostgreSQL database comprises:

| Table Name | Index Name | Index Type | Indexed Column(s) | Architectural Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `rides` | `idx_rides_status` | B-Tree | `status` | Accelerates filtering of active rides (`BIDDING`, `ASSIGNED`). |
| `rides` | `idx_rides_rider_id` | B-Tree | `rider_id, created_at DESC` | Enables sub-10ms retrieval of user ride history. |
| `rides` | `idx_rides_driver_id` | B-Tree | `driver_id, created_at DESC` | Powers driver earnings history and active dispatch lookups. |
| `rides` | `idx_rides_pickup_spatial` | GIST | `pickup_geom` | Sub-millisecond spatial range queries (`ST_DWithin`). |
| `ride_bids` | `idx_bids_ride_id` | B-Tree | `ride_id` | Instant retrieval of all competing bids for an active ride. |
| `carpools` | `idx_carpools_cities` | B-Tree | `from_city, to_city, departure_time` | Optimizes passenger corridor search queries. |
| `carpools` | `idx_carpools_geom` | GIST | `route_geom` | Evaluates corridor polygon buffer containment (`ST_Buffer`). |
| `wallet_ledger` | `idx_ledger_idempotency` | Unique B-Tree | `idempotency_key` | Guarantees hardware-level duplicate transaction rejection. |
| `wallet_ledger` | `idx_ledger_wallet_id` | B-Tree | `wallet_id, created_at DESC` | Powers user wallet passbook queries. |"""
        },
        {
            "id": "6.8",
            "title": "Data Integrity Constraints",
            "content": """Integrity constraints enforced at the database layer include:
- NOT NULL Constraints: Mandatory fields include `user.email`, `user.passwordHash`, `rides.riderId`, `rides.pickupCoords`, and `rides.initialOfferFare`.
- UNIQUE Constraints: `users.email` and `wallet_ledger.idempotencyKey`.
- CHECK Constraints:
  * `rides.status IN ('BIDDING', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`
  * `rides.vehicleType IN ('bike', 'auto', 'cab_economy', 'parcel')`
  * `carpools.availableSeats >= 0 AND carpools.availableSeats <= carpools.totalSeats`
  * `wallets.balance >= 0` (prevents overdrafts during debit settlements)
  * `rides.rating BETWEEN 1 AND 5`"""
        },
        {
            "id": "6.9",
            "title": "Sample Database Records",
            "content": """Representative sample JSON data records from `server/data/mobility_store.json`:

1. Sample User Record (`users` collection):
```json
{
  "id": "usr-01",
  "name": "Rahul Verma",
  "phone": "+91 98765 00001",
  "email": "rider@ridex.com",
  "role": "rider",
  "passwordHash": "$2b$10$aPsH/.EIWzW7LZNrxDnR6uwRDy26RkCjN/maz7WV0z/5fqCiTW5aq",
  "createdAt": "2026-10-30T00:00:00.000Z"
}
```

2. Sample Active Ride Record (`rides` collection):
```json
{
  "id": "RAP-84920",
  "riderId": "usr-01",
  "driverId": "drv-01",
  "service": "Bike Taxi",
  "vehicleType": "bike",
  "pickupAddress": "Indiranagar 100ft Road, Bengaluru",
  "dropAddress": "Koramangala 5th Block, Bengaluru",
  "pickupCoords": [12.9784, 77.6408],
  "dropCoords": [12.9352, 77.6245],
  "distanceKm": 6.2,
  "durationMins": 18,
  "recommendedFare": 68.0,
  "initialOfferFare": 65.0,
  "agreedFare": 68.0,
  "status": "COMPLETED",
  "paymentMethod": "wallet",
  "paymentStatus": "PAID",
  "rideOtp": "4821",
  "rating": 5,
  "tipAmount": 20.0,
  "createdAt": "2026-10-29T10:00:00.000Z",
  "completedAt": "2026-10-29T10:18:00.000Z"
}
```

3. Sample Intercity Carpool Record (`carpools` collection):
```json
{
  "id": "CP-101",
  "driverId": "drv-01",
  "driverName": "Siddharth Rao",
  "fromCity": "Bengaluru",
  "toCity": "Mysuru",
  "fromPoint": "Silk Board Junction / Electronic City Toll",
  "toPoint": "Suburban Bus Stand, Mysuru",
  "departureTime": "Today, 05:30 PM",
  "carModel": "Honda City (White) - KA 04 MD 8821",
  "totalSeats": 3,
  "availableSeats": 2,
  "pricePerSeat": 340.0,
  "features": ["AC Available", "Max 2 in back", "Instant Booking"],
  "createdAt": "2026-10-30T04:00:00.000Z"
}
```"""
        },
        {
            "id": "6.10",
            "title": "Query Design",
            "content": """Critical SQL queries engineered for the production PostgreSQL + PostGIS platform:

1. Spatial Proximity Query (Discover drivers within 3 km of passenger pickup):
```sql
SELECT driver_id, name, vehicle_type, rating,
       ST_Distance(location_geom::geography, ST_SetSRID(ST_Point(77.6408, 12.9784), 4326)::geography) AS distance_meters
FROM drivers
WHERE status = 'ONLINE'
  AND vehicle_type = 'bike'
  AND ST_DWithin(location_geom::geography, ST_SetSRID(ST_Point(77.6408, 12.9784), 4326)::geography, 3000)
ORDER BY distance_meters ASC
LIMIT 10;
```

2. Atomic Carpool Seat Booking with Inventory Guard:
```sql
-- Atomically decrement seat count only if sufficient inventory exists
UPDATE carpools
SET available_seats = available_seats - $requestedSeats
WHERE id = $carpoolId
  AND available_seats >= $requestedSeats;
```

3. Atomic Ride Bid Acceptance under Mutex Lock:
```sql
-- Acquire row lock to prevent race conditions during concurrent bid acceptance
SELECT status FROM rides WHERE id = $rideId FOR UPDATE;

-- Update ride status and assign winning driver
UPDATE rides
SET status = 'ASSIGNED', driver_id = $driverId, agreed_fare = $agreedFare, updated_at = NOW()
WHERE id = $rideId AND status = 'BIDDING';

-- Invalidate competing bids
UPDATE ride_bids
SET status = CASE WHEN bid_id = $acceptedBidId THEN 'ACCEPTED' ELSE 'EXPIRED' END
WHERE ride_id = $rideId;
```"""
        }
    ]
}

CHAPTER_7 = {
    "title": "Chapter 7 — Functional Design and API Documentation",
    "sections": [
        {
            "id": "7.1",
            "title": "Authentication APIs",
            "content": """The Authentication endpoints provide registration, login, and identity verification:

1. POST /api/auth/register
   - HTTP Method: POST
   - Endpoint: `/api/auth/register`
   - Authentication: Public (Rate limited: 30 req / 15 min)
   - Headers: `Content-Type: application/json`
   - Request Body:
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
   - Validation Rules: `name` (1–120 chars, sanitized), `email` (valid regex, unique), `phone` (8–20 chars), `password` (6–128 chars), `role` ('rider' or 'driver').
   - Backend Processing: Checks duplicate email; hashes password via bcrypt (salt 10); creates user object; initializes wallet with welcome bonus (₹100 for riders, ₹0 for drivers); creates driver profile if role is 'driver'; signs JWT token.
   - Success Response (201 Created):
     ```json
     {
       "success": true,
       "token": "eyJhbGciOiJIUzI1NiIsIn...",
       "user": { "id": "usr-uuid", "name": "Aanya Sharma", "email": "aanya@example.com", "role": "rider" },
       "message": "Account registered successfully"
     }
     ```
   - Error Responses: 400 Bad Request (validation failure), 409 Conflict (email already registered), 500 Internal Error.

2. POST /api/auth/login
   - HTTP Method: POST
   - Endpoint: `/api/auth/login`
   - Authentication: Public (Rate limited: 30 req / 15 min)
   - Request Body: `{ "email": "aanya@example.com", "password": "Password@123" }`
   - Backend Processing: Finds user by email; executes constant-time bcrypt compare; generates JWT token.
   - Success Response (200 OK): `{ "success": true, "token": "...", "user": { ... } }`
   - Error Responses: 400 Bad Request, 401 Unauthorized ("Invalid email or password")."""
        },
        {
            "id": "7.2",
            "title": "User Management APIs",
            "content": """GET /api/auth/me
- HTTP Method: GET
- Endpoint: `/api/auth/me`
- Authentication: Protected (Bearer JWT in Authorization header)
- Request Headers: `Authorization: Bearer <token>`
- Backend Processing: Decodes JWT claims; retrieves user record; strips password hashes; attaches wallet balance and driver profile (if applicable).
- Success Response (200 OK):
  ```json
  {
    "success": true,
    "user": { "id": "usr-01", "name": "Rahul Verma", "email": "rider@ridex.com", "role": "rider" },
    "wallet": { "userId": "usr-01", "balance": 450.0, "currency": "INR" },
    "driverProfile": null
  }
  ```
- Error Responses: 401 Unauthorized (missing or expired token), 404 Not Found."""
        },
        {
            "id": "7.3",
            "title": "Driver Management APIs",
            "content": """GET /api/geo/drivers
- HTTP Method: GET
- Endpoint: `/api/geo/drivers`
- Authentication: Public
- Backend Processing: Queries active driver fleet from store; filters private PII (hides phone numbers); returns public fields.
- Success Response (200 OK):
  ```json
  {
    "drivers": [
      {
        "id": "drv-01",
        "name": "Ramesh Kumar",
        "rating": 4.89,
        "trips": 3420,
        "vehicleType": "bike",
        "model": "Honda Activa 6G (Grey)",
        "plateNumber": "KA 05 MN 4821",
        "location": [12.9814, 77.6428],
        "status": "ONLINE"
      }
    ]
  }
  ```"""
        },
        {
            "id": "7.4",
            "title": "Ride Booking APIs",
            "content": """POST /api/rides
- HTTP Method: POST
- Endpoint: `/api/rides`
- Authentication: Protected (Bearer JWT)
- Request Body:
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
- Validation Rules: Valid coordinates (`[-90, 90]`, `[-180, 180]`), `vehicleType` in `['bike', 'auto', 'cab_economy', 'parcel']`, `paymentMethod` in `['wallet', 'cash', 'upi']`, `proposedFare` > 0 and < 10000.
- Backend Processing:
  1. Computes road distance and travel time via OSRM (or Haversine fallback).
  2. Calculates recommended system base fare.
  3. Binds ride to authenticated `req.user.id`.
  4. Generates unique tracking ID (`RAP-XXXXX`) and 4-digit security OTP.
  5. Synthesizes initial competing driver bids.
  6. Broadcasts `ride_status_changed` and `bid_created` events over WebSocket.
- Success Response (201 Created):
  ```json
  {
    "success": true,
    "ride": {
      "id": "RAP-58219",
      "riderId": "usr-01",
      "service": "Bike Taxi",
      "vehicleType": "bike",
      "pickupCoords": [12.9784, 77.6408],
      "dropCoords": [12.9756, 77.6066],
      "distanceKm": 4.2,
      "durationMins": 12,
      "initialOfferFare": 50,
      "agreedFare": 50,
      "status": "BIDDING",
      "rideOtp": "6192",
      "createdAt": "2026-10-30T10:00:00.000Z"
    },
    "bids": [
      {
        "bidId": "BID-uuid1",
        "driverName": "Ramesh Kumar",
        "driverPrice": 50,
        "etaMins": 2,
        "status": "PENDING"
      }
    ]
  }
  ```"""
        },
        {
            "id": "7.5",
            "title": "Fare Negotiation APIs",
            "content": """POST /api/rides/:id/accept-bid
- HTTP Method: POST
- Endpoint: `/api/rides/:id/accept-bid`
- Authentication: Protected (Bearer JWT)
- Request Body: `{ "bidId": "BID-uuid1" }`
- Validation & Ownership: Requester must be the rider who created the ride (`ride.riderId === req.user.id`). Ride must be in 'BIDDING' status.
- Backend Processing:
  1. Verifies ride status is 'BIDDING'.
  2. Atomically sets chosen bid status to 'ACCEPTED'.
  3. Sets all other bids for this ride to 'EXPIRED'.
  4. Updates ride status to 'ASSIGNED', binds `driverId` and `agreedFare`.
  5. Broadcasts `bid_accepted` and `ride_status_changed` events via WebSocket.
- Success Response (200 OK):
  ```json
  {
    "success": true,
    "ride": { "id": "RAP-58219", "status": "ASSIGNED", "agreedFare": 50, "driverId": "drv-01" },
    "bid": { "bidId": "BID-uuid1", "status": "ACCEPTED" }
  }
  ```
- Error Responses: 400 Bad Request (missing `bidId`), 403 Forbidden (caller is not ride owner), 404 Not Found, 409 Conflict (ride already claimed)."""
        },
        {
            "id": "7.6",
            "title": "Ride Lifecycle APIs",
            "content": """1. POST /api/rides/:id/start
   - Authentication: Protected (Assigned driver, rider, or admin)
   - Request Body: `{ "otp": "6192" }`
   - Processing: Asserts status is 'ASSIGNED' or 'ARRIVED'; validates `otp === ride.rideOtp`; transitions status to 'IN_PROGRESS'; broadcasts `ride_started`.
   - Success Response (200 OK): `{ "success": true, "ride": { "status": "IN_PROGRESS", ... } }`
   - Error Responses: 400 Bad Request ("Invalid Security OTP"), 403 Forbidden, 409 Conflict.

2. POST /api/rides/:id/complete
   - Authentication: Protected (Assigned driver, rider, or admin)
   - Processing: Asserts status is 'IN_PROGRESS'; transitions status to 'COMPLETED'; executes financial settlement: if payment is 'wallet', deducts fare from rider wallet, credits 85% to driver wallet (15% platform fee), and appends double-entry transactions to `walletLedger`; broadcasts `ride_completed`.
   - Success Response (200 OK): `{ "success": true, "ride": { "status": "COMPLETED", ... }, "wallet": { ... } }`

3. POST /api/rides/:id/rate
   - Authentication: Protected (Rider only)
   - Request Body: `{ "rating": 5, "feedbackTags": ["Punctual", "Smooth Ride"], "tipAmount": 20 }`
   - Processing: Asserts ride is 'COMPLETED'; records rating and tags; if `tipAmount > 0`, deducts tip from rider wallet and credits 100% to driver wallet with ledger entries.
   - Success Response (200 OK): `{ "success": true }`

4. POST /api/rides/:id/cancel
   - Authentication: Protected (Rider, assigned driver, or admin)
   - Processing: Verifies ride is not 'COMPLETED'; transitions status to 'CANCELLED'; broadcasts `ride_cancelled`.
   - Success Response (200 OK): `{ "success": true }`

5. GET /api/rides/:id
   - Authentication: Protected (Owner, assigned driver, or admin only)
   - Success Response (200 OK): `{ "ride": { ... }, "bids": [ ... ] }`

6. GET /api/rides
   - Authentication: Protected (Scoped to authenticated user's rides)
   - Query Parameters: `limit` (default 100, max 200)
   - Success Response (200 OK): `{ "rides": [ ... ] }`"""
        },
        {
            "id": "7.7",
            "title": "GPS and Geolocation APIs",
            "content": """1. GET /api/geo/route
   - Query Parameters: `startLat`, `startLon`, `endLat`, `endLon`
   - Processing: Calls OSRM driving route API; falls back to Haversine/Bezier formula if OSRM is unreachable.
   - Success Response (200 OK):
     ```json
     {
       "success": true,
       "source": "OSRM_ROAD_NETWORK",
       "distanceKm": 5.2,
       "durationMins": 16,
       "waypoints": [[12.9784, 77.6408], [12.9750, 77.6380], ...]
     }
     ```

2. GET /api/geo/search
   - Query Parameters: `q` (search term, e.g., "Koramangala")
   - Processing: Calls OpenStreetMap Nominatim forward geocoding API with Indian country code filter.
   - Success Response (200 OK): `{ "results": [{ "name": "Koramangala", "address": "...", "coords": [12.9352, 77.6245] }] }`"""
        },
        {
            "id": "7.8",
            "title": "Carpool Management APIs",
            "content": """1. GET /api/carpools
   - Authentication: Public / Optional Auth
   - Query Parameters: `from` (origin city filter), `to` (destination city filter)
   - Processing: Filters carpools by case-insensitive city matching; strips driver phone numbers for public privacy.
   - Success Response (200 OK):
     ```json
     {
       "carpools": [
         {
           "id": "CP-101",
           "driverName": "Siddharth Rao",
           "fromCity": "Bengaluru",
           "toCity": "Mysuru",
           "departureTime": "Today, 05:30 PM",
           "totalSeats": 3,
           "availableSeats": 2,
           "pricePerSeat": 340
         }
       ]
     }
     ```

2. POST /api/carpools
   - Authentication: Protected (Bearer JWT)
   - Request Body:
     ```json
     {
       "fromCity": "Bengaluru",
       "toCity": "Mysuru",
       "fromPoint": "Silk Board Junction",
       "toPoint": "Suburban Bus Stand",
       "departureTime": "Tomorrow, 06:00 AM",
       "carModel": "Honda City (White)",
       "totalSeats": 3,
       "pricePerSeat": 350,
       "features": ["AC Available", "Luggage Allowed"],
       "notes": "Leaving strictly on time."
     }
     ```
   - Processing: Validates seat limits (1–6) and price per seat (> 0 and < 100,000); binds carpool to authenticated user as driver; assigns `CP-XXXX` ID.
   - Success Response (201 Created): `{ "success": true, "carpool": { ... } }`"""
        },
        {
            "id": "7.9",
            "title": "Seat Booking APIs",
            "content": """POST /api/carpools/:id/book
- HTTP Method: POST
- Endpoint: `/api/carpools/:id/book`
- Authentication: Protected (Bearer JWT)
- Request Body: `{ "seats": 2 }`
- Validation & Processing:
  1. Validates seats requested (1–6).
  2. Asserts passenger is not the carpool driver.
  3. Verifies `availableSeats >= seats`.
  4. Calculates `totalCost = pricePerSeat * seats`.
  5. Verifies passenger wallet balance $\\ge$ totalCost.
  6. Atomically deducts totalCost from wallet; appends DEBIT ledger transaction.
  7. Decrements `availableSeats` by requested seats.
  8. Creates booking record in `carpoolBookings`.
- Success Response (200 OK):
  ```json
  {
    "success": true,
    "booking": {
      "bookingId": "CP-BK-uuid",
      "carpoolId": "CP-101",
      "passengerId": "usr-01",
      "seats": 2,
      "totalCost": 680,
      "fromCity": "Bengaluru",
      "toCity": "Mysuru"
    },
    "carpool": { "id": "CP-101", "availableSeats": 0 },
    "wallet": { "balance": 320.0 }
  }
  ```
- Error Responses: 400 Bad Request ("You cannot book your own carpool", "Only X seats remaining", or "Insufficient wallet balance")."""
        },
        {
            "id": "7.10",
            "title": "Wallet and Ledger APIs",
            "content": """1. GET /api/wallet
   - Authentication: Protected (Bearer JWT)
   - Processing: Retrieves user's wallet record and chronological transaction ledger entries matching `walletId === req.user.id`.
   - Success Response (200 OK):
     ```json
     {
       "wallet": { "userId": "usr-01", "balance": 450.0, "currency": "INR" },
       "ledger": [
         {
           "id": "tx-init-01",
           "type": "CREDIT",
           "amount": 450.0,
           "description": "Welcome Promo Balance",
           "idempotencyKey": "init-key-01",
           "createdAt": "..."
         }
       ]
     }
     ```

2. POST /api/wallet/topup
   - Authentication: Protected (Bearer JWT)
   - Request Body: `{ "amount": 200, "idempotencyKey": "topup-usr-01-12345" }`
   - Processing: Validates amount > 0 and $\\le$ 10000; checks if `idempotencyKey` already exists for this user (if so, returns existing record without balance mutation); credits wallet balance; inserts CREDIT transaction.
   - Success Response (200 OK): `{ "success": true, "wallet": { "balance": 650.0 }, "entry": { ... } }`"""
        },
        {
            "id": "7.11",
            "title": "Contact and Support APIs",
            "content": """POST /api/contact
- HTTP Method: POST
- Endpoint: `/api/contact`
- Authentication: Public (Rate limited: 10 req / 10 min)
- Request Body:
  ```json
  {
    "name": "Priya Nair",
    "email": "priya@example.com",
    "mobile": "+91 98450 12345",
    "role": "Customer",
    "query": "Ride Query",
    "comment": "Driver was exceptionally professional."
  }
  ```
- Processing: Strips HTML tags (`<`, `>`); validates email and mobile regex; stores message ticket in `contactMessages` (max 500 records FIFO).
- Success Response (201 Created):
  ```json
  {
    "success": true,
    "message": "Thanks for reaching out. Our support team will respond within 24 hours.",
    "ticketId": "uuid"
  }
  ```"""
        },
        {
            "id": "7.12",
            "title": "WebSocket Protocol and Event Schema",
            "content": """The WebSocket gateway is exposed at `ws://localhost:5000/ws` (or `wss://domain/ws`). Message payloads adhere to a unified JSON schema: `{ "type": string, "rideId": string | null, "payload": object, "timestamp": string }`.

| Event Type | Direction | Initiator | Payload Schema | Functional Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `connection_established` | Server ➔ Client | Server | `{ authenticated: bool, user: object, message: string }` | Handshake greeting upon opening connection. |
| `authenticate` | Client ➔ Server | Client | `{ token: string }` | Explicit session authentication if token was not in query string. |
| `authenticated` | Server ➔ Client | Server | `{ user: object, message: string }` | Confirms valid authentication and attaches user claims. |
| `subscribe_ride` | Client ➔ Server | Client | Ride ID in `rideId` field | Subscribes socket to private room for a specific ride. |
| `subscription_confirmed` | Server ➔ Client | Server | `{ rideId: string, status: string, role: string }` | Confirms authorized subscription to ride events. |
| `unsubscribe_ride` | Client ➔ Server | Client | Ride ID in `rideId` field | Removes socket from ride event room. |
| `bid_created` | Server ➔ Client | Server | `{ bid: object }` | Notifies subscribed rider of a new driver counter-bid. |
| `bid_accepted` | Server ➔ Client | Server | `{ ride: object, bid: object }` | Notifies subscribers that a driver bid was accepted. |
| `ride_status_changed` | Server ➔ Client | Server | `{ status: string, ride: object }` | Broadcasts lifecycle transitions (`ASSIGNED`, `IN_PROGRESS`, etc.). |
| `driver_location_updated` | Client ➔ Server / Server ➔ Client | Driver / Server | `{ coords: [lat, lng], heading: num, speedKmH: num, etaMins: num, distanceRemainingKm: num }` | Ingests driver GPS and broadcasts live telemetry to passenger map. |
| `ride_started` | Server ➔ Client | Server | `{ ride: object }` | Broadcasts trip commencement following valid OTP verification. |
| `ride_completed` | Server ➔ Client | Server | `{ ride: object }` | Broadcasts trip completion and triggers receipt modal. |
| `ride_cancelled` | Server ➔ Client | Server | `{ rideId: string, cancelledBy: string }` | Broadcasts ride cancellation to all parties. |
| `ping` / `pong` | Both | Either | `{ reply: "pong" }` | Application-level heartbeat probe. |"""
        }
    ]
}

CHAPTER_8 = {
    "title": "Chapter 8 — Functional Workflows and Sequence Diagrams",
    "sections": [
        {
            "id": "8.1",
            "title": "User Registration and Login Workflow",
            "content": """The user onboarding sequence coordinates frontend form submission, bcrypt password hashing, database persistence, and JWT session generation.

```
Passenger / Driver        Frontend UI           API Gateway / Auth       Database
        |                      |                         |                   |
        |--- 1. Enter Form --->|                         |                   |
        |    (Name, Email,     |--- 2. POST /register -->|                   |
        |     Phone, Pwd)      |                         |--- 3. Find User ->|
        |                      |                         |<-- 4. Not Found --|
        |                      |                         |                   |
        |                      |                         |-- 5. bcrypt.hash -|
        |                      |                         |-- 6. Insert User >|
        |                      |                         |-- 7. Init Wallet >|
        |                      |                         |                   |
        |                      |                         |-- 8. Sign JWT ----|
        |                      |<-- 9. HTTP 201 (Token) -|                   |
        |<-- 10. Logged In ----|                         |                   |
```
Alternative Flows & Error Handling: If the email already exists in Step 4, the backend halts and returns HTTP 409 Conflict. If password validation fails, HTTP 400 Bad Request is returned."""
        },
        {
            "id": "8.2",
            "title": "Passenger Ride Request Workflow",
            "content": """The ride initiation flow triggers distance routing and competing driver bid generation:

```
Rider UI                 REST API Router           Routing Service         WebSocket Server
   |                            |                         |                        |
   |-- 1. POST /api/rides ----->|                         |                        |
   |   (Pickup, Drop, Vehicle)  |-- 2. getRoadRoute() --->|                        |
   |                            |<-- 3. Distance & Poly --|                        |
   |                            |                                                  |
   |                            |-- 4. Calculate Base Fare                         |
   |                            |-- 5. Insert Ride Record ('BIDDING')              |
   |                            |-- 6. Generate Initial Driver Bids                |
   |                            |                                                  |
   |                            |-- 7. broadcastToRide('ride_status_changed') ---->|
   |                            |-- 8. broadcastToRide('bid_created') ------------>|
   |<-- 9. HTTP 201 (Ride, Bids)|                                                  |
```"""
        },
        {
            "id": "8.3",
            "title": "Driver Discovery and Ride Response Workflow",
            "content": """When a ride is published, the backend queries active online drivers matching the vehicle category. Candidate drivers receive the ride proposal with upfront distance, origin, destination, and passenger proposed fare. Drivers evaluate the route difficulty and submit either an acceptance or a counter-bid with estimated arrival times."""
        },
        {
            "id": "8.4",
            "title": "Fare Negotiation Workflow",
            "content": """The rider evaluates incoming counter-bids displayed in real-time cards. The rider can adjust their offer using stepper buttons (`[-]` / `[+]`). Stepper adjustments recalculate the proposed fare within bounded limits (0.6x to 3.0x base fare) and re-broadcast the offer to active drivers."""
        },
        {
            "id": "8.5",
            "title": "Fare Acceptance and Driver Assignment Workflow",
            "content": """Atomic bid acceptance guarantees single-winner allocation:

```
Rider UI                  REST Controller           Database (Atomic Lock)   WebSocket Server
   |                             |                            |                     |
   |-- 1. POST /accept-bid ----->|                            |                     |
   |      (rideId, bidId)        |-- 2. Check Ownership       |                     |
   |                             |-- 3. db.transaction() ---->|                     |
   |                             |      Assert status=='BIDDING'                    |
   |                             |      Set ride.status='ASSIGNED'                  |
   |                             |      Set bid.status='ACCEPTED'                   |
   |                             |      Expire other bids                           |
   |                             |<-- 4. Commit Success ------|                     |
   |                             |                                                  |
   |                             |-- 5. Broadcast 'bid_accepted' ------------------>|
   |                             |-- 6. Broadcast 'ride_status_changed' ----------->|
   |<-- 7. HTTP 200 (Assigned) --|                                                  |
```
Race Condition Handling: If another driver or conflicting action changed the ride status, Step 3 fails the assertion and returns HTTP 409 Conflict ("Ride already claimed")."""
        },
        {
            "id": "8.6",
            "title": "Ride Start and OTP Verification Workflow",
            "content": """To commence the journey, the driver enters the rider's 4-digit security OTP:

```
Driver / Rider UI          REST Controller          Database Verification    WebSocket Server
        |                         |                           |                     |
        |-- 1. POST /start ------>|                           |                     |
        |      (rideId, otp)      |-- 2. Assert Auth Driver --|                     |
        |                         |-- 3. Verify OTP Match --->|                     |
        |                         |      Update 'IN_PROGRESS' |                     |
        |                         |<-- 4. Commit Success -----|                     |
        |                         |                                                 |
        |                         |-- 5. Broadcast 'ride_started' ----------------->|
        |<-- 6. HTTP 200 OK ------|                                                 |
```
Failure Scenario: If the submitted OTP does not match the stored `rideOtp`, the backend rejects the transaction with HTTP 400 Bad Request ("Invalid Security OTP"), preventing unauthorized trip commencement."""
        },
        {
            "id": "8.7",
            "title": "Live GPS Tracking Workflow",
            "content": """High-frequency driver telemetry streaming sequence:

```
Driver Smartphone         WebSocket Gateway        Rate Limiter / Auth     Passenger Client Map
        |                         |                        |                         |
        |-- 1. driver_location -->|                        |                         |
        |      [lat, lng], speed  |-- 2. Verify Driver --->|                         |
        |                         |-- 3. Check Rate Limit -| (<10 Hz)                |
        |                         |                                                  |
        |                         |-- 4. Broadcast to Ride Room -------------------->|
        |                         |                                                  |-- 5. Interpolate
        |                         |                                                         Vehicle Marker
```
Anti-Spoofing Guard: If an unauthorized driver attempts to publish GPS telemetry for a ride they are not assigned to, the gateway drops the payload and transmits an HTTP 403 / error frame."""
        },
        {
            "id": "8.8",
            "title": "Ride Completion and Financial Settlement Workflow",
            "content": """Trip completion triggers automated fare deduction and double-entry ledger bookkeeping:

```
Driver Partner            REST Controller          Database (Transaction)   WebSocket Server
      |                          |                           |                     |
      |-- 1. POST /complete ---->|                           |                     |
      |                          |-- 2. Verify Assignment    |                     |
      |                          |-- 3. db.transaction() --->|                     |
      |                          |      Status='COMPLETED'   |                     |
      |                          |      Deduct Rider Wallet  |                     |
      |                          |      Credit 85% to Driver |                     |
      |                          |      Append Ledger Entries|                     |
      |                          |<-- 4. Commit Success -----|                     |
      |                          |                                                 |
      |                          |-- 5. Broadcast 'ride_completed' --------------->|
      |<-- 6. HTTP 200 (Receipt) |                                                 |
```"""
        },
        {
            "id": "8.9",
            "title": "Driver Rating and Tipping Workflow",
            "content": """Following ride completion, the passenger submits a numeric rating (1–5), feedback tags, and an optional tip (₹0–₹5000). The backend validates that the ride is in 'COMPLETED' status and that no prior tip has been submitted. If a tip is specified, the rider's wallet is debited and the driver's wallet is credited with 100% of the tip amount, accompanied by dual ledger records."""
        },
        {
            "id": "8.10",
            "title": "Intercity Carpool Publishing Workflow",
            "content": """A car owner publishes an intercity journey by specifying origin, destination, departure time, seat availability, and per-seat price. The backend validates capacity (1–6 seats), checks positive pricing, attaches driver contact details, generates a unique `CP-XXXX` identifier, and registers the carpool in the active marketplace."""
        },
        {
            "id": "8.11",
            "title": "Carpool Search Workflow",
            "content": """A prospective traveler queries `/api/carpools?from=Bengaluru&to=Mysuru`. The backend performs case-insensitive substring filtering on `fromCity` and `toCity`, sanitizes driver phone numbers to protect personal privacy, and returns matching carpool listings sorted by departure schedule."""
        },
        {
            "id": "8.12",
            "title": "Seat Reservation and Balance Debit Workflow",
            "content": """Seat reservation enforces atomic inventory locking:

```
Passenger UI              REST Controller          Database (Atomic Lock)   Wallet Ledger
     |                           |                           |                    |
     |-- 1. POST /book --------->|                           |                    |
     |   (carpoolId, seats=2)    |-- 2. Assert Pass!=Driver  |                    |
     |                           |-- 3. db.transaction() --->|                    |
     |                           |      Check availSeats>=2  |                    |
     |                           |      Check wallet balance |                    |
     |                           |      Deduct totalCost --->|------------------->|
     |                           |      Decrement availSeats |                    |
     |                           |      Insert Booking Record|                    |
     |                           |<-- 4. Commit Success -----|                    |
     |<-- 5. HTTP 200 (Booked) --|                                                |
```"""
        }
    ]
}

CHAPTER_9 = {
    "title": "Chapter 9 — Algorithms and Business Logic",
    "sections": [
        {
            "id": "9.1",
            "title": "Haversine Distance Formulation",
            "content": """1. Problem Definition: Compute the spherical surface distance between two geographic coordinates $(\\phi_1, \\lambda_1)$ and $(\\phi_2, \\lambda_2)$ on Earth, utilized as a high-speed mathematical fallback when external road routing services are unavailable.
2. Mathematical Formula:
   Let $R = 6371 \text{ km}$ (mean Earth radius).
   $$\\Delta \\phi = \\frac{(\\phi_2 - \\phi_1) \\pi}{180}, \\quad \\Delta \\lambda = \\frac{(\\lambda_2 - \\lambda_1) \\pi}{180}$$
   $$a = \\sin^2\\\left(\\frac{\\Delta \\phi}{2}\\right) + \\cos\\\left(\\frac{\\phi_1 \\pi}{180}\\right) \\cos\\\left(\\frac{\\phi_2 \\pi}{180}\\right) \\sin^2\\\left(\\frac{\\Delta \\lambda}{2}\\right)$$
   $$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1 - a})$$
   $$d = R \cdot c$$
3. Pseudocode:
   ```javascript
   function haversineDistance(lat1, lon1, lat2, lon2) {
     const R = 6371;
     const dLat = ((lat2 - lat1) * Math.PI) / 180;
     const dLon = ((lon2 - lon1) * Math.PI) / 180;
     const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
     return Math.max(1.0, +(R * c).toFixed(2));
   }
   ```
4. Complexity: Time Complexity: $O(1)$ constant time. Space Complexity: $O(1)$ auxiliary storage."""
        },
        {
            "id": "9.2",
            "title": "Road Pathing and Bezier Fallback Interpolation",
            "content": """1. Problem Definition: Generate smooth, road-like navigational waypoints between pickup and destination coordinates.
2. Algorithm Logic:
   - Primary: Query OSRM HTTP API (`/route/v1/driving/...`). Parse GeoJSON coordinates `[lon, lat]` and invert to Leaflet-compatible `[lat, lon]`.
   - Fallback: When OSRM fails or times out (3500 ms threshold), calculate the midpoint with an orthogonal curvature offset and interpolate $N=30$ waypoints using quadratic Bezier polynomials:
     $$B(t) = (1 - t)^2 P_{\text{start}} + 2(1 - t)t P_{\text{mid}} + t^2 P_{\text{end}}, \\quad t \\in [0, 1]$$
3. Complexity: Time Complexity: $O(N)$ where $N=30$ waypoints. Space Complexity: $O(N)$ array buffer."""
        },
        {
            "id": "9.3",
            "title": "inDrive Dynamic Bidding Engine",
            "content": """1. Problem Definition: Manage a multi-party auction where passengers propose base fares and drivers submit real-time counter-offers, ensuring bounds enforcement and race-free allocation.
2. Step-by-Step Logic:
   - Step 1: Rider inputs custom proposed fare $F_{\text{offer}}$.
   - Step 2: System validates fare bounds:
     $$0.6 \\times F_{\text{base}} \\le F_{\text{offer}} \\le 3.0 \\times F_{\text{base}}$$
   - Step 3: Broadcast offer to candidate drivers matching vehicle type.
   - Step 4: Drivers submit bids $F_{\text{driver}}$ with arrival ETAs.
   - Step 5: Rider evaluates bid matrix and accepts chosen bid.
   - Step 6: Backend acquires atomic transaction lock, asserts status is 'BIDDING', transitions status to 'ASSIGNED', marks chosen bid 'ACCEPTED', and marks competing bids 'EXPIRED'.
3. Concurrency Protection: Prevents double-booking when multiple drivers are accepted simultaneously via atomic compare-and-swap semantics."""
        },
        {
            "id": "9.4",
            "title": "Intercity Carpool Corridor Buffering and Detour Filter",
            "content": """1. Problem Definition: Match long-distance carpool drivers with corridor passengers without imposing unacceptable route detours on the driver.
2. Algorithm Formulation (PostGIS Specification):
   - Driver route polyline $R$ is buffered by radius $W = 5000 \text{ meters}$:
     $$\text{Corridor} = \text{ST\_Buffer}(R, 5000)$$
   - Passenger pickup $P_{\text{pickup}}$ and drop $P_{\text{drop}}$ must both evaluate true:
     $$\text{ST\_Contains}(\text{Corridor}, P_{\text{pickup}}) \land \text{ST\_Contains}(\text{Corridor}, P_{\text{drop}}) = \text{TRUE}$$
   - Detour Tolerance Constraint:
     $$\text{Dist}(P_{\text{start}} \to P_{\text{pickup}} \to P_{\text{drop}} \to P_{\text{end}}) \\le 1.15 \\times \text{Dist}(P_{\text{start}} \to P_{\text{end}})$$
   - Seat Inventory Lock: Decrement available seats using atomic optimistic updates:
     $$\text{UPDATE carpools SET available\_seats} = \text{available\_seats} - S \text{ WHERE available\_seats} \\ge S$$"""
        },
        {
            "id": "9.5",
            "title": "Atomic Mutex Locking Pattern",
            "content": """1. Problem Definition: Guarantee that financial transactions and ride assignments remain strictly isolated under concurrent multi-threaded execution.
2. Implementation Pattern:
   - In Prototype: Synchronous critical section in `server/db.js` using `db.transaction(fn)` wrapping file read-modify-atomic-rename cycles.
   - In Production: Redis Redlock algorithm:
     ```
     Acquire Lock "lock:ride:{id}" with TTL 5000 ms
     IF lock acquired:
         Execute SQL UPDATE rides SET status='ASSIGNED' WHERE status='BIDDING'
         Release Lock
     ELSE:
         Return HTTP 409 Conflict
     ```"""
        }
    ]
}

CHAPTER_10 = {
    "title": "Chapter 10 — Security and Reliability Design",
    "sections": [
        {
            "id": "10.1",
            "title": "Existing Security Implementations",
            "content": """An audit of the codebase confirms the following implemented security controls:
1. Authentication Cryptography: Stateless HMAC-SHA256 JWT tokens with 7-day expiration. Server startup enforces presence of `JWT_SECRET` in production (`server/utils/auth.js` line 8). Passwords hashed using bcrypt with salt cost factor 10 (`server/utils/auth.js` line 16).
2. Data Sanitization: Sensitive attributes (`passwordHash`) are scrubbed before returning responses via `sanitizeUser()`. Public driver listings (`/api/geo/drivers`) filter private telephone numbers.
3. Resource Ownership and Access Control (RBAC):
   - Enforced across REST endpoints: only the ride creator can accept bids or cancel; only assigned drivers can submit telemetry or complete rides.
   - Enforced across WebSocket subscriptions: sockets attempting to subscribe to private rides are verified; eavesdropping by bystander riders is rejected with error frames.
4. HTTP Security Headers: Custom middleware (`server/middleware/security.js`) injects:
   - `Content-Security-Policy`: Restricts script, style, image, connect, and frame sources.
   - `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
   - `X-Frame-Options: DENY`: Prevents clickjacking attacks.
   - `Strict-Transport-Security (HSTS)`: Enforces TLS when accessed over HTTPS.
5. Rate Limiting: Token-bucket in-memory rate limiting restricts API abuse (300 req/min general, 30 req/15 min auth, 10 req/10 min contact).
6. Payload Bounds: JSON request body size capped at 256 KB; URL-encoded bodies capped at 64 KB; WebSocket frame payloads capped at 64 KB.
7. Centralized Error Sanitization: Unhandled errors suppress stack traces in production, returning generic error messages to prevent information disclosure."""
        },
        {
            "id": "10.2",
            "title": "Recommended Production Hardening",
            "content": """To advance the system from a verified semester prototype to enterprise production scale, the following production hardening measures are specified:
1. Secrets Management: Migrate from environment variables to centralized key-management vaults (e.g., AWS Secrets Manager or HashiCorp Vault) with automated 90-day secret rotation.
2. Short-Lived Tokens and Refresh Token Rotation: Replace 7-day access tokens with 15-minute access tokens coupled with cryptographically signed, single-use refresh tokens stored in HTTP-only, Secure, SameSite cookies.
3. Distributed Rate Limiting: Replace in-memory rate limiting with Redis-backed distributed token-bucket limiters (e.g., Envoy rate-limit service) shared across all horizontal gateway instances.
4. Database Connection Pooling and Read Replicas: Implement PgBouncer connection pooling and split read/write traffic across PostgreSQL read replicas.
5. Formal Redlock Distributed Locking: Deploy multi-node Redis clusters running the Redlock consensus algorithm for distributed mutex locking across microservice boundaries.
6. Web Application Firewall (WAF): Place Cloudflare WAF or AWS WAF at the ingress boundary to mitigate Layer 7 DDoS, SQL injection, and credential-stuffing attacks."""
        }
    ]
}
