-- RideX Multi-Modal Mobility & Dynamic Bidding Platform
-- Relational Database Schema Design (SQLite & PostgreSQL Compatible DDL)
-- Reference: SYSTEM_DESIGN.md Section 6

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'rider', -- 'rider', 'driver', 'admin'
    password_hash VARCHAR(255) NOT NULL,
    driver_profile_id VARCHAR(64),
    aliases TEXT,                              -- JSON array of aliases
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Drivers Profile & Telemetry
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    rating REAL DEFAULT 4.9,
    trips INTEGER DEFAULT 0,
    vehicle_type VARCHAR(30) NOT NULL,         -- 'bike', 'auto', 'cab_economy', 'parcel'
    model VARCHAR(100) NOT NULL,
    plate_number VARCHAR(30) NOT NULL,
    avatar TEXT,
    latitude REAL NOT NULL DEFAULT 12.9784,
    longitude REAL NOT NULL DEFAULT 77.6408,
    status VARCHAR(20) DEFAULT 'ONLINE',       -- 'ONLINE', 'OFFLINE', 'ON_TRIP'
    wallet_earnings REAL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle ON drivers(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_drivers_coords ON drivers(latitude, longitude);

-- 3. Digital Wallets
CREATE TABLE IF NOT EXISTS wallets (
    user_id VARCHAR(64) PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 0.0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Double-Entry Financial Ledger
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id VARCHAR(64) PRIMARY KEY,
    wallet_id VARCHAR(64) NOT NULL,
    ride_id VARCHAR(64),
    type VARCHAR(20) NOT NULL,                 -- 'CREDIT', 'DEBIT', 'REFUND'
    amount REAL NOT NULL,
    description TEXT,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet_id ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON wallet_ledger(idempotency_key);

-- 5. Intra-City Ride Requests & Trips
CREATE TABLE IF NOT EXISTS rides (
    id VARCHAR(64) PRIMARY KEY,                -- e.g. 'RAP-58219'
    rider_id VARCHAR(64) NOT NULL,
    rider_name VARCHAR(120),
    rider_phone VARCHAR(30),
    driver_id VARCHAR(64),
    driver_name VARCHAR(120),
    driver_vehicle VARCHAR(120),
    service VARCHAR(60) NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    pickup_address TEXT NOT NULL,
    drop_address TEXT NOT NULL,
    pickup_lat REAL NOT NULL,
    pickup_lon REAL NOT NULL,
    drop_lat REAL NOT NULL,
    drop_lon REAL NOT NULL,
    distance_km REAL NOT NULL,
    duration_mins INTEGER NOT NULL,
    waypoints TEXT,                            -- JSON array of [lat, lon]
    recommended_fare REAL NOT NULL,
    initial_offer_fare REAL NOT NULL,
    agreed_fare REAL NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BIDDING', -- 'BIDDING', 'ASSIGNED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    payment_method VARCHAR(30) NOT NULL DEFAULT 'wallet',
    ride_otp VARCHAR(10) NOT NULL,
    parcel_details TEXT,                       -- JSON object for parcel delivery
    rating INTEGER,
    feedback_tags TEXT,                        -- JSON array of tags
    tip_amount REAL DEFAULT 0.0,
    cancellation_reason TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rides_rider ON rides(rider_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);

-- 6. inDrive Dynamic Bids & Counter-Offers
CREATE TABLE IF NOT EXISTS ride_bids (
    bid_id VARCHAR(64) PRIMARY KEY,
    ride_id VARCHAR(64) NOT NULL,
    driver_id VARCHAR(64) NOT NULL,
    driver_name VARCHAR(120) NOT NULL,
    driver_rating REAL,
    driver_trips INTEGER,
    driver_vehicle VARCHAR(100),
    driver_plate VARCHAR(30),
    driver_avatar TEXT,
    driver_price REAL NOT NULL,
    eta_mins INTEGER,
    distance_km REAL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED', 'REJECTED'
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bids_ride_id ON ride_bids(ride_id);
CREATE INDEX IF NOT EXISTS idx_bids_driver_id ON ride_bids(driver_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON ride_bids(status);

-- 7. Intercity Carpooling
CREATE TABLE IF NOT EXISTS carpools (
    id VARCHAR(64) PRIMARY KEY,
    driver_id VARCHAR(64) NOT NULL,
    driver_name VARCHAR(120) NOT NULL,
    driver_phone VARCHAR(30),
    driver_rating REAL,
    driver_avatar TEXT,
    from_city VARCHAR(100) NOT NULL,
    from_point TEXT NOT NULL,
    to_city VARCHAR(100) NOT NULL,
    to_point TEXT NOT NULL,
    departure_time VARCHAR(100) NOT NULL,
    car_model VARCHAR(100) NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price_per_seat REAL NOT NULL,
    features TEXT,                             -- JSON array of strings
    notes TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',       -- 'ACTIVE', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carpools_cities ON carpools(from_city, to_city);
CREATE INDEX IF NOT EXISTS idx_carpools_status ON carpools(status);

-- 8. Carpool Bookings
CREATE TABLE IF NOT EXISTS carpool_bookings (
    id VARCHAR(64) PRIMARY KEY,
    carpool_id VARCHAR(64) NOT NULL,
    rider_id VARCHAR(64) NOT NULL,
    rider_name VARCHAR(120) NOT NULL,
    rider_phone VARCHAR(30),
    seats INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carpool_bookings_carpool ON carpool_bookings(carpool_id);
CREATE INDEX IF NOT EXISTS idx_carpool_bookings_rider ON carpool_bookings(rider_id);

-- 9. Contact & Support Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
