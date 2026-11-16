const fs = require("fs");
const path = require("path");
const { connection, models, initDatabase, getDatabaseStats } = require("./database");
const { syncSnapshotToSqlite } = require("./database/sync");

const DB_FILE = process.env.RIDEX_DB_FILE
  ? path.resolve(process.env.RIDEX_DB_FILE)
  : path.join(__dirname, "data", "mobility_store.json");
const DATA_DIR = path.dirname(DB_FILE);

const DEMO_MODE =
  process.env.NODE_ENV !== "production" && process.env.SEED_DEMO_USERS !== "false";

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default pre-computed bcrypt hashes (cost 10):
// 'Rider@123'  -> $2b$10$aPsH/.EIWzW7LZNrxDnR6uwRDy26RkCjN/maz7WV0z/5fqCiTW5aq
// 'Driver@123' -> $2b$10$yV6geggkek3Gv0AIlXfcdeExTSmPjZaLvI3yXta/a8pDjyfNNYjhi
// 'Admin@123'  -> $2b$10$85LAI/KplQdRQ9YWXEwtOOJuDWo2SZ/TMybVRCB0ln4CgKaWsP/La
const SEED_USERS = [
  {
    id: "usr-01",
    name: "Rahul Verma",
    phone: "+91 98765 00001",
    email: "rider@ridex.com",
    aliases: ["rahul.verma@example.com"],
    role: "rider",
    passwordHash: "$2b$10$aPsH/.EIWzW7LZNrxDnR6uwRDy26RkCjN/maz7WV0z/5fqCiTW5aq",
    createdAt: new Date().toISOString()
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
    createdAt: new Date().toISOString()
  },
  {
    id: "adm-01",
    name: "Platform Ops Admin",
    phone: "+91 98765 99999",
    email: "admin@ridex.com",
    aliases: [],
    role: "admin",
    passwordHash: "$2b$10$85LAI/KplQdRQ9YWXEwtOOJuDWo2SZ/TMybVRCB0ln4CgKaWsP/La",
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DATA = {
  users: SEED_USERS,
  wallets: {
    "usr-01": {
      userId: "usr-01",
      balance: 450.0,
      currency: "INR",
      updatedAt: new Date().toISOString()
    },
    "drv-01": {
      userId: "drv-01",
      balance: 1240.0,
      currency: "INR",
      updatedAt: new Date().toISOString()
    },
    "adm-01": {
      userId: "adm-01",
      balance: 10000.0,
      currency: "INR",
      updatedAt: new Date().toISOString()
    }
  },
  wallet: {
    userId: "usr-01",
    balance: 450.0,
    currency: "INR",
    updatedAt: new Date().toISOString()
  },
  walletLedger: [
    {
      id: "tx-init-01",
      walletId: "usr-01",
      rideId: null,
      type: "CREDIT",
      amount: 450.0,
      description: "Welcome Promo Balance",
      idempotencyKey: "init-key-01",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  drivers: [
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
      location: [12.9784 + 0.003, 77.6408 + 0.002],
      status: "ONLINE",
      walletEarnings: 1240.0
    },
    {
      id: "drv-02",
      name: "Vikramjit Singh",
      phone: "+91 98112 34567",
      rating: 4.94,
      trips: 5120,
      vehicleType: "bike",
      model: "Bajaj Pulsar 150 (Black)",
      plateNumber: "DL 03 XY 7291",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      location: [12.9784 - 0.002, 77.6408 + 0.004],
      status: "ONLINE",
      walletEarnings: 2150.0
    },
    {
      id: "drv-03",
      name: "Anand Murthy",
      phone: "+91 94481 99201",
      rating: 4.82,
      trips: 2180,
      vehicleType: "auto",
      model: "Bajaj RE Auto (Yellow/Green)",
      plateNumber: "KA 01 EK 9102",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      location: [12.9784 + 0.004, 77.6408 - 0.003],
      status: "ONLINE",
      walletEarnings: 890.0
    },
    {
      id: "drv-04",
      name: "Deepak Sharma",
      phone: "+91 99203 11445",
      rating: 4.85,
      trips: 1890,
      vehicleType: "cab_economy",
      model: "Maruti Dzire Tour (White)",
      plateNumber: "MH 02 BQ 5612",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      location: [12.9784 - 0.004, 77.6408 - 0.002],
      status: "ONLINE",
      walletEarnings: 3410.0
    }
  ],
  rides: [
    {
      id: "RAP-84920",
      riderId: "usr-01",
      driverId: "drv-01",
      service: "Bike Taxi",
      vehicleType: "bike",
      pickupAddress: "Indiranagar 100ft Road",
      dropAddress: "Koramangala 5th Block",
      pickupCoords: [12.9784, 77.6408],
      dropCoords: [12.9352, 77.6245],
      distanceKm: 6.2,
      durationMins: 18,
      fare: 68.0,
      status: "COMPLETED",
      paymentMethod: "WALLET",
      rideOtp: "4821",
      driverName: "Ramesh Kumar",
      driverVehicle: "Honda Activa 6G (KA 05 MN 4821)",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 85200000).toISOString()
    }
  ],
  bids: [],
  carpools: [
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
      notes: "Leaving strictly by 5:30 PM. Music & friendly talks welcome!",
      createdAt: new Date().toISOString()
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
      notes: "Non-stop via Mumbai-Pune Expressway. Drop at Wakad.",
      createdAt: new Date().toISOString()
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
      notes: "Early morning pleasant drive via Yamuna Expressway. Stop at food plaza for tea.",
      createdAt: new Date().toISOString()
    }
  ],
  carpoolBookings: []
};

// Never ship demo accounts or synthetic marketplace content to production.
if (!DEMO_MODE) {
  INITIAL_DATA.users = [];
  INITIAL_DATA.wallets = {};
  INITIAL_DATA.wallet = null;
  INITIAL_DATA.walletLedger = [];
  INITIAL_DATA.drivers = [];
  INITIAL_DATA.rides = [];
  INITIAL_DATA.bids = [];
  INITIAL_DATA.carpools = [];
}

class Database {
  constructor() {
    this.init();
  }

  init() {
    try {
      initDatabase().catch((err) => {
        // Schema initialization logged
      });
    } catch (e) {}

    if (!fs.existsSync(DB_FILE)) {
      this.write(INITIAL_DATA);
    } else {
      // Ensure seed users and schema compatibility without overwriting user data
      this.migrateSchema();
      try {
        const currentData = this.read();
        syncSnapshotToSqlite(currentData);
      } catch (err) {}
    }
  }

  migrateSchema() {
    try {
      const data = this.read();
      let modified = false;

      if (!Array.isArray(data.users)) {
        data.users = [];
        modified = true;
      }
      if (!Array.isArray(data.walletLedger)) {
        data.walletLedger = [];
        modified = true;
      }
      if (!Array.isArray(data.drivers)) {
        data.drivers = [];
        modified = true;
      }
      if (!Array.isArray(data.rides)) {
        data.rides = [];
        modified = true;
      }
      if (!Array.isArray(data.bids)) {
        data.bids = [];
        modified = true;
      }
      if (!Array.isArray(data.carpools)) {
        data.carpools = [];
        modified = true;
      }
      if (!Array.isArray(data.carpoolBookings)) {
        data.carpoolBookings = [];
        modified = true;
      }
      if (!Array.isArray(data.contactMessages)) {
        data.contactMessages = [];
        modified = true;
      }

      if (!data.wallets) {
        data.wallets = {};
        modified = true;
      }

      if (DEMO_MODE) {
        if (!data.wallets["usr-01"] && data.wallet) {
          data.wallets["usr-01"] = data.wallet;
          modified = true;
        }

        SEED_USERS.forEach((seedUser) => {
          const existing = data.users.find(
            (u) =>
              u.id === seedUser.id ||
              u.email === seedUser.email ||
              (u.aliases && u.aliases.includes(seedUser.email)) ||
              (seedUser.aliases && seedUser.aliases.includes(u.email))
          );

          if (!existing) {
            data.users.push(seedUser);
            if (!data.wallets[seedUser.id]) {
              data.wallets[seedUser.id] = {
                userId: seedUser.id,
                balance: seedUser.role === "driver" ? 1240.0 : 450.0,
                currency: "INR",
                updatedAt: new Date().toISOString()
              };
            }
            modified = true;
          } else if (!existing.passwordHash) {
            // Ensure seed accounts remain usable during local development only
            existing.passwordHash = seedUser.passwordHash;
            existing.email = seedUser.email;
            existing.role = seedUser.role;
            modified = true;
          }
        });
      }

      if (modified) {
        this.write(data);
      }
    } catch (e) {
      console.error("Migration error:", e);
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error("DB Read Error:", err.message);
      if (err.code === "ENOENT") {
        this.write(INITIAL_DATA);
        return INITIAL_DATA;
      }
      // Preserve the damaged store for forensic recovery instead of silently wiping it.
      const backupFile = `${DB_FILE}.corrupt-${Date.now()}`;
      try {
        fs.copyFileSync(DB_FILE, backupFile);
        console.error(`Corrupt database backed up to ${backupFile}`);
      } catch (backupErr) {
        console.error("Failed to back up corrupt database:", backupErr.message);
      }
      this.write(INITIAL_DATA);
      return INITIAL_DATA;
    }
  }

  write(data) {
    const tempFile = DB_FILE + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);

    // Write-through to relational SQLite database
    try {
      syncSnapshotToSqlite(data);
    } catch (err) {
      // Non-blocking sync error
    }
  }

  // Transactions & atomic mutations
  transaction(fn) {
    const data = this.read();
    const result = fn(data);
    this.write(data);
    return result;
  }

  // Relational Database Extensions & ORM Accessors
  get models() {
    return models;
  }

  get connection() {
    return connection;
  }

  async query(sql, params) {
    return connection.query(sql, params);
  }

  async get(sql, params) {
    return connection.get(sql, params);
  }

  async run(sql, params) {
    return connection.run(sql, params);
  }

  async getDatabaseStats() {
    return getDatabaseStats();
  }
}

const db = new Database();

module.exports = db;
