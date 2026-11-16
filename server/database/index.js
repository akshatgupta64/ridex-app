const connection = require("./connection");
const User = require("./models/User");
const Driver = require("./models/Driver");
const Ride = require("./models/Ride");
const Bid = require("./models/Bid");
const Carpool = require("./models/Carpool");
const Wallet = require("./models/Wallet");
const Contact = require("./models/Contact");

const SEED_USERS = [
  {
    id: "usr-01",
    name: "Rahul Verma",
    phone: "+91 98765 00001",
    email: "rider@ridex.com",
    aliases: ["rahul.verma@example.com"],
    role: "rider",
    passwordHash: "$2b$10$aPsH/.EIWzW7LZNrxDnR6uwRDy26RkCjN/maz7WV0z/5fqCiTW5aq",
    initialBalance: 450.0
  },
  {
    id: "drv-01",
    name: "Ramesh Kumar",
    phone: "+91 98765 43210",
    email: "driver@ridex.com",
    aliases: ["ramesh.kumar@example.com"],
    role: "driver",
    driverProfileId: "drv-01",
    passwordHash: "$2b$10$yV6geggkek3Gv0AIlXfcdeExTSmPjZaLvI3yXta/a8pDjyfNNYjhi",
    initialBalance: 1240.0
  },
  {
    id: "drv-02",
    name: "Vikramjit Singh",
    phone: "+91 98112 34567",
    email: "vikram@ridex.com",
    aliases: [],
    role: "driver",
    driverProfileId: "drv-02",
    passwordHash: "$2b$10$yV6geggkek3Gv0AIlXfcdeExTSmPjZaLvI3yXta/a8pDjyfNNYjhi",
    initialBalance: 2150.0
  },
  {
    id: "drv-03",
    name: "Anand Murthy",
    phone: "+91 94481 99201",
    email: "anand@ridex.com",
    aliases: [],
    role: "driver",
    driverProfileId: "drv-03",
    passwordHash: "$2b$10$yV6geggkek3Gv0AIlXfcdeExTSmPjZaLvI3yXta/a8pDjyfNNYjhi",
    initialBalance: 890.0
  },
  {
    id: "drv-04",
    name: "Deepak Sharma",
    phone: "+91 99203 11445",
    email: "deepak@ridex.com",
    aliases: [],
    role: "driver",
    driverProfileId: "drv-04",
    passwordHash: "$2b$10$yV6geggkek3Gv0AIlXfcdeExTSmPjZaLvI3yXta/a8pDjyfNNYjhi",
    initialBalance: 3410.0
  },
  {
    id: "adm-01",
    name: "Platform Ops Admin",
    phone: "+91 98765 99999",
    email: "admin@ridex.com",
    aliases: [],
    role: "admin",
    passwordHash: "$2b$10$85LAI/KplQdRQ9YWXEwtOOJuDWo2SZ/TMybVRCB0ln4CgKaWsP/La",
    initialBalance: 10000.0
  }
];

const SEED_DRIVERS = [
  {
    id: "drv-01",
    userId: "drv-01",
    name: "Ramesh Kumar",
    phone: "+91 98765 43210",
    rating: 4.89,
    trips: 3420,
    vehicleType: "bike",
    model: "Honda Activa 6G (Grey)",
    plateNumber: "KA 05 MN 4821",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    latitude: 12.9814,
    longitude: 77.6428,
    status: "ONLINE",
    walletEarnings: 1240.0
  },
  {
    id: "drv-02",
    userId: null,
    name: "Vikramjit Singh",
    phone: "+91 98112 34567",
    rating: 4.94,
    trips: 5120,
    vehicleType: "bike",
    model: "Bajaj Pulsar 150 (Black)",
    plateNumber: "DL 03 XY 7291",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    latitude: 12.9764,
    longitude: 77.6448,
    status: "ONLINE",
    walletEarnings: 2150.0
  },
  {
    id: "drv-03",
    userId: null,
    name: "Anand Murthy",
    phone: "+91 94481 99201",
    rating: 4.82,
    trips: 2180,
    vehicleType: "auto",
    model: "Bajaj RE Auto (Yellow/Green)",
    plateNumber: "KA 01 EK 9102",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    latitude: 12.9824,
    longitude: 77.6378,
    status: "ONLINE",
    walletEarnings: 890.0
  },
  {
    id: "drv-04",
    userId: null,
    name: "Deepak Sharma",
    phone: "+91 99203 11445",
    rating: 4.85,
    trips: 1890,
    vehicleType: "cab_economy",
    model: "Maruti Dzire Tour (White)",
    plateNumber: "MH 02 BQ 5612",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    latitude: 12.9744,
    longitude: 77.6388,
    status: "ONLINE",
    walletEarnings: 3410.0
  }
];

const SEED_CARPOOLS = [
  {
    id: "CP-101",
    driverId: "drv-01",
    driverName: "Siddharth Rao",
    driverPhone: "+91 98450 11223",
    driverRating: 4.92,
    driverAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    fromCity: "Bengaluru",
    fromPoint: "Silk Board Junction / Electronic City Toll",
    toCity: "Mysuru",
    toPoint: "Suburban Bus Stand, Mysuru",
    departureTime: "Today, 05:30 PM",
    carModel: "Honda City (White) - KA 04 MD 8821",
    totalSeats: 3,
    availableSeats: 2,
    pricePerSeat: 340,
    features: ["AC Available", "Max 2 in back", "Instant Booking", "Luggage Allowed"],
    notes: "Leaving strictly by 5:30 PM. Music & friendly talks welcome!"
  },
  {
    id: "CP-102",
    driverId: "drv-02",
    driverName: "Tanvi Deshmukh",
    driverPhone: "+91 98220 33445",
    driverRating: 4.88,
    driverAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    fromCity: "Mumbai",
    fromPoint: "Vashi Plaza / Navi Mumbai",
    toCity: "Pune",
    toPoint: "Wakad Bridge / Shivaji Nagar",
    departureTime: "Today, 06:15 PM",
    carModel: "Hyundai Creta (Grey) - MH 01 CZ 4409",
    totalSeats: 4,
    availableSeats: 1,
    pricePerSeat: 420,
    features: ["AC Available", "Women Preferred", "No Smoking", "Fast Express Highway"],
    notes: "Non-stop via Mumbai-Pune Expressway. Drop at Wakad."
  },
  {
    id: "CP-103",
    driverId: "drv-03",
    driverName: "Rohit Bansal",
    driverPhone: "+91 98110 55667",
    driverRating: 4.95,
    driverAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    fromCity: "Delhi NCR",
    fromPoint: "Kashmere Gate Metro / Akshardham",
    toCity: "Agra",
    toPoint: "Taj Nagari / Fatehabad Road",
    departureTime: "Tomorrow, 07:00 AM",
    carModel: "Maruti Ertiga Hybrid (Silver) - DL 10 AC 9912",
    totalSeats: 5,
    availableSeats: 3,
    pricePerSeat: 450,
    features: ["AC Available", "Large Trunk Space", "Yamuna Expressway", "Fastag Enabled"],
    notes: "Early morning pleasant drive via Yamuna Expressway. Stop at food plaza for tea."
  }
];

async function initDatabase() {
  await connection.initSchema();

  const isDemo = process.env.NODE_ENV !== "production" && process.env.SEED_DEMO_USERS !== "false";
  if (!isDemo) return;

  // Seed demo users if empty
  for (const seed of SEED_USERS) {
    const existing = await User.findById(seed.id);
    if (!existing) {
      await User.create(seed);
      await Wallet.create(seed.id, seed.initialBalance);
      await Wallet.credit(
        seed.id,
        seed.initialBalance,
        "Welcome Promo Balance",
        `init-key-${seed.id}`
      );
    }
  }

  // Seed demo drivers if empty
  for (const driver of SEED_DRIVERS) {
    const existing = await Driver.findById(driver.id);
    if (!existing) {
      await Driver.create(driver);
    }
  }

  // Seed demo carpools if empty
  for (const carpool of SEED_CARPOOLS) {
    const existing = await Carpool.findById(carpool.id);
    if (!existing) {
      await Carpool.create(carpool);
    }
  }
}

async function getDatabaseStats() {
  const users = await connection.get("SELECT COUNT(*) as count FROM users");
  const drivers = await connection.get("SELECT COUNT(*) as count FROM drivers");
  const rides = await connection.get("SELECT COUNT(*) as count FROM rides");
  const bids = await connection.get("SELECT COUNT(*) as count FROM ride_bids");
  const carpools = await connection.get("SELECT COUNT(*) as count FROM carpools");
  const wallets = await connection.get("SELECT COUNT(*) as count FROM wallets");
  const ledger = await connection.get("SELECT COUNT(*) as count FROM wallet_ledger");

  return {
    engine: connection.DB_ENGINE,
    sqlitePath: connection.DB_ENGINE === "sqlite" ? connection.getSqliteFilePath() : null,
    tables: {
      users: Number(users?.count || 0),
      drivers: Number(drivers?.count || 0),
      rides: Number(rides?.count || 0),
      ride_bids: Number(bids?.count || 0),
      carpools: Number(carpools?.count || 0),
      wallets: Number(wallets?.count || 0),
      wallet_ledger: Number(ledger?.count || 0)
    }
  };
}

module.exports = {
  connection,
  models: {
    User,
    Driver,
    Ride,
    Bid,
    Carpool,
    Wallet,
    Contact
  },
  initDatabase,
  getDatabaseStats
};
