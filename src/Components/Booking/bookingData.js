export const CITIES = [
  {
    id: "blr",
    name: "Bengaluru",
    coords: [12.9716, 77.5946],
    locations: [
      { name: "Indiranagar 100ft Road", address: "Indiranagar, Bengaluru", coords: [12.9784, 77.6408], type: "popular" },
      { name: "Koramangala 5th Block", address: "Koramangala, Bengaluru", coords: [12.9352, 77.6245], type: "popular" },
      { name: "MG Road Metro Station", address: "Mahatma Gandhi Rd, Bengaluru", coords: [12.9756, 77.6066], type: "transit" },
      { name: "HSR Layout Sector 1", address: "HSR Layout, Bengaluru", coords: [12.9121, 77.6446], type: "popular" },
      { name: "Whitefield ITPL", address: "Whitefield, Bengaluru", coords: [12.9855, 77.7317], type: "office" },
      { name: "Kempegowda Int. Airport (BLR)", address: "Devanahalli, Bengaluru", coords: [13.1986, 77.7066], type: "airport" },
      { name: "Majestic Railway Station", address: "Kempegowda, Bengaluru", coords: [12.9778, 77.5713], type: "transit" },
      { name: "Electronic City Phase 1", address: "Hosur Rd, Bengaluru", coords: [12.8452, 77.6602], type: "office" },
      { name: "Phoenix Marketcity Mall", address: "Whitefield Main Rd, Mahadevapura", coords: [12.9959, 77.6964], type: "mall" }
    ]
  },
  {
    id: "del",
    name: "Delhi NCR",
    coords: [28.6139, 77.2090],
    locations: [
      { name: "Connaught Place Inner Circle", address: "CP, Central Delhi", coords: [28.6315, 77.2167], type: "popular" },
      { name: "Cyber Hub Gurgaon", address: "DLF Cyber City, Gurugram", coords: [28.4952, 77.0895], type: "office" },
      { name: "Hauz Khas Village", address: "Hauz Khas, South Delhi", coords: [28.5494, 77.1931], type: "popular" },
      { name: "IGI Airport Terminal 3", address: "Indira Gandhi Int. Airport, New Delhi", coords: [28.5562, 77.1000], type: "airport" },
      { name: "Noida Sector 18 Metro", address: "Atta Market, Noida", coords: [28.5708, 77.3260], type: "transit" },
      { name: "New Delhi Railway Station", address: "Paharganj, New Delhi", coords: [28.6430, 77.2197], type: "transit" },
      { name: "Select Citywalk Mall", address: "Saket District Centre, New Delhi", coords: [28.5284, 77.2194], type: "mall" }
    ]
  },
  {
    id: "mum",
    name: "Mumbai",
    coords: [19.0760, 72.8777],
    locations: [
      { name: "Bandra Kurla Complex (BKC)", address: "Bandra East, Mumbai", coords: [19.0664, 72.8687], type: "office" },
      { name: "Marine Drive Promenade", address: "Nariman Point, Mumbai", coords: [18.9432, 72.8230], type: "popular" },
      { name: "Andheri West Station", address: "Andheri, Mumbai", coords: [19.1197, 72.8464], type: "transit" },
      { name: "Chhatrapati Shivaji Maharaj T2", address: "Sahar, Andheri East, Mumbai", coords: [19.0990, 72.8745], type: "airport" },
      { name: "Powai Hiranandani", address: "Powai, Mumbai", coords: [19.1197, 72.9056], type: "popular" },
      { name: "Dadar Western Railway Station", address: "Dadar, Mumbai", coords: [19.0178, 72.8478], type: "transit" }
    ]
  },
  {
    id: "hyd",
    name: "Hyderabad",
    coords: [17.3850, 78.4867],
    locations: [
      { name: "Hitec City Cyber Towers", address: "Madhapur, Hyderabad", coords: [17.4504, 78.3808], type: "office" },
      { name: "Jubilee Hills Check Post", address: "Road No 36, Hyderabad", coords: [17.4326, 78.4071], type: "popular" },
      { name: "Gachibowli Stadium", address: "Gachibowli, Hyderabad", coords: [17.4474, 78.3489], type: "popular" },
      { name: "Charminar Monument", address: "Old City, Hyderabad", coords: [17.3616, 78.4747], type: "popular" },
      { name: "Rajiv Gandhi Int. Airport", address: "Shamshabad, Hyderabad", coords: [17.2403, 78.4294], type: "airport" },
      { name: "Secunderabad Railway Station", address: "Secunderabad, Hyderabad", coords: [17.4344, 78.5017], type: "transit" }
    ]
  }
];

export const VEHICLE_TYPES = [
  {
    id: "bike",
    title: "Bike Taxi",
    subtitle: "Beat traffic, fastest solo commute",
    tag: "Fastest & Economical",
    icon: "🛵",
    capacity: "1 Person",
    timeEta: "2 mins away",
    baseFare: 25,
    perKm: 9,
    baseKm: 1.5,
    helmetProvided: true,
    surge: 1.0,
    features: ["Helmet provided", "Doorstep pickup", "Zip through traffic"]
  },
  {
    id: "auto",
    title: "Rapido Auto",
    subtitle: "Comfortable 3-wheeler, metered/fixed pricing",
    tag: "Pocket Friendly",
    icon: "🛺",
    capacity: "3 Persons",
    timeEta: "3 mins away",
    baseFare: 35,
    perKm: 14,
    baseKm: 1.5,
    helmetProvided: false,
    surge: 1.0,
    features: ["Up to 3 passengers", "Spacious luggage room", "Direct pickup"]
  },
  {
    id: "cab_economy",
    title: "Cab Economy",
    subtitle: "Air-conditioned compact sedan/hatchback",
    tag: "Comfortable",
    icon: "🚗",
    capacity: "4 Persons",
    timeEta: "5 mins away",
    baseFare: 70,
    perKm: 18,
    baseKm: 2.0,
    helmetProvided: false,
    surge: 1.0,
    features: ["Air conditioned", "Top rated drivers", "Quiet & peaceful ride"]
  },
  {
    id: "parcel",
    title: "Rapido Parcel",
    subtitle: "Instant door-to-door package delivery",
    tag: "Express Delivery",
    icon: "📦",
    capacity: "Up to 5 kg",
    timeEta: "Pickup in 4 mins",
    baseFare: 30,
    perKm: 11,
    baseKm: 1.5,
    helmetProvided: false,
    surge: 1.0,
    features: ["Instant pickup", "OTP verification at delivery", "Real-time tracking"]
  }
];

export const AVAILABLE_COUPONS = [
  {
    code: "RAPIDO50",
    discountPercent: 50,
    maxDiscount: 50,
    minFare: 40,
    desc: "50% off up to ₹50 on any ride"
  },
  {
    code: "FIRSTFREE",
    flatDiscount: 40,
    minFare: 40,
    desc: "Flat ₹40 OFF on your first booking"
  },
  {
    code: "SAVEMORE",
    discountPercent: 20,
    maxDiscount: 70,
    minFare: 80,
    desc: "20% off up to ₹70 on rides above ₹80"
  },
  {
    code: "AUTORAPID",
    discountPercent: 30,
    maxDiscount: 40,
    minFare: 50,
    applicableVehicles: ["auto"],
    desc: "30% off up to ₹40 exclusively on Auto rides"
  }
];

export const MOCK_CAPTAINS = [
  {
    id: "cap-1",
    name: "Ramesh Kumar",
    rating: 4.89,
    trips: 3420,
    bikeModel: "Honda Activa 6G (Grey)",
    plateNumber: "KA 05 MN 4821",
    phone: "+91 98765 43210",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    badge: "Super Captain",
    language: "English, Hindi, Kannada",
    etaMins: 2,
    distanceKm: 0.6
  },
  {
    id: "cap-2",
    name: "Vikramjit Singh",
    rating: 4.94,
    trips: 5120,
    bikeModel: "Bajaj Pulsar 150 (Black)",
    plateNumber: "DL 03 XY 7291",
    phone: "+91 98112 34567",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    badge: "5-Star Champion",
    language: "Hindi, Punjabi, English",
    etaMins: 3,
    distanceKm: 0.9
  },
  {
    id: "cap-3",
    name: "Anand Murthy",
    rating: 4.82,
    trips: 2180,
    bikeModel: "TVS Jupiter 125 (Blue)",
    plateNumber: "KA 01 EK 9102",
    phone: "+91 94481 99201",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    badge: "Safety Hero",
    language: "Kannada, Telugu, Hindi",
    etaMins: 4,
    distanceKm: 1.2
  },
  {
    id: "cap-4",
    name: "Deepak Sharma",
    rating: 4.85,
    trips: 1890,
    bikeModel: "Hero Splendor+ (Silver)",
    plateNumber: "MH 02 BQ 5612",
    phone: "+91 99203 11445",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    badge: "Prompt Rider",
    language: "Hindi, Marathi, English",
    etaMins: 3,
    distanceKm: 0.8
  }
];

export const INITIAL_PAST_RIDES = [
  {
    id: "RAP-84920",
    date: "Yesterday, 6:30 PM",
    service: "Bike Taxi",
    icon: "🛵",
    pickup: "Indiranagar 100ft Road",
    drop: "Koramangala 5th Block",
    distance: "6.2 km",
    duration: "18 mins",
    fare: 68,
    status: "Completed",
    captain: "Ramesh Kumar",
    rating: 5,
    paidBy: "Rapido Wallet"
  },
  {
    id: "RAP-83109",
    date: "25 Oct 2026, 9:15 AM",
    service: "Rapido Auto",
    icon: "🛺",
    pickup: "HSR Layout Sector 1",
    drop: "MG Road Metro Station",
    distance: "9.5 km",
    duration: "31 mins",
    fare: 145,
    status: "Completed",
    captain: "Suresh Gowda",
    rating: 5,
    paidBy: "UPI (Google Pay)"
  },
  {
    id: "RAP-81045",
    date: "21 Oct 2026, 2:40 PM",
    service: "Rapido Parcel",
    icon: "📦",
    pickup: "Koramangala 5th Block",
    drop: "Whitefield ITPL",
    distance: "14.8 km",
    duration: "45 mins",
    fare: 182,
    status: "Delivered",
    captain: "Deepak Sharma",
    rating: 4,
    paidBy: "Cash"
  }
];

// Intercity Carpooling Rides
export const INITIAL_CARPOOLS = [
  {
    id: "CP-101",
    fromCity: "Bengaluru",
    fromPoint: "Silk Board Junction / Electronic City",
    toCity: "Mysuru",
    toPoint: "Suburban Bus Stand, Mysuru",
    departureTime: "Today, 05:30 PM",
    driverName: "Siddharth Rao",
    driverRating: 4.92,
    driverAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    driverTrips: 142,
    carModel: "Honda City (White) - KA 04 MD 8821",
    totalSeats: 3,
    availableSeats: 2,
    pricePerSeat: 340,
    features: ["AC Available", "Max 2 in back", "Instant Booking", "Luggage Allowed"],
    notes: "Leaving strictly by 5:30 PM. Music & friendly talks welcome!"
  },
  {
    id: "CP-102",
    fromCity: "Mumbai",
    fromPoint: "Vashi Plaza / Navi Mumbai",
    toCity: "Pune",
    toPoint: "Wakad Bridge / Shivaji Nagar",
    departureTime: "Today, 06:15 PM",
    driverName: "Tanvi Deshmukh",
    driverRating: 4.88,
    driverAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    driverTrips: 98,
    carModel: "Hyundai Creta (Grey) - MH 01 CZ 4409",
    totalSeats: 4,
    availableSeats: 1,
    pricePerSeat: 420,
    features: ["AC Available", "Women Preferred", "No Smoking", "Fast Express Highway"],
    notes: "Non-stop via Mumbai-Pune Expressway. Drop at Wakad."
  },
  {
    id: "CP-103",
    fromCity: "Delhi NCR",
    fromPoint: "Kashmere Gate Metro / Akshardham",
    toCity: "Agra",
    toPoint: "Taj Nagari / Fatehabad Road",
    departureTime: "Tomorrow, 07:00 AM",
    driverName: "Rohit Bansal",
    driverRating: 4.95,
    driverAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    driverTrips: 210,
    carModel: "Maruti Ertiga Hybrid (Silver) - DL 10 AC 9912",
    totalSeats: 5,
    availableSeats: 3,
    pricePerSeat: 450,
    features: ["AC Available", "Large Trunk Space", "Yamuna Expressway", "Fastag Enabled"],
    notes: "Early morning pleasant drive via Yamuna Expressway. Stop at food plaza for tea."
  },
  {
    id: "CP-104",
    fromCity: "Hyderabad",
    fromPoint: "Gachibowli ORR / LB Nagar",
    toCity: "Vijayawada",
    toPoint: "Benz Circle, Vijayawada",
    departureTime: "Tomorrow, 08:30 AM",
    driverName: "Karthik Reddy",
    driverRating: 4.86,
    driverAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    driverTrips: 84,
    carModel: "Kia Seltos (Black) - TS 07 UA 1902",
    totalSeats: 3,
    availableSeats: 2,
    pricePerSeat: 550,
    features: ["AC Available", "Max 2 in back", "Pet Friendly", "Instant Confirmation"],
    notes: "Smooth drive on NH65. Can pick up along Outer Ring Road."
  }
];
