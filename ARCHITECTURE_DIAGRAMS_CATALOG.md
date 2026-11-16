# RideX Architecture Diagrams Catalog (Editable Formats)

This document contains editable, production-grade architecture and UML diagrams for **RideX — A Smart Ride-Hailing and Intercity Carpooling Platform**.

Diagrams are provided in standard **Mermaid.js** format (supported directly in Markdown renderers, GitHub, and VS Code) and **PlantUML** format. For visual diagramming, refer to the editable XML file `RideX_Architecture_Design.drawio` included in the root directory.

---

## 1. System Context Diagram (C4 Level 1)

### Mermaid
```mermaid
graph TD
    classDef person fill:#0F172A,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF;
    classDef system fill:#EFF6FF,stroke:#2563EB,stroke-width:2px,color:#1E3A8A;
    classDef ext fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,stroke-dasharray: 5 5,color:#334155;

    Rider["👤 Rider / Commuter<br/>(Requests rides, bids fares, reserves carpools)"]:::person
    Driver["👤 Driver Partner<br/>(Streams GPS, counter-bids, fulfills rides)"]:::person
    Admin["👤 Platform Administrator<br/>(Monitors fleet, resolves disputes)"]:::person

    RideX["🏢 RideX Distributed Mobility Platform<br/>(Unified Ride-Hailing, inDrive Bidding, Carpooling, Ledger)"]:::system

    OSM["🗺️ OpenStreetMap & OSRM Engine<br/>(Map tiles, geocoding, road pathing)"]:::ext
    Banking["💳 Banking & SMS Gateway (Target)<br/>(Payment PSPs, SMS OTP dispatch)"]:::ext

    Rider -->|"Requests rides, custom fares, carpool seats (HTTPS/WSS)"| RideX
    Driver -->|"Transmits 3s GPS telemetry, accepts/counter-bids (WSS)"| RideX
    Admin -->|"Reviews audit logs, manages system health (HTTPS)"| RideX
    RideX -->|"Queries road distance and route geometry (HTTP)"| OSM
    RideX -.->|"Processes webhooks and payout settlements (Target)"| Banking
```

---

## 2. High-Level Architecture Diagram (HLD / C4 Level 2)

### Mermaid
```mermaid
graph TD
    classDef client fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,color:#1E3A8A;
    classDef gateway fill:#FEF2F2,stroke:#EF4444,stroke-width:2px,color:#991B1B;
    classDef service fill:#FFFBEB,stroke:#D97706,stroke-width:2px,color:#78350F;
    classDef broker fill:#F3E8FF,stroke:#9333EA,stroke-width:2px,color:#581C87;
    classDef data fill:#F0FDFA,stroke:#0D9488,stroke-width:2px,color:#134E4A;

    subgraph Client_Tier ["Client & Edge Tier"]
        RiderApp["Rider SPA / Mobile<br/>(React 18, Leaflet)"]:::client
        DriverApp["Driver Partner Client<br/>(GPS Streamer, Bids)"]:::client
        AdminApp["Admin Dashboard<br/>(Fleet & Ledger Portal)"]:::client
    end

    subgraph Ingress_Tier ["Ingress & Gateway Tier"]
        ReverseProxy["Envoy / Nginx / Express Gateway<br/>(TLS 1.3, CSP, CORS, Rate Limiting)"]:::gateway
        AuthMiddleware["Stateless JWT Guard & RBAC<br/>(HMAC-SHA256, Ownership Validator)"]:::gateway
    end

    subgraph Compute_Tier ["Application Microservices Tier"]
        BiddingEngine["inDrive Bidding Engine<br/>(Auction coordinator, TTL 25s)"]:::service
        DispatchService["Ride Dispatch & Lifecycle<br/>(Rate cards, 4-digit OTP)"]:::service
        CarpoolService["Carpool Corridor Service<br/>(Corridor buffer, seat locking)"]:::service
        WalletLedger["Wallet & Ledger Service<br/>(Double-entry, idempotency)"]:::service
        RoutingService["Routing & Geo Service<br/>(OSRM engine, Haversine/Bezier)"]:::service
        WSGateway["WebSocket Gateway (/ws)<br/>(Room router, telemetry streamer)"]:::service
    end

    subgraph Storage_Tier ["Persistence & In-Memory Tier"]
        DBStore[("Database Store<br/>[Prototype: Atomic JSON]<br/>[Production: PostgreSQL 16 + PostGIS]")]:::data
        RedisCluster[("In-Memory Cluster (Target)<br/>[Redis 7.2: Spatial GEO, Redlock]")]:::broker
    end

    RiderApp -->|"HTTPS / WSS"| ReverseProxy
    DriverApp -->|"WSS / HTTPS"| ReverseProxy
    AdminApp -->|"HTTPS"| ReverseProxy

    ReverseProxy --> AuthMiddleware
    AuthMiddleware --> BiddingEngine
    AuthMiddleware --> DispatchService
    AuthMiddleware --> CarpoolService
    AuthMiddleware --> WalletLedger
    ReverseProxy --> WSGateway

    DispatchService --> RoutingService
    BiddingEngine <--> WSGateway
    DispatchService <--> WSGateway

    BiddingEngine --> DBStore
    DispatchService --> DBStore
    CarpoolService --> DBStore
    WalletLedger --> DBStore
    BiddingEngine -.-> RedisCluster
```

---

## 3. Component Diagram (LLD / C4 Level 3)

### Mermaid
```mermaid
graph LR
    classDef router fill:#EFF6FF,stroke:#2563EB,stroke-width:1.5px;
    classDef service fill:#FFFBEB,stroke:#D97706,stroke-width:1.5px;
    classDef util fill:#F0FDF4,stroke:#16A34A,stroke-width:1.5px;
    classDef data fill:#FAF5FF,stroke:#9333EA,stroke-width:1.5px;

    subgraph Express_Controllers ["Route Controllers"]
        R_Auth["routes/auth.js"]:::router
        R_Rides["routes/rides.js"]:::router
        R_Carpools["routes/carpools.js"]:::router
        R_Wallet["routes/wallet.js"]:::router
        R_Geo["routes/geo.js"]:::router
        R_Contact["routes/contact.js"]:::router
    end

    subgraph Middleware_Security ["Middleware & Security"]
        M_Auth["middleware/auth.js<br/>(JWT & RBAC)"]:::util
        M_Sec["middleware/security.js<br/>(CSP, RateLimiter)"]:::util
    end

    subgraph Core_Services ["Business Logic & Real-Time"]
        S_WS["services/websocket.js<br/>(Room manager, broadcasts)"]:::service
        S_Route["services/routing.js<br/>(OSRM & Haversine)"]:::service
        U_Auth["utils/auth.js<br/>(bcrypt & jwt)"]:::util
    end

    subgraph Persistence ["Persistence Layer"]
        DB_Class["server/db.js<br/>(Atomic file transaction engine)"]:::data
        Store_File[("mobility_store.json")]:::data
    end

    R_Auth --> M_Sec
    R_Rides --> M_Auth
    R_Carpools --> M_Auth
    R_Wallet --> M_Auth
    R_Geo --> S_Route

    R_Auth --> U_Auth
    R_Rides --> S_WS
    R_Rides --> S_Route
    R_Rides --> DB_Class
    R_Auth --> DB_Class
    R_Carpools --> DB_Class
    R_Wallet --> DB_Class
    R_Contact --> DB_Class

    DB_Class --> Store_File
```

---

## 4. Database Entity Relationship Diagram (ERD)

### Mermaid
```mermaid
erDiagram
    USERS ||--|| WALLETS : owns
    USERS ||--o| DRIVERS : profiles
    USERS ||--o{ RIDES : requests
    DRIVERS ||--o{ RIDES : fulfills
    RIDES ||--o{ RIDE_BIDS : receives
    DRIVERS ||--o{ RIDE_BIDS : submits
    USERS ||--o{ CARPOOLS : publishes
    CARPOOLS ||--o{ CARPOOL_BOOKINGS : contains
    USERS ||--o{ CARPOOL_BOOKINGS : reserves
    WALLETS ||--o{ WALLET_LEDGER : audits
    RIDES ||--o{ WALLET_LEDGER : settles

    USERS {
        string id PK "usr-uuid or drv-uuid"
        string name "Full Name"
        string email UK "Unique email address"
        string phone "Phone number"
        string role "rider | driver | admin"
        string passwordHash "bcrypt hash cost 10"
        datetime createdAt "ISO 8601"
    }

    DRIVERS {
        string id PK "drv-uuid"
        string userId FK "References USERS.id"
        string vehicleType "bike | auto | cab_economy"
        string model "Vehicle make & model"
        string plateNumber "Registration plate"
        float rating "1.00 to 5.00"
        int trips "Total completed rides"
        string status "ONLINE | OFFLINE"
        float walletEarnings "Accumulated INR"
    }

    RIDES {
        string id PK "RAP-XXXXX"
        string riderId FK "References USERS.id"
        string driverId FK "References DRIVERS.id"
        string service "Service display title"
        string vehicleType "bike | auto | cab | parcel"
        point pickupCoords "[latitude, longitude]"
        point dropCoords "[latitude, longitude]"
        float distanceKm "Calculated distance"
        int durationMins "Travel duration"
        float initialOfferFare "Rider proposed fare"
        float agreedFare "Final agreed fare"
        string status "BIDDING | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED"
        string paymentMethod "wallet | cash | upi"
        string rideOtp "4-digit security code"
        int rating "1 to 5"
        float tipAmount "Optional gratuity"
    }

    RIDE_BIDS {
        string bidId PK "BID-uuid"
        string rideId FK "References RIDES.id"
        string driverId FK "References DRIVERS.id"
        float driverPrice "Counter-bid amount"
        int etaMins "Arrival ETA"
        float distanceKm "Distance to pickup"
        string status "PENDING | ACCEPTED | EXPIRED"
    }

    CARPOOLS {
        string id PK "CP-XXXX"
        string driverId FK "References USERS.id"
        string fromCity "Origin city"
        string toCity "Destination city"
        string departureTime "Scheduled time"
        int totalSeats "Total capacity"
        int availableSeats "Unreserved inventory"
        float pricePerSeat "Driver-set seat price"
    }

    CARPOOL_BOOKINGS {
        string bookingId PK "CP-BK-uuid"
        string carpoolId FK "References CARPOOLS.id"
        string passengerId FK "References USERS.id"
        int seats "Seats reserved"
        float totalCost "pricePerSeat * seats"
        datetime createdAt "Timestamp"
    }

    WALLETS {
        string userId PK "References USERS.id"
        float balance "Available INR"
        string currency "INR"
        datetime updatedAt "Timestamp"
    }

    WALLET_LEDGER {
        string id PK "tx-uuid"
        string walletId FK "References WALLETS.userId"
        string rideId FK "References RIDES.id (opt)"
        string type "CREDIT | DEBIT"
        float amount "Transaction amount"
        string description "Audit note"
        string idempotencyKey UK "Unique deduplication key"
        datetime createdAt "Timestamp"
    }
```

---

## 5. Deployment Diagram (Dev vs Production Kubernetes)

### Mermaid
```mermaid
graph TD
    classDef dev fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px;
    classDef prod fill:#F0FDF4,stroke:#16A34A,stroke-width:1.5px;
    classDef cluster fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px;

    subgraph Dev_Deployment ["Single-Instance Prototype (Verified)"]
        DevVM["Single Cloud VM / Local Node<br/>Node.js 20 LTS Process<br/>- Port 5000: Express REST + WSS (/ws)<br/>- Hosts React static build (/static)<br/>- Storage: server/data/mobility_store.json"]:::dev
    end

    subgraph Prod_Kubernetes ["Production Cloud Cluster (Blueprint)"]
        ALB["AWS Application Load Balancer / Cloudflare CDN<br/>(TLS 1.3 Termination, WAF, Anycast DNS)"]:::prod
        
        subgraph K8s_Cluster ["Kubernetes EKS / GKE Cluster"]
            API_Pods["Stateless REST API Pods<br/>(Horizontal Pod Autoscaler 3-15 Pods)"]:::prod
            WS_Pods["Stateful WebSocket Gateway Pods<br/>(Consistent Hashing on rideId)"]:::prod
        end
        
        subgraph Persistent_Tier ["Managed Cloud Storage"]
            Redis_Cluster["AWS ElastiCache Redis 7.2<br/>(Spatial GEO, Redlock distributed mutex)"]:::cluster
            RDS_Postgres["AWS RDS PostgreSQL 16 + PostGIS<br/>(Multi-AZ Primary + 3 Read Replicas)"]:::cluster
        end
    end

    ALB -->|"HTTP/2 / REST"| API_Pods
    ALB -->|"WSS / Persistent"| WS_Pods
    API_Pods --> Redis_Cluster
    WS_Pods --> Redis_Cluster
    API_Pods --> RDS_Postgres
```

---

## 6. Use Case Diagram

### Mermaid
```mermaid
graph LR
    classDef actor fill:#0F172A,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF;
    classDef uc fill:#EFF6FF,stroke:#2563EB,stroke-width:1.5px,color:#1E3A8A;

    Rider["👤 Rider / Commuter"]:::actor
    Driver["👤 Driver Partner"]:::actor

    subgraph RideX_Platform ["RideX Platform Capabilities"]
        UC1["Request Ride & Propose Fare"]:::uc
        UC2["Evaluate Bids & Accept Offer"]:::uc
        UC3["Verify 4-Digit Security OTP"]:::uc
        UC4["View Live GPS Map Telemetry"]:::uc
        UC5["Rate Driver & Submit Tip"]:::uc
        UC6["Search & Reserve Carpool Seats"]:::uc
        UC7["Top-Up Digital Wallet"]:::uc
        UC8["Stream GPS Telemetry (3s)"]:::uc
        UC9["Submit Counter-Bid"]:::uc
        UC10["Publish Intercity Carpool"]:::uc
        UC11["Withdraw Driver Earnings"]:::uc
    end

    Rider --> UC1
    Rider --> UC2
    Rider --> UC3
    Rider --> UC4
    Rider --> UC5
    Rider --> UC6
    Rider --> UC7

    Driver --> UC8
    Driver --> UC9
    Driver --> UC3
    Driver --> UC10
    Driver --> UC11
```

---

## 7. State Machine Diagram: Ride Lifecycle

### Mermaid
```mermaid
stateDiagram-v2
    [*] --> BIDDING : POST /api/rides\n(Initial Proposed Fare)
    
    BIDDING --> BIDDING : Driver counter-bids received\n(bid_created event)
    BIDDING --> ASSIGNED : Rider accepts bid\n(POST /accept-bid via atomic mutex)
    BIDDING --> CANCELLED : Rider cancels ride\n(POST /cancel)
    
    ASSIGNED --> ARRIVED : Driver arrives at pickup
    ASSIGNED --> CANCELLED : Rider / Driver cancels\n(POST /cancel)
    
    ARRIVED --> IN_PROGRESS : Submit valid 4-digit OTP\n(POST /start)
    
    IN_PROGRESS --> COMPLETED : Driver completes ride\n(POST /complete)\nAutomated Wallet Settle (85/15)
    
    COMPLETED --> [*] : Driver rated & tipped\n(POST /rate)
    CANCELLED --> [*]
```

---

## 8. inDrive Dynamic Bidding Protocol Flowchart

### Mermaid
```mermaid
flowchart TD
    A["Rider selects pickup & drop"] --> B["System calculates recommended base fare"]
    B --> C["Rider proposes fare ([-] / [+] stepper)"]
    C --> D{"Fare within bounds?<br/>(0.6x - 3.0x base)"}
    D -- No --> E["Display bounds warning"]
    D -- Yes --> F["POST /api/rides (Status = BIDDING)"]
    F --> G["Broadcast ride proposal to nearby drivers (WSS)"]
    G --> H["Drivers review route, distance, & offer"]
    H --> I["Drivers submit counter-offers (bid_created)"]
    I --> J["Rider evaluates incoming bids"]
    J --> K{"Rider accepts a bid?"}
    K -- No / Adjust --> C
    K -- Yes --> L["POST /api/rides/:id/accept-bid"]
    L --> M{"Atomic Mutex Check:<br/>Status == 'BIDDING'?"}
    M -- Lock Failed / Race --> N["Return HTTP 409 Conflict<br/>(Already Claimed)"]
    M -- Lock Acquired --> O["Transition Status to 'ASSIGNED'"]
    O --> P["Mark chosen bid 'ACCEPTED'<br/>Expire competing bids"]
    P --> Q["Broadcast 'bid_accepted' via WebSocket"]
```

---

## 9. Intercity Carpool Corridor Buffering & Booking Workflow

### Mermaid
```mermaid
flowchart TD
    A["Driver publishes carpool<br/>(Origin, Destination, Time, Price, Seats)"] --> B["POST /api/carpools (CP-XXXX created)"]
    B --> C["Passenger queries /api/carpools?from=X&to=Y"]
    C --> D["Backend filters matching corridors"]
    D --> E["Passenger selects carpool & seats"]
    E --> F["POST /api/carpools/:id/book"]
    F --> G{"Is passenger the driver?"}
    G -- Yes --> H["Reject: Cannot book own carpool (400)"]
    G -- No --> I{"availableSeats >= requested?"}
    I -- No --> J["Reject: Insufficient seats (400)"]
    I -- Yes --> K{"Wallet balance >= totalCost?"}
    K -- No --> L["Reject: Insufficient balance<br/>Prompt wallet top-up"]
    K -- Yes --> M["Atomic Transaction:<br/>- Deduct totalCost from wallet<br/>- Append DEBIT to wallet_ledger<br/>- Decrement availableSeats<br/>- Insert carpool_booking receipt"]
    M --> N["Return HTTP 200 OK<br/>Booking Confirmed"]
```

---

## 10. Data Flow Diagrams (DFD Level 0 & Level 1)

### DFD Level 0 (System Context)
```
+--------------+               Ride Request / Proposed Fare              +-------------------+
|              | ------------------------------------------------------> |                   |
|    Rider     | <------------------------------------------------------ |                   |
|              |               Driver Counter-Bids & Live Map Telemetry   |                   |
+--------------+                                                         |                   |
                                                                         |   RIDEX MOBILITY  |
+--------------+               Live GPS Telemetry / Accept or Counter-Bid|      PLATFORM     |
|    Driver    | ------------------------------------------------------> |                   |
|              | <------------------------------------------------------ |                   |
|              |               Assigned Ride Notifications & Earnings    +-------------------+
+--------------+                                                           |               ^
                                                                           | Road Request  | Geometry
                                                                           v               |
                                                                 +---------------------------+
                                                                 | OpenStreetMap OSRM Server |
                                                                 +---------------------------+
```

### DFD Level 1 (Decomposed Subsystems)
```
[Rider] ---> (1.1 Authenticate & Request Ride) ---> [Data Store: rides]
                     |                                       |
                     v                                       v
         (1.2 Route Calculation) <--> [OSRM Engine]   (1.3 Bidding Coordinator)
                     |                                       |
                     +---------------------------------------+
                                     |
                                     v
[Driver] <--- (1.4 Broadcast Proposal & Ingest Bids) ---> [Data Store: ride_bids]
   |
   +--------> (1.5 Accept Bid under Mutex) ---> [Data Store: rides (ASSIGNED)]
                     |
                     v
             (1.6 Telemetry Streamer) <--- [Driver GPS] ---> [Rider Leaflet Map]
                     |
                     v
             (1.7 Trip Settlement & Ledger) ---> [Data Store: wallets & wallet_ledger]
```
