# -*- coding: utf-8 -*-
"""
Report Content Definition for RideX System Design Project Report
Contains structured text, tables, diagrams, equations, and specifications for all 14 chapters.
"""

METADATA = {
    "project_title": "RideX — A Smart Ride-Hailing and Intercity Carpooling Platform",
    "project_subtitle": "Production-Oriented Distributed System Design and Engineering Implementation",
    "degree": "Bachelor of Technology (B.Tech)",
    "branch": "Computer Science and Engineering",
    "institution_placeholder": "[University / Institute of Technology Name]",
    "department_placeholder": "Department of Computer Science & Engineering",
    "academic_year": "2025 – 2026",
    "guide_placeholder": "[Dr. / Prof. Faculty Supervisor Name, Designation]",
    "student_names_placeholder": "[Student Name 1 (Roll No. XXXXXXXX), Student Name 2 (Roll No. YYYYYYYY)]",
    "date": "October 2026"
}

PRELIMINARY = {
    "certificate": """This is to certify that the project report entitled "RideX — A Smart Ride-Hailing and Intercity Carpooling Platform", submitted by [Student Name(s) and Roll Numbers] in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering, is a bonafide record of the work carried out under my supervision and guidance.

To the best of my knowledge and belief, the system design, architectural modeling, REST/WebSocket API implementations, geospatial routing algorithms, dynamic bidding coordination engine, and double-entry ledger mechanisms embodied in this report have been thoroughly investigated, implemented, and verified against production benchmarks, and have not been submitted elsewhere for the award of any other degree or diploma.


_______________________________                          _______________________________
Faculty Project Guide / Supervisor                         Head of Department
Department of Computer Science & Engineering              Department of Computer Science & Engineering
[University / Institute Name]                             [University / Institute Name]""",

    "declaration": """We hereby declare that the project report entitled "RideX — A Smart Ride-Hailing and Intercity Carpooling Platform" submitted to the Department of Computer Science and Engineering, [University / Institute Name], is an authentic record of our original engineering and system design work conducted during the academic year 2025–2026.

All system architectures, microservice boundaries, database schemas, real-time WebSocket state machines, algorithmic formulations, and integration test suites presented herein reflect actual implementation and verifiable technical design. Wherever external libraries, open-source mapping services (Leaflet, OpenStreetMap, OSRM), or standard cryptographic protocols have been utilized, appropriate citations and references have been documented.


_______________________________                          _______________________________
[Student Name 1]                                         [Student Name 2]
Roll No: [XXXXXXXX]                                      Roll No: [YYYYYYYY]
Department of Computer Science & Engineering             Department of Computer Science & Engineering""",

    "acknowledgement": """We express our deepest gratitude to our project supervisor, [Faculty Guide Name], whose profound technical insight, rigorous architectural reviews, and continuous guidance have steered this system design project from conceptualization to an enterprise-grade prototype.

We are immensely thankful to the Head of the Department, [HOD Name], and the esteemed faculty members of the Department of Computer Science and Engineering for providing the computational infrastructure, development facilities, and academic environment conducive to advanced systems engineering.

Furthermore, we extend our sincere appreciation to the open-source engineering communities behind Node.js, Express, React, OpenStreetMap, the OSRM project, and the Leaflet library, whose robust developer tooling made the realization of this distributed mobility platform possible. Lastly, we thank our peers and families for their unwavering encouragement throughout this endeavor.""",

    "abstract": """Modern urban transportation networks face severe structural inefficiencies, including rigid surge-pricing monopolies, high intermediary commission fees (typically 20% to 30%), driver dissatisfaction, and fragmented intercity transit options. Traditional ride-hailing architectures rely heavily on centralized, algorithmic dispatch mechanisms where neither drivers nor passengers have direct control over pricing, resulting in frequent ride cancellations and supply shortages during peak traffic periods.

This report presents the system design, architectural modeling, and production-oriented implementation of RideX — an enterprise-grade, distributed multi-modal mobility and peer-to-peer transportation platform. RideX uniquely synthesizes three major mobility paradigms into a cohesive, high-performance distributed architecture:
1. Intra-City On-Demand Ride Hailing: Low-latency matching across multi-modal vehicle categories (Bike Taxi, Auto Rickshaw, Cab Economy, and Parcel Delivery) utilizing OpenStreetMap/Leaflet geospatial telemetry, real-time OSRM (Open Source Routing Engine) road pathing, and cryptographic 4-digit OTP security gates.
2. Dynamic Peer-to-Peer Fare Negotiation (inDrive Model): A two-sided decentralized bidding marketplace where passengers propose bespoke base fares, and nearby qualified drivers respond in real-time with competitive counter-offers. Ride assignment is executed via atomic mutex locking patterns to prevent duplicate claims under concurrent load.
3. Intercity Corridor Carpooling: Long-distance seat-sharing along major travel corridors with driver-defined per-seat pricing, geospatial polygon buffering (ST_Buffer / ST_DWithin concepts), detour tolerance filtering, and atomic seat inventory locking.

The software platform is constructed on a high-throughput Node.js/Express backend coupled with a persistent, full-duplex WebSocket gateway (ws protocol), serving a reactive React 18 single-page application. Security hardening includes stateless HMAC-SHA256 JWT authentication, bcrypt password hashing (cost factor 10), token-bucket rate limiting (300 requests/minute), strict Content Security Policy (CSP), and automated X-Request-ID distributed tracing. Persistence is managed via an atomic transaction-safe datastore designed for seamless migration to a clustered PostgreSQL 16 database with PostGIS spatial extensions. An integrated financial ledger enforces double-entry bookkeeping and strict idempotency for simulated digital wallet transactions. The system was validated via an automated Jest/Supertest integration suite comprising 23 distinct end-to-end test scenarios across authentication, RBAC, resource ownership, concurrent WebSocket telemetry fanout, and bid synchronization, achieving 100% test pass fidelity."""
}

ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("BCNF", "Boyce-Codd Normal Form"),
    ("CORS", "Cross-Origin Resource Sharing"),
    ("CSP", "Content Security Policy"),
    ("DAU", "Daily Active Users"),
    ("DDL", "Data Definition Language"),
    ("DFD", "Data Flow Diagram"),
    ("DNS", "Domain Name System"),
    ("ERD", "Entity Relationship Diagram"),
    ("ETA", "Estimated Time of Arrival"),
    ("GIST", "Generalized Search Tree (Spatial Indexing)"),
    ("GPS", "Global Positioning System"),
    ("H3", "Uber Hexagonal Hierarchical Spatial Index"),
    ("HLD", "High-Level Design"),
    ("HSTS", "HTTP Strict Transport Security"),
    ("HTTP", "Hypertext Transfer Protocol"),
    ("HTTPS", "Hypertext Transfer Protocol Secure"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token"),
    ("LLD", "Low-Level Design"),
    ("MVC", "Model-View-Controller"),
    ("NFR", "Non-Functional Requirement"),
    ("OSM", "OpenStreetMap"),
    ("OSRM", "Open Source Routing Engine"),
    ("OTP", "One-Time Password"),
    ("PWA", "Progressive Web Application"),
    ("QPS", "Queries Per Second"),
    ("RBAC", "Role-Based Access Control"),
    ("REST", "Representational State Transfer"),
    ("SMS", "Short Message Service"),
    ("SOS", "Save Our Souls (Emergency Distress Signal)"),
    ("SPA", "Single Page Application"),
    ("SQL", "Structured Query Language"),
    ("SSL", "Secure Sockets Layer"),
    ("TLS", "Transport Layer Security"),
    ("TTL", "Time To Live"),
    ("UI / UX", "User Interface / User Experience"),
    ("UML", "Unified Modeling Language"),
    ("UUID", "Universally Unique Identifier"),
    ("WAF", "Web Application Firewall"),
    ("WS / WSS", "WebSocket / WebSocket Secure")
]
