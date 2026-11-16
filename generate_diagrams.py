# -*- coding: utf-8 -*-
"""
Generate high-resolution professional architecture diagrams for RideX Report.
Outputs:
- diagram_hld.png
- diagram_bidding_flowchart.png
- diagram_state_machine.png
- diagram_carpool_corridor.png
- diagram_gantt_chart.png
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Set font family to Times New Roman or serif
plt.rcParams["font.family"] = "serif"
plt.rcParams["font.serif"] = ["Times New Roman", "DejaVu Serif"]

def create_hld_diagram():
    fig, ax = plt.subplots(figsize=(12, 7.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    
    # Background
    fig.patch.set_facecolor("#FFFFFF")
    
    # Colors
    c_client = "#EFF6FF"
    c_client_border = "#2563EB"
    c_gw = "#FEF2F2"
    c_gw_border = "#DC2626"
    c_svc = "#FFFBEB"
    c_svc_border = "#D97706"
    c_ws = "#F0FDF4"
    c_ws_border = "#16A34A"
    c_bus = "#F3E8FF"
    c_bus_border = "#9333EA"
    c_db = "#F8FAFC"
    c_db_border = "#475569"

    # Box Helper
    def draw_box(x, y, w, h, title, subtitle, bg_color, border_color, title_color="#0F172A"):
        rect = patches.FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.5,rounding_size=1.5",
            facecolor=bg_color, edgecolor=border_color, linewidth=1.5
        )
        ax.add_patch(rect)
        ax.text(x + w/2, y + h*0.65, title, ha="center", va="center", fontsize=10.5, fontweight="bold", color=title_color)
        if subtitle:
            ax.text(x + w/2, y + h*0.35, subtitle, ha="center", va="center", fontsize=8.5, color="#475569")

    # Title
    ax.text(50, 96, "RideX — High-Level Microservices Architecture (HLD)", ha="center", va="center", fontsize=14, fontweight="bold", color="#0F172A")
    
    # Tier 1: Clients
    draw_box(5, 78, 26, 12, "Rider Mobile / Web SPA", "React 18 • Leaflet Maps • inDrive Stepper", c_client, c_client_border)
    draw_box(37, 78, 26, 12, "Driver Partner App", "GPS Streamer • Bidding Console • Earnings", c_client, c_client_border)
    draw_box(69, 78, 26, 12, "Intercity Carpool Traveler", "Corridor Search • Multi-Seat Booking", c_client, c_client_border)
    
    # Downward arrows
    ax.annotate("", xy=(18, 67), xytext=(18, 78), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))
    ax.annotate("", xy=(50, 67), xytext=(50, 78), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))
    ax.annotate("", xy=(82, 67), xytext=(82, 78), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))
    ax.text(50, 71.5, "HTTPS / WSS (TLS 1.3)", ha="center", va="center", fontsize=8, color="#64748B", backgroundcolor="#FFFFFF")

    # Tier 2: Ingress Gateway
    draw_box(5, 55, 90, 12, "Layer 7 Ingress & API Gateway (Envoy / Express)", "TLS Termination • Token-Bucket Rate Limiter (300 req/min) • CORS • X-Request-ID Tracking", c_gw, c_gw_border, "#991B1B")

    # Downward arrows from Ingress
    ax.annotate("", xy=(30, 44), xytext=(30, 55), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))
    ax.annotate("", xy=(70, 44), xytext=(70, 55), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))

    # Tier 3: Compute & WebSockets
    draw_box(5, 27, 50, 17, "Stateless Application Microservices", "• Auth & RBAC (HMAC-SHA256 JWT)\n• inDrive Bidding Coordinator (Atomic Lock)\n• Ride Lifecycle & Rate Cards (OTP Gate)\n• Carpool Corridor Engine & Double-Entry Ledger", c_svc, c_svc_border, "#78350F")
    draw_box(60, 27, 35, 17, "Real-Time WebSocket Gateway", "• Native 'ws' Persistent Gateway (/ws)\n• Room-Based Ride Channel Isolation\n• Sub-80ms GPS Telemetry Streamer\n• 30s Heartbeat Ping/Pong Watcher", c_ws, c_ws_border, "#065F46")

    # Bidirectional between Services and WS
    ax.annotate("", xy=(55, 35.5), xytext=(60, 35.5), arrowprops=dict(arrowstyle="<->", lw=1.5, color="#16A34A"))

    # Downward to Data Tier
    ax.annotate("", xy=(30, 17), xytext=(30, 27), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))
    ax.annotate("", xy=(77, 17), xytext=(77, 27), arrowprops=dict(arrowstyle="->", lw=1.5, color="#64748B"))

    # Tier 4: Storage & Caching
    draw_box(5, 4, 42, 13, "Clustered Persistence (PostgreSQL 16 + PostGIS)", "ACID Relational Core • Spatial GIST Indexes • Ledger Passbook", c_db, c_db_border)
    draw_box(53, 4, 42, 13, "In-Memory Caching & Indexing (Redis 7.2)", "Uber H3 Hexagonal Spatial Index • Redlock Mutex • TTL Hashes", c_bus, c_bus_border, "#581C87")

    plt.tight_layout()
    plt.savefig("diagram_hld.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Created diagram_hld.png")

def create_bidding_flowchart():
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    fig.patch.set_facecolor("#FFFFFF")

    def draw_node(x, y, w, h, text, bg="#EFF6FF", border="#2563EB", is_decision=False):
        if is_decision:
            # Diamond shape
            poly = patches.Polygon([
                [x + w/2, y], [x + w, y + h/2], [x + w/2, y + h], [x, y + h/2]
            ], closed=True, facecolor=bg, edgecolor=border, linewidth=1.5)
            ax.add_patch(poly)
            ax.text(x + w/2, y + h/2, text, ha="center", va="center", fontsize=8.5, fontweight="bold", color="#1E3A8A")
        else:
            rect = patches.FancyBboxPatch(
                (x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.2",
                facecolor=bg, edgecolor=border, linewidth=1.5
            )
            ax.add_patch(rect)
            ax.text(x + w/2, y + h/2, text, ha="center", va="center", fontsize=8.5, color="#0F172A", multialignment="center")

    ax.text(50, 96, "inDrive Dynamic Bidding Protocol & Concurrency Workflow", ha="center", va="center", fontsize=13, fontweight="bold", color="#0F172A")

    draw_node(25, 84, 50, 8, "Rider Selects Pickup & Drop Locations", "#EFF6FF", "#2563EB")
    ax.annotate("", xy=(50, 77), xytext=(50, 84), arrowprops=dict(arrowstyle="->", lw=1.2, color="#64748B"))

    draw_node(22, 69, 56, 8, "Rider Proposes Custom Base Fare via Stepper [-] / [+]", "#EFF6FF", "#2563EB")
    ax.annotate("", xy=(50, 62), xytext=(50, 69), arrowprops=dict(arrowstyle="->", lw=1.2, color="#64748B"))

    draw_node(28, 49, 44, 13, "Fare Within Bounds?\n0.6x Base ≤ F ≤ 3.0x Base", "#FEF3C7", "#D97706", is_decision=True)

    # Yes path
    ax.annotate("Yes", xy=(50, 42), xytext=(50, 49), arrowprops=dict(arrowstyle="->", lw=1.2, color="#16A34A"))
    draw_node(18, 34, 64, 8, "Broadcast to Eligible Drivers in H3 Proximity Cell (WSS)", "#ECFDF5", "#16A34A")

    # Drivers submit counter-bids
    ax.annotate("", xy=(50, 27), xytext=(50, 34), arrowprops=dict(arrowstyle="->", lw=1.2, color="#64748B"))
    draw_node(18, 19, 64, 8, "Drivers Review Route & Submit Counter-Offers (TTL 25s)", "#ECFDF5", "#16A34A")

    # Atomic acceptance
    ax.annotate("", xy=(50, 12), xytext=(50, 19), arrowprops=dict(arrowstyle="->", lw=1.2, color="#64748B"))
    draw_node(15, 3, 70, 9, "Rider Accepts Bid → Atomic Mutex Claim → Status: ASSIGNED\nCompeting Bids Marked EXPIRED (Zero Race Conditions)", "#FFFBEB", "#B45309")

    # No path from decision
    ax.annotate("No", xy=(72, 55.5), xytext=(85, 55.5), arrowprops=dict(arrowstyle="<-", lw=1.2, color="#DC2626"))
    draw_node(85, 51.5, 14, 8, "Show Bounds\nWarning", "#FEE2E2", "#DC2626")

    plt.tight_layout()
    plt.savefig("diagram_bidding_flowchart.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Created diagram_bidding_flowchart.png")

def create_state_machine_diagram():
    fig, ax = plt.subplots(figsize=(11, 4.5), dpi=300)
    ax.set_xlim(0, 110)
    ax.set_ylim(0, 45)
    ax.axis("off")
    fig.patch.set_facecolor("#FFFFFF")

    def draw_state(x, y, w, h, name, desc, bg="#F8FAFC", border="#2563EB"):
        rect = patches.FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.3,rounding_size=1.2",
            facecolor=bg, edgecolor=border, linewidth=1.5
        )
        ax.add_patch(rect)
        ax.text(x + w/2, y + h*0.6, name, ha="center", va="center", fontsize=9.5, fontweight="bold", color="#0F172A")
        ax.text(x + w/2, y + h*0.3, desc, ha="center", va="center", fontsize=7.5, color="#64748B")

    ax.text(55, 41, "RideX Deterministic Ride Lifecycle State Transitions", ha="center", va="center", fontsize=12, fontweight="bold", color="#0F172A")

    draw_state(3, 18, 16, 12, "BIDDING", "Auction active", "#EFF6FF", "#2563EB")
    ax.annotate("Accept Bid\n(Atomic Lock)", xy=(25, 24), xytext=(19, 24), arrowprops=dict(arrowstyle="->", lw=1.2, color="#2563EB"), fontsize=7, ha="center")

    draw_state(25, 18, 16, 12, "ASSIGNED", "Driver bound", "#EFF6FF", "#2563EB")
    ax.annotate("Driver\nArrives", xy=(47, 24), xytext=(41, 24), arrowprops=dict(arrowstyle="->", lw=1.2, color="#2563EB"), fontsize=7, ha="center")

    draw_state(47, 18, 16, 12, "ARRIVED", "At pickup", "#EFF6FF", "#2563EB")
    ax.annotate("Verify 4-Digit\nOTP", xy=(69, 24), xytext=(63, 24), arrowprops=dict(arrowstyle="->", lw=1.2, color="#16A34A"), fontsize=7, ha="center")

    draw_state(69, 18, 18, 12, "IN_PROGRESS", "Live telemetry", "#ECFDF5", "#16A34A")
    ax.annotate("Trip Complete\n(85/15 Settle)", xy=(93, 24), xytext=(87, 24), arrowprops=dict(arrowstyle="->", lw=1.2, color="#16A34A"), fontsize=7, ha="center")

    draw_state(93, 18, 15, 12, "COMPLETED", "Settled & Rated", "#FEF3C7", "#D97706")

    # Cancelled state below
    draw_state(45, 2, 20, 9, "CANCELLED", "Aborted trip", "#FEE2E2", "#DC2626")
    ax.annotate("Cancel", xy=(11, 18), xytext=(45, 6.5), arrowprops=dict(arrowstyle="->", lw=1.0, color="#DC2626", connectionstyle="arc3,rad=-0.1"), fontsize=7, ha="center")
    ax.annotate("Cancel", xy=(33, 18), xytext=(48, 11), arrowprops=dict(arrowstyle="->", lw=1.0, color="#DC2626"), fontsize=7, ha="center")
    ax.annotate("Cancel", xy=(55, 18), xytext=(55, 11), arrowprops=dict(arrowstyle="->", lw=1.0, color="#DC2626"), fontsize=7, ha="center")

    plt.tight_layout()
    plt.savefig("diagram_state_machine.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Created diagram_state_machine.png")

def create_carpool_corridor_diagram():
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 50)
    ax.axis("off")
    fig.patch.set_facecolor("#FFFFFF")

    ax.text(50, 46, "Intercity Carpool Corridor Buffering & Detour Tolerance Model", ha="center", va="center", fontsize=12, fontweight="bold", color="#0F172A")

    # Driver route line
    x_route = [10, 30, 50, 70, 90]
    y_route = [25, 27, 24, 26, 25]
    ax.plot(x_route, y_route, color="#2563EB", lw=3, label="Driver Direct Route (R)")

    # 5km Buffer corridor
    y_top = [y + 9 for y in y_route]
    y_bot = [y - 9 for y in y_route]
    ax.fill_between(x_route, y_bot, y_top, color="#3B82F6", alpha=0.12, label="Spatial Corridor: ST_Buffer(R, 5000m)")
    ax.plot(x_route, y_top, color="#3B82F6", ls="--", lw=1)
    ax.plot(x_route, y_bot, color="#3B82F6", ls="--", lw=1)

    # Origin & Destination Driver markers
    ax.scatter([10, 90], [25, 25], color="#1E3A8A", s=80, zorder=5)
    ax.text(10, 21, "City A (Start)", ha="center", fontsize=8.5, fontweight="bold")
    ax.text(90, 21, "City B (End)", ha="center", fontsize=8.5, fontweight="bold")

    # Passenger pickup inside buffer
    ax.scatter([35], [29], color="#16A34A", s=70, zorder=5)
    ax.text(35, 32, "Passenger Pickup\n(ST_Contains = TRUE)", ha="center", fontsize=8, color="#16A34A", fontweight="bold")

    # Passenger drop inside buffer
    ax.scatter([65], [21], color="#16A34A", s=70, zorder=5)
    ax.text(65, 16, "Passenger Drop\n(ST_Contains = TRUE)", ha="center", fontsize=8, color="#16A34A", fontweight="bold")

    # Ineligible passenger outside buffer
    ax.scatter([50], [42], color="#DC2626", s=70, marker="x", zorder=5)
    ax.text(50, 44, "Out-of-Corridor Point\n(Detour > 15% Rejected)", ha="center", fontsize=8, color="#DC2626", fontweight="bold")

    # Formula footnote
    ax.text(50, 4, "Detour Constraint: Dist(Start → Pickup → Drop → End) ≤ 1.15 × Dist(Start → End)", ha="center", fontsize=8.5, fontstyle="italic", color="#475569")

    plt.tight_layout()
    plt.savefig("diagram_carpool_corridor.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Created diagram_carpool_corridor.png")

def create_gantt_chart():
    fig, ax = plt.subplots(figsize=(10, 4.2), dpi=300)
    fig.patch.set_facecolor("#FFFFFF")
    
    phases = [
        "Phase 5: Corridor Engine & Verification",
        "Phase 4: inDrive Bidding & WebSockets",
        "Phase 3: Multi-Modal Routing & Maps",
        "Phase 2: Ingress Gateway & Auth Security",
        "Phase 1: Architecture & Capacity Math"
    ]
    
    # 5 Phases across 5 Weeks
    start_weeks = [4, 3, 2, 1, 0]  # Week 5, 4, 3, 2, 1
    durations = [1, 1, 1, 1, 1]
    colors = ["#059669", "#D97706", "#2563EB", "#7C3AED", "#0F172A"]

    y_pos = np.arange(len(phases))
    bars = ax.barh(y_pos, durations, left=start_weeks, height=0.55, color=colors, edgecolor="#CBD5E1", linewidth=1.2)

    ax.set_yticks(y_pos)
    ax.set_yticklabels(phases, fontsize=9, fontweight="bold", color="#0F172A")
    ax.set_xticks([0, 1, 2, 3, 4, 5])
    ax.set_xticklabels(["Week 0", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5"], fontsize=9, color="#0F172A")
    ax.set_xlim(0, 5.2)
    ax.grid(axis="x", ls="--", alpha=0.5)
    
    ax.set_title("RideX 5-Phase, 5-Week Engineering Implementation Schedule", fontsize=12, fontweight="bold", color="#0F172A", pad=12)
    
    # Task labels inside bars
    task_notes = [
        "Corridor Buffer, Wallet Ledger, Jest Integration Tests",
        "WebSocket Gateway (/ws), Dynamic Stepper, Mutex Claim",
        "Leaflet Map, OSRM Road Graph, Vehicle Rate Cards",
        "Express Rate Limiting, Bcrypt, JWT Stateless Sessions",
        "Requirements Modeling, PostGIS Schema, Capacity Sizing"
    ]
    for idx, (bar, note) in enumerate(zip(bars, task_notes)):
        ax.text(bar.get_x() + 0.05, bar.get_y() + bar.get_height()/2, note, va="center", ha="left", fontsize=7.5, color="#FFFFFF", fontweight="bold")

    plt.tight_layout()
    plt.savefig("diagram_gantt_chart.png", dpi=300, bbox_inches="tight")
    plt.close()
    print("Created diagram_gantt_chart.png")

if __name__ == "__main__":
    create_hld_diagram()
    create_bidding_flowchart()
    create_state_machine_diagram()
    create_carpool_corridor_diagram()
    create_gantt_chart()
