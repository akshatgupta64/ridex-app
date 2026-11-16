# -*- coding: utf-8 -*-
"""
Build Academic Report: Generates RideX_Academic_Format_Project_Report.docx, .html, and .pdf.
Implements the exact front-page template from Chandigarh University (sample.docx):
- Title/Cover Page with University Emblem
- Bonafide Certificate with HOD/Supervisor/Examiner blocks
- Candidate Declaration
- Acknowledgement
- Abstract & Graphical Abstract (embedding HLD diagram)
- Table of Contents
- List of Figures & List of Tables
- List of Abbreviations & Symbols
Followed by the 9 complete technical chapters in Times New Roman,
with section-level page breaks, 5 high-res diagrams, 18 tables, and clean math notation.
"""

import os
import re
import subprocess
from pathlib import Path

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from clean_report_data import ALL_SECTIONS

# Executive Palette
COLOR_NAVY = RGBColor(15, 23, 42)      # #0F172A
COLOR_AMBER = RGBColor(217, 119, 6)    # #D97706
COLOR_SLATE = RGBColor(71, 85, 105)    # #475569
COLOR_TEXT = RGBColor(17, 24, 39)      # #111827
COLOR_MUTED = RGBColor(100, 116, 139)  # #64748B

HEX_NAVY = "0F172A"
HEX_AMBER = "D97706"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
FONT_PRIMARY = "Times New Roman"

CANDIDATES = [
    {"name": "Rama Satya Durga Bhagavan", "uid": "24BCS11975"},
    {"name": "Manan Pathak", "uid": "24BCS11495"},
    {"name": "Akshat Gupta", "uid": "24BCS11506"},
    {"name": "Rahul Singh Bisht", "uid": "24BCS11487"}
]

DIAGRAM_CAPTIONS = {
    "diagram_hld.png": "Figure 4.1: RideX High-Level Microservices & Distributed Real-Time Architecture",
    "diagram_bidding_flowchart.png": "Figure 5.1: RideX inDrive-Style Peer-to-Peer Dynamic Bidding Negotiation Protocol",
    "diagram_state_machine.png": "Figure 5.2: RideX Finite State Machine (FSM) Lifecycle & Mutex State Transitions",
    "diagram_carpool_corridor.png": "Figure 6.1: RideX Intercity Corridor Spatial Buffering & 15% Detour Tolerance Geometry",
    "diagram_gantt_chart.png": "Figure 9.1: RideX Engineering Implementation Schedule (5 Phases across 5 Weeks)"
}

LIST_OF_FIGURES = [
    ("Figure 4.1", "RideX High-Level Microservices & Distributed Real-Time Architecture"),
    ("Figure 5.1", "RideX inDrive-Style Peer-to-Peer Dynamic Bidding Negotiation Protocol"),
    ("Figure 5.2", "RideX Finite State Machine (FSM) Lifecycle & Mutex State Transitions"),
    ("Figure 6.1", "RideX Intercity Corridor Spatial Buffering & 15% Detour Tolerance Geometry"),
    ("Figure 9.1", "RideX Engineering Implementation Schedule (5 Phases across 5 Weeks)")
]

LIST_OF_TABLES = [
    ("Table 1.1", "Multi-Modal Transit Services Matrix (Bike Taxi, Auto, Cab, Parcel, Carpool)"),
    ("Table 2.1", "Comparative Architectural Analysis: Traditional TNCs vs. RideX"),
    ("Table 3.1", "Complete Technology Stack & Architectural Roles"),
    ("Table 7.1", "Relational Schema - Users & Identity Authentication"),
    ("Table 7.2", "Relational Schema - Drivers & Fleet Partner Registry"),
    ("Table 7.3", "Relational Schema - Rides & Lifecycle State Engine"),
    ("Table 7.4", "Relational Schema - Ride Bids (Dynamic Negotiation)"),
    ("Table 7.5", "Relational Schema - Intercity Carpools"),
    ("Table 7.6", "Relational Schema - Carpool Bookings & Passenger Seats"),
    ("Table 7.7", "Relational Schema - Digital Wallets & Financial Ledger"),
    ("Table 7.8", "Database Performance & Geospatial Spatial Indexing"),
    ("Table 8.1", "REST API Catalog - Authentication & Identity"),
    ("Table 8.2", "REST API Catalog - Multi-Modal Ride Dispatch & Lifecycle"),
    ("Table 8.3", "REST API Catalog - inDrive Dynamic Bidding Protocol"),
    ("Table 8.4", "REST API Catalog - Intercity Corridor Carpooling"),
    ("Table 8.5", "REST API Catalog - Digital Wallet & Financial Ledger"),
    ("Table 8.6", "WebSocket Real-Time Gateway Protocols (/ws)"),
    ("Table 9.1", "5-Phase, 5-Week Engineering Work Breakdown Structure")
]

LIST_OF_ABBREVIATIONS = [
    ("API", "Application Programming Interface"),
    ("CAS", "Compare-And-Swap (Atomic Concurrency Control)"),
    ("CSP", "Content Security Policy"),
    ("DAU", "Daily Active Users"),
    ("FSM", "Finite State Machine"),
    ("GIST", "Generalized Search Tree (PostGIS Spatial Index)"),
    ("GPS", "Global Positioning System"),
    ("HLD", "High-Level Design"),
    ("HSTS", "HTTP Strict Transport Security"),
    ("JWT", "JSON Web Token"),
    ("LLD", "Low-Level Design"),
    ("OSRM", "Open Source Routing Machine"),
    ("OTP", "One-Time Password"),
    ("P2P", "Peer-to-Peer"),
    ("PII", "Personally Identifiable Information"),
    ("QPS", "Queries Per Second"),
    ("RBAC", "Role-Based Access Control"),
    ("REST", "Representational State Transfer"),
    ("SPA", "Single-Page Application"),
    ("TLS", "Transport Layer Security"),
    ("TNC", "Transportation Network Company"),
    ("TTL", "Time-To-Live"),
    ("UML", "Unified Modeling Language"),
    ("WSS", "WebSocket Secure")
]

LIST_OF_SYMBOLS = [
    ("F_base", "Baseline rate-card calculated fare for the transit corridor (INR)"),
    ("F_offer", "Passenger proposed custom fare submission (INR)"),
    ("F_driver", "Driver counter-bid proposed fare (INR)"),
    ("Δφ", "Delta latitude between origin and destination coordinates (radians)"),
    ("Δλ", "Delta longitude between origin and destination coordinates (radians)"),
    ("R", "Mean equatorial radius of Earth (6,371 km)"),
    ("d", "Haversine great-circle road distance between coordinates (km)"),
    ("W", "Spatial corridor buffer envelope width (5,000 meters)"),
    ("S", "Requested seat quantity for carpool corridor booking")
]

def clean_xml_str(text):
    if not text:
        return ""
    s = str(text).replace("\0", "")
    return re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", s)

def set_run_font(run, font_name=FONT_PRIMARY, size_pt=11, bold=False, italic=False, color=COLOR_TEXT):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color
    rPr = run._r.get_or_add_rPr()
    rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>')
    rPr.append(rFonts)

def set_cell_background(cell, hex_color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def style_paragraph(p, space_before=0, space_after=6, line_spacing=1.15):
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing

def add_header_footer(doc):
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
        # Header
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("RideX — Academic System Design & Engineering Project Report")
        set_run_font(hrun, size_pt=9, italic=True, color=COLOR_MUTED)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Chandigarh University | Department of Computer Science & Engineering")
        set_run_font(frun, size_pt=9, italic=True, color=COLOR_MUTED)

def parse_and_add_table(doc, markdown_table_text):
    lines = [l.strip() for l in markdown_table_text.strip().split("\n") if l.strip()]
    if len(lines) < 2:
        return
    
    headers = [c.strip() for c in lines[0].strip("|").split("|")]
    num_cols = len(headers)
    
    data_rows = []
    for line in lines[2:]:
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) == num_cols:
            data_rows.append(cells)
            
    tbl = doc.add_table(rows=len(data_rows) + 1, cols=num_cols)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        clean_h = clean_xml_str(h.replace("**", "").strip())
        cell = hdr_cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        style_paragraph(p, space_before=0, space_after=0)
        run = p.add_run(clean_h)
        set_run_font(run, size_pt=9.5, bold=True, color=RGBColor(255, 255, 255))
        
    # Data Rows
    for r_idx, row_data in enumerate(data_rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(row_data):
            cell = row_cells[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            style_paragraph(p, space_before=0, space_after=0)
            clean_val = clean_xml_str(val.replace("**", "").replace("`", "").strip())
            run = p.add_run(clean_val)
            set_run_font(run, size_pt=9.0, color=COLOR_TEXT)
            
    for row in tbl.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            tcBorders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>\n'
                f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>\n'
                f'  <w:left w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>\n'
                f'  <w:bottom w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>\n'
                f'  <w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>\n'
                f'</w:tcBorders>'
            )
            tcPr.append(tcBorders)
            
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(6)

def add_diagram_image(doc, img_name):
    clean_name = img_name.strip()
    if not os.path.exists(clean_name):
        print(f"Warning: Diagram image {clean_name} not found.")
        return

    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_img, space_before=10, space_after=4)
    run_img = p_img.add_run()
    run_img.add_picture(clean_name, width=Inches(6.2))

    # Caption
    caption = DIAGRAM_CAPTIONS.get(clean_name, f"Figure: {clean_name}")
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_cap, space_before=2, space_after=14)
    r_cap = p_cap.add_run(caption)
    set_run_font(r_cap, size_pt=9.5, italic=True, color=COLOR_SLATE)

def add_content_block(doc, text_block):
    lines = text_block.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Diagram
        if "[DIAGRAM:" in line:
            m = re.search(r'\[DIAGRAM:\s*([^\]]+)\]', line)
            if m:
                img_name = m.group(1).strip()
                add_diagram_image(doc, img_name)
            i += 1
            continue

        # Table
        if line.strip().startswith("|") and line.strip().endswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            parse_and_add_table(doc, "\n".join(table_lines))
            continue
            
        # Paragraph / Lists
        if line.strip():
            p = doc.add_paragraph()
            style_paragraph(p, space_before=0, space_after=5)
            
            if line.strip().startswith("- ") or line.strip().startswith("* "):
                p.paragraph_format.left_indent = Inches(0.25)
                run_bullet = p.add_run("•  ")
                set_run_font(run_bullet, size_pt=10, bold=True, color=COLOR_AMBER)
                content = line.strip()[2:]
            elif re.match(r'^\d+\.\s', line.strip()):
                parts = line.strip().split(". ", 1)
                p.paragraph_format.left_indent = Inches(0.25)
                run_num = p.add_run(clean_xml_str(parts[0] + ". "))
                set_run_font(run_num, size_pt=11, bold=True, color=COLOR_NAVY)
                content = parts[1] if len(parts) > 1 else ""
            else:
                content = line.strip()
                
            if "**" in content:
                tokens = content.split("**")
                for t_idx, token in enumerate(tokens):
                    r = p.add_run(clean_xml_str(token))
                    is_bold = (t_idx % 2 == 1)
                    set_run_font(r, size_pt=11, bold=is_bold, color=COLOR_TEXT)
            else:
                r = p.add_run(clean_xml_str(content))
                set_run_font(r, size_pt=11, color=COLOR_TEXT)
        i += 1

def build_docx_report(output_filename="RideX_Academic_Format_Project_Report.docx"):
    print(f"Building Academic Format DOCX report: {output_filename}...")
    doc = docx.Document()
    
    style_normal = doc.styles['Normal']
    style_normal.font.name = FONT_PRIMARY
    style_normal.font.size = Pt(11)
    
    add_header_footer(doc)
    
    # =========================================================================
    # PRELIMINARY PAGE 1: COVER / TITLE PAGE (sample.docx template)
    # =========================================================================
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=20, space_after=12, line_spacing=1.3)
    r = p.add_run("RIDEX — A SMART RIDE-HAILING AND INTERCITY CARPOOLING PLATFORM")
    set_run_font(r, size_pt=18, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=8, space_after=16)
    r = p.add_run("A PROJECT REPORT")
    set_run_font(r, size_pt=14, bold=True, color=COLOR_TEXT)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=6, space_after=6)
    r = p.add_run("Submitted by")
    set_run_font(r, size_pt=14, bold=True, italic=True, color=COLOR_SLATE)
    
    for cand in CANDIDATES:
        p_c = doc.add_paragraph()
        p_c.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_paragraph(p_c, space_before=1, space_after=1)
        r_name = p_c.add_run(f"{cand['name'].upper()} ")
        set_run_font(r_name, size_pt=13.5, bold=True, color=COLOR_NAVY)
        r_uid = p_c.add_run(f"({cand['uid']})")
        set_run_font(r_uid, size_pt=12, bold=True, color=COLOR_SLATE)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=10, space_after=6, line_spacing=1.3)
    r = p.add_run("in partial fulfillment for the award of the degree of")
    set_run_font(r, size_pt=13.5, bold=True, italic=True, color=COLOR_SLATE)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=6, space_after=4)
    r = p.add_run("BACHELOR OF ENGINEERING")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=2, space_after=2)
    r = p.add_run("IN")
    set_run_font(r, size_pt=14, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=2, space_after=18)
    r = p.add_run("COMPUTER SCIENCE AND ENGINEERING")
    set_run_font(r, size_pt=15, bold=True, color=COLOR_NAVY)
    
    if os.path.exists("cu_logo.jpg"):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_paragraph(p_logo, space_before=10, space_after=12)
        r_logo = p_logo.add_run()
        r_logo.add_picture("cu_logo.jpg", width=Inches(1.8))
        
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=6, space_after=4)
    r = p.add_run("Chandigarh University")
    set_run_font(r, size_pt=15, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=2, space_after=0)
    r = p.add_run("OCTOBER 2026")
    set_run_font(r, size_pt=14, bold=True, color=COLOR_SLATE)

    # =========================================================================
    # PRELIMINARY PAGE 2: BONAFIDE CERTIFICATE (sample.docx template)
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=24, space_after=18)
    r = p.add_run("BONAFIDE CERTIFICATE")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_paragraph(p, space_before=12, space_after=24, line_spacing=1.5)
    cand_bonafide_str = "Rama Satya Durga Bhagavan (24BCS11975), Manan Pathak (24BCS11495), Akshat Gupta (24BCS11506), and Rahul Singh Bisht (24BCS11487)"
    r = p.add_run(
        'Certified that this project report "RideX — A Smart Ride-Hailing and Intercity Carpooling Platform" '
        f'is the bonafide work of {cand_bonafide_str} who carried out the project work '
        'under my/our supervision in partial fulfillment for the award of the degree of Bachelor of Engineering '
        'in Computer Science and Engineering at Chandigarh University.'
    )
    set_run_font(r, size_pt=12.5, color=COLOR_TEXT)
    
    # Signature Table (HOD & Supervisor)
    tbl_sig = doc.add_table(rows=1, cols=2)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_hod, c_sup = tbl_sig.rows[0].cells
    
    p_hod = c_hod.paragraphs[0]
    style_paragraph(p_hod, space_before=20, space_after=2, line_spacing=1.2)
    r = p_hod.add_run("<<Signature of the HoD>>\n")
    set_run_font(r, size_pt=10, italic=True, color=COLOR_SLATE)
    r = p_hod.add_run("SIGNATURE\n\n\n")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_NAVY)
    r = p_hod.add_run("<<Name of the Head of the Department>>\n")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_TEXT)
    r = p_hod.add_run("HEAD OF THE DEPARTMENT\n")
    set_run_font(r, size_pt=10, bold=True, color=COLOR_SLATE)
    r = p_hod.add_run("Department of Computer Science & Engineering\nChandigarh University")
    set_run_font(r, size_pt=10, color=COLOR_TEXT)
    
    p_sup = c_sup.paragraphs[0]
    style_paragraph(p_sup, space_before=20, space_after=2, line_spacing=1.2)
    r = p_sup.add_run("<<Signature of the Supervisor>>\n")
    set_run_font(r, size_pt=10, italic=True, color=COLOR_SLATE)
    r = p_sup.add_run("SIGNATURE\n\n\n")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_NAVY)
    r = p_sup.add_run("Shivam Sharma\n")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_TEXT)
    r = p_sup.add_run("SUPERVISOR\n")
    set_run_font(r, size_pt=10, bold=True, color=COLOR_SLATE)
    r = p_sup.add_run("Department of Computer Science & Engineering\nChandigarh University")
    set_run_font(r, size_pt=10, color=COLOR_TEXT)
    
    p_viva = doc.add_paragraph()
    style_paragraph(p_viva, space_before=40, space_after=20)
    r = p_viva.add_run("Submitted for the project viva-voce examination held on ____________________")
    set_run_font(r, size_pt=11.5, bold=True, color=COLOR_TEXT)
    
    tbl_exam = doc.add_table(rows=1, cols=2)
    tbl_exam.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_int, c_ext = tbl_exam.rows[0].cells
    
    p_int = c_int.paragraphs[0]
    style_paragraph(p_int, space_before=16, space_after=0)
    r = p_int.add_run("INTERNAL EXAMINER\n(Signature with Date)")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_NAVY)
    
    p_ext = c_ext.paragraphs[0]
    p_ext.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style_paragraph(p_ext, space_before=16, space_after=0)
    r = p_ext.add_run("EXTERNAL EXAMINER\n(Signature with Date)")
    set_run_font(r, size_pt=11, bold=True, color=COLOR_NAVY)

    # =========================================================================
    # PRELIMINARY PAGE 3: DECLARATION & ACKNOWLEDGEMENT
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=12)
    r = p.add_run("CANDIDATE DECLARATION")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_paragraph(p, space_before=6, space_after=14, line_spacing=1.35)
    r = p.add_run(
        'I/We hereby declare that the project report entitled "RideX — A Smart Ride-Hailing and Intercity '
        'Carpooling Platform" submitted to Chandigarh University, in partial fulfillment of the requirements '
        'for the award of the degree of Bachelor of Engineering in Computer Science and Engineering, is an authentic '
        'record of our original work carried out under the guidance of our project supervisor, Mr. Shivam Sharma. '
        'This work has not been submitted elsewhere for the award of any degree, diploma, fellowship, or other similar title.'
    )
    set_run_font(r, size_pt=11, color=COLOR_TEXT)
    
    p = doc.add_paragraph()
    style_paragraph(p, space_before=10, space_after=18)
    r = p.add_run("Date: ____________________\nPlace: Chandigarh University, Mohali\n\nCandidates:\n")
    set_run_font(r, size_pt=10.5, color=COLOR_TEXT)
    for cand in CANDIDATES:
        rc = p.add_run(f"• {cand['name']} ({cand['uid']})\n")
        set_run_font(rc, size_pt=10.5, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=12)
    r = p.add_run("ACKNOWLEDGEMENT")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_paragraph(p, space_before=6, space_after=10, line_spacing=1.35)
    r = p.add_run(
        'We express our deepest gratitude to the Department of Computer Science & Engineering, Chandigarh University, '
        'for providing world-class infrastructure, laboratory facilities, and an encouraging academic environment '
        'that enabled the realization of this capstone engineering project.\n\n'
        'We extend our profound appreciation to our Project Supervisor, Mr. Shivam Sharma, Head of the Department, '
        'and faculty members for their continuous guidance, technical critiques, and encouragement throughout the system '
        'design and implementation phases of RideX. Finally, we thank our peers and families for their unwavering support.'
    )
    set_run_font(r, size_pt=11, color=COLOR_TEXT)

    # =========================================================================
    # PRELIMINARY PAGE 4: ABSTRACT & GRAPHICAL ABSTRACT (sample.docx template)
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=14, space_after=10)
    r = p.add_run("ABSTRACT")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style_paragraph(p, space_before=4, space_after=14, line_spacing=1.3)
    r = p.add_run(
        'Urban transportation networks in high-density metropolitan areas suffer from monopolistic surge multipliers, '
        'high driver attrition, and siloed transit modes. RideX resolves these systemic market failures by unifying '
        'intra-city on-demand hailing (Bike Taxi, Auto, Cab Economy, Express Parcel) and long-distance intercity '
        'carpooling into a high-performance distributed real-time platform. A core innovation of RideX is its '
        'decentralized peer-to-peer fare negotiation protocol (inspired by inDrive), enabling passengers to propose '
        'custom fares and nearby drivers to return real-time counter-bids. Ride claiming is guaranteed conflict-free '
        'via an atomic compare-and-swap (CAS) distributed mutex locking mechanism. For long-distance journeys, a spatial '
        'corridor buffering algorithm matches intermediate passengers along the driver’s route within a strict 15% '
        'detour tolerance envelope. Built on a resilient stack of React 18, Express.js microservices, PostgreSQL 16 '
        'with PostGIS 3.4 geometric indexing, and persistent WebSocket streams delivering GPS telemetry with sub-80ms '
        'latency, RideX demonstrates enterprise-grade scalability, strict financial consistency, and production reliability.'
    )
    set_run_font(r, size_pt=10.5, color=COLOR_TEXT)
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=8)
    r = p.add_run("GRAPHICAL ABSTRACT")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    if os.path.exists("diagram_hld.png"):
        p_ga = doc.add_paragraph()
        p_ga.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_paragraph(p_ga, space_before=4, space_after=4)
        r_ga = p_ga.add_run()
        r_ga.add_picture("diagram_hld.png", width=Inches(5.8))
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style_paragraph(p_cap, space_before=2, space_after=8)
        r_cap = p_cap.add_run("Graphical Abstract: End-to-End Distributed Architecture of RideX Multi-Modal Mobility Platform")
        set_run_font(r_cap, size_pt=9.5, italic=True, color=COLOR_SLATE)

    # =========================================================================
    # PRELIMINARY PAGE 5: TABLE OF CONTENTS
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=14)
    r = p.add_run("TABLE OF CONTENTS")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    tbl_toc = doc.add_table(rows=1, cols=3)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = tbl_toc.rows[0].cells
    hdr[0].paragraphs[0].add_run("Chapter / Section")
    hdr[1].paragraphs[0].add_run("Title")
    hdr[2].paragraphs[0].add_run("Page")
    for cell in hdr:
        set_cell_background(cell, HEX_NAVY)
        set_run_font(cell.paragraphs[0].runs[0], size_pt=10, bold=True, color=RGBColor(255, 255, 255))
        
    toc_data = [
        ("Prelims", "Cover Page, Bonafide Certificate, Declaration, Acknowledgement", "i – iv"),
        ("Prelims", "Abstract & Graphical Abstract", "v"),
        ("Prelims", "List of Figures & List of Tables", "vi"),
        ("Prelims", "List of Abbreviations & Symbols", "vii"),
        ("Chapter 1", "Introduction & Executive Summary", "1"),
        ("Chapter 2", "Scale, Capacity & Performance Engineering", "4"),
        ("Chapter 3", "Technology Stack & Infrastructure Rationale", "6"),
        ("Chapter 4", "High-Level Design (HLD) & Microservices", "8"),
        ("Chapter 5", "Low-Level Design (LLD) & Component Architecture", "10"),
        ("Chapter 6", "Core Algorithms & Mathematical Formulations", "13"),
        ("Chapter 7", "Storage Architecture & Database Design", "15"),
        ("Chapter 8", "Complete API Catalog & Protocol Contracts", "22"),
        ("Chapter 9", "Project Execution Schedule & 5-Week Gantt Chart", "28")
    ]
    
    for c_sec, c_title, c_pg in toc_data:
        row = tbl_toc.add_row().cells
        row[0].paragraphs[0].add_run(c_sec)
        row[1].paragraphs[0].add_run(c_title)
        row[2].paragraphs[0].add_run(c_pg)
        for i, c in enumerate(row):
            set_cell_background(c, "F8FAFC" if i % 2 == 0 else "FFFFFF")
            set_run_font(c.paragraphs[0].runs[0], size_pt=9.5, bold=(c_sec.startswith("Chapter")), color=COLOR_TEXT)

    # =========================================================================
    # PRELIMINARY PAGE 6: LIST OF FIGURES & LIST OF TABLES
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=10)
    r = p.add_run("LIST OF FIGURES")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    for f_id, f_desc in LIST_OF_FIGURES:
        p = doc.add_paragraph()
        style_paragraph(p, space_before=2, space_after=4)
        r1 = p.add_run(f_id + ": ")
        set_run_font(r1, size_pt=10.5, bold=True, color=COLOR_NAVY)
        r2 = p.add_run(f_desc)
        set_run_font(r2, size_pt=10.5, color=COLOR_TEXT)
        
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=20, space_after=10)
    r = p.add_run("LIST OF TABLES")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    for t_id, t_desc in LIST_OF_TABLES:
        p = doc.add_paragraph()
        style_paragraph(p, space_before=1, space_after=3)
        r1 = p.add_run(t_id + ": ")
        set_run_font(r1, size_pt=10, bold=True, color=COLOR_NAVY)
        r2 = p.add_run(t_desc)
        set_run_font(r2, size_pt=10, color=COLOR_TEXT)

    # =========================================================================
    # PRELIMINARY PAGE 7: LIST OF ABBREVIATIONS & SYMBOLS
    # =========================================================================
    doc.add_page_break()
    
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=16, space_after=10)
    r = p.add_run("LIST OF ABBREVIATIONS")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    for a_code, a_exp in LIST_OF_ABBREVIATIONS:
        p = doc.add_paragraph()
        style_paragraph(p, space_before=1, space_after=2)
        p.paragraph_format.left_indent = Inches(0.2)
        r1 = p.add_run(f"{a_code:<8} — ")
        set_run_font(r1, size_pt=9.5, bold=True, color=COLOR_NAVY)
        r2 = p.add_run(a_exp)
        set_run_font(r2, size_pt=9.5, color=COLOR_TEXT)
        
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p, space_before=18, space_after=10)
    r = p.add_run("LIST OF SYMBOLS")
    set_run_font(r, size_pt=16, bold=True, color=COLOR_NAVY)
    
    for s_sym, s_def in LIST_OF_SYMBOLS:
        p = doc.add_paragraph()
        style_paragraph(p, space_before=1, space_after=2)
        p.paragraph_format.left_indent = Inches(0.2)
        r1 = p.add_run(f"{s_sym:<10} : ")
        set_run_font(r1, size_pt=9.5, bold=True, color=COLOR_AMBER)
        r2 = p.add_run(s_def)
        set_run_font(r2, size_pt=9.5, color=COLOR_TEXT)

    # =========================================================================
    # MAIN REPORT CHAPTERS (Chapters 1 to 9, each on a fresh page)
    # =========================================================================
    for sec_idx, sec in enumerate(ALL_SECTIONS):
        sec_title = sec["title"]
        print(f"  Adding {sec_title}...")
        
        doc.add_page_break()
        
        hp = doc.add_paragraph()
        style_paragraph(hp, space_before=14, space_after=10)
        hrun = hp.add_run(clean_xml_str(sec_title))
        set_run_font(hrun, size_pt=16, bold=True, color=COLOR_NAVY)
        
        p_line = doc.add_paragraph()
        style_paragraph(p_line, space_before=0, space_after=12)
        r_line = p_line.add_run("━" * 42)
        set_run_font(r_line, size_pt=9, bold=True, color=COLOR_AMBER)
        
        for sub in sec["subsections"]:
            sp = doc.add_paragraph()
            style_paragraph(sp, space_before=10, space_after=4)
            srun = sp.add_run(clean_xml_str(sub["title"]))
            set_run_font(srun, size_pt=12.5, bold=True, color=COLOR_NAVY)
            
            add_content_block(doc, sub["content"])
            
    doc.save(output_filename)
    print(f"SUCCESS: Academic Format DOCX Report built: {output_filename}")

# =========================================================================
# HTML & PDF BUILDER (Academic Format)
# =========================================================================
def format_md_table_to_html(md_table_text):
    lines = [l.strip() for l in md_table_text.strip().split("\n") if l.strip()]
    if len(lines) < 2:
        return ""
    
    headers = [c.strip() for c in lines[0].strip("|").split("|")]
    html = '<div class="table-container">\n<table class="report-table">\n<thead>\n<tr>\n'
    for h in headers:
        clean_h = h.replace("**", "").strip()
        html += f"  <th>{clean_h}</th>\n"
    html += "</tr>\n</thead>\n<tbody>\n"
    
    for row_idx, line in enumerate(lines[2:]):
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) == len(headers):
            row_class = ' class="even-row"' if row_idx % 2 == 1 else ""
            html += f"<tr{row_class}>\n"
            for c in cells:
                clean_c = c.replace("**", "").replace("`", "<code>").replace("`", "</code>").strip()
                html += f"  <td>{clean_c}</td>\n"
            html += "</tr>\n"
            
    html += "</tbody>\n</table>\n</div>\n"
    return html

def format_content_to_html(content_text):
    lines = content_text.split("\n")
    html = ""
    i = 0
    in_list = False
    
    while i < len(lines):
        line = lines[i]
        
        # Diagram
        if "[DIAGRAM:" in line:
            if in_list:
                html += "</ul>\n"
                in_list = False
            m = re.search(r'\[DIAGRAM:\s*([^\]]+)\]', line)
            if m:
                img_name = m.group(1).strip()
                caption = DIAGRAM_CAPTIONS.get(img_name, f"Figure: {img_name}")
                html += f"""<div class="diagram-wrapper">
  <img src="{img_name}" alt="{caption}" />
  <p class="diagram-caption">{caption}</p>
</div>\n"""
            i += 1
            continue
        
        # Table
        if line.strip().startswith("|") and line.strip().endswith("|"):
            if in_list:
                html += "</ul>\n"
                in_list = False
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            html += format_md_table_to_html("\n".join(table_lines))
            continue
            
        # Bullet list
        elif line.strip().startswith("- ") or line.strip().startswith("* "):
            if not in_list:
                html += '<ul class="report-list">\n'
                in_list = True
            item_text = line.strip()[2:].strip()
            item_html = ""
            tokens = item_text.split("**")
            for idx, token in enumerate(tokens):
                if idx % 2 == 1:
                    item_html += f"<strong>{token}</strong>"
                else:
                    item_html += token
            html += f"  <li>{item_html}</li>\n"
            i += 1
            continue
            
        else:
            if in_list:
                html += "</ul>\n"
                in_list = False
                
            if line.strip():
                p_text = line.strip()
                p_html = ""
                tokens = p_text.split("**")
                for idx, token in enumerate(tokens):
                    if idx % 2 == 1:
                        p_html += f"<strong>{token}</strong>"
                    else:
                        p_html += token
                html += f'<p class="report-paragraph">{p_html}</p>\n'
            i += 1
            
    if in_list:
        html += "</ul>\n"
        
    return html

def build_html_report(output_filename="RideX_Academic_Format_Project_Report.html"):
    print(f"Building Academic Format HTML report: {output_filename}...")
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RideX — A Smart Ride-Hailing and Intercity Carpooling Platform (Project Report)</title>
  <style>
    @page {{
      size: A4;
      margin: 22mm 18mm 22mm 18mm;
      @bottom-right {{
        content: counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 9pt;
        color: #64748B;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Times New Roman', Times, serif;
      color: #111827;
      background: #FFFFFF;
      line-height: 1.6;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }}

    .page-break {{
      page-break-before: always;
      break-before: page;
      margin-top: 10px;
    }}

    .cover-container {{
      text-align: center;
      padding: 30px 10px;
    }}

    .cover-title {{
      font-size: 18pt;
      font-weight: bold;
      color: #0F172A;
      margin: 0 0 16px 0;
      line-height: 1.35;
    }}

    .cover-report-tag {{
      font-size: 14pt;
      font-weight: bold;
      margin: 12px 0 16px 0;
    }}

    .cover-submitted-by {{
      font-size: 14pt;
      font-style: italic;
      font-weight: bold;
      color: #475569;
      margin: 10px 0 4px 0;
    }}

    .cover-candidate {{
      font-size: 15pt;
      font-weight: bold;
      color: #0F172A;
      margin: 4px 0 2px 0;
    }}

    .cover-uid {{
      font-size: 13pt;
      font-weight: bold;
      color: #475569;
      margin: 0 0 18px 0;
    }}

    .cover-fulfillment {{
      font-size: 13pt;
      font-style: italic;
      font-weight: bold;
      color: #475569;
      margin: 14px 0 6px 0;
    }}

    .cover-degree {{
      font-size: 15pt;
      font-weight: bold;
      color: #0F172A;
      margin: 4px 0;
    }}

    .cover-logo {{
      margin: 16px 0;
    }}

    .cover-logo img {{
      width: 140px;
      height: auto;
    }}

    .cover-univ {{
      font-size: 15pt;
      font-weight: bold;
      color: #0F172A;
      margin: 4px 0 2px 0;
    }}

    .cover-date {{
      font-size: 13.5pt;
      font-weight: bold;
      color: #475569;
      margin: 0;
    }}

    .prelim-header {{
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      color: #0F172A;
      margin: 20px 0 16px 0;
      text-transform: uppercase;
    }}

    .sec-header {{
      font-size: 16pt;
      font-weight: bold;
      color: #0F172A;
      margin-top: 10px;
      margin-bottom: 6px;
      border-bottom: 2px solid #D97706;
      padding-bottom: 4px;
    }}

    .subsec-header {{
      font-size: 12.5pt;
      font-weight: bold;
      color: #0F172A;
      margin-top: 18px;
      margin-bottom: 6px;
    }}

    .report-paragraph {{
      margin: 0 0 10px 0;
      text-align: justify;
      color: #111827;
      font-size: 11pt;
    }}

    .report-list {{
      margin: 0 0 12px 24px;
      padding: 0;
      font-size: 11pt;
      color: #111827;
    }}

    .report-list li {{
      margin-bottom: 4px;
    }}

    .diagram-wrapper {{
      text-align: center;
      margin: 20px auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .diagram-wrapper img {{
      max-width: 95%;
      height: auto;
      border: 1px solid #CBD5E1;
      border-radius: 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.06);
    }}

    .diagram-caption {{
      font-size: 9.5pt;
      font-style: italic;
      color: #475569;
      margin-top: 8px;
    }}

    .table-container {{
      margin: 14px 0;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }}

    .report-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin: 4px 0;
      background: #FFFFFF;
      font-family: 'Times New Roman', Times, serif;
    }}

    .report-table th {{
      background: #0F172A;
      color: #FFFFFF;
      font-weight: bold;
      text-align: left;
      padding: 7px 10px;
      border: 1px solid #334155;
    }}

    .report-table td {{
      padding: 6px 10px;
      border: 1px solid #CBD5E1;
      color: #111827;
      vertical-align: top;
    }}

    .report-table tr.even-row td {{
      background: #F8FAFC;
    }}

    .sig-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 40px;
    }}

    .sig-col {{
      line-height: 1.4;
    }}
  </style>
</head>
<body>

  <!-- PRELIM PAGE 1: COVER PAGE -->
  <div class="cover-container">
    <div class="cover-title">RIDEX — A SMART RIDE-HAILING AND INTERCITY CARPOOLING PLATFORM</div>
    <div class="cover-report-tag">A PROJECT REPORT</div>
    <div class="cover-submitted-by">Submitted by</div>
    <div class="cover-candidate">RAMA SATYA DURGA BHAGAVAN <span style="color:#475569; font-size:12pt;">(24BCS11975)</span></div>
    <div class="cover-candidate">MANAN PATHAK <span style="color:#475569; font-size:12pt;">(24BCS11495)</span></div>
    <div class="cover-candidate">AKSHAT GUPTA <span style="color:#475569; font-size:12pt;">(24BCS11506)</span></div>
    <div class="cover-candidate" style="margin-bottom: 16px;">RAHUL SINGH BISHT <span style="color:#475569; font-size:12pt;">(24BCS11487)</span></div>
    <div class="cover-fulfillment">in partial fulfillment for the award of the degree of</div>
    <div class="cover-degree">BACHELOR OF ENGINEERING</div>
    <div style="font-weight: bold; margin: 2px 0;">IN</div>
    <div class="cover-degree" style="margin-bottom: 14px;">COMPUTER SCIENCE AND ENGINEERING</div>
    <div class="cover-logo"><img src="cu_logo.jpg" alt="Chandigarh University" /></div>
    <div class="cover-univ">Chandigarh University</div>
    <div class="cover-date">OCTOBER 2026</div>
  </div>

  <!-- PRELIM PAGE 2: BONAFIDE CERTIFICATE -->
  <div class="page-break">
    <div class="prelim-header">BONAFIDE CERTIFICATE</div>
    <p class="report-paragraph" style="line-height: 1.7; margin-top: 24px;">
      Certified that this project report <strong>"RideX — A Smart Ride-Hailing and Intercity Carpooling Platform"</strong> 
      is the bonafide work of <strong>Rama Satya Durga Bhagavan (24BCS11975), Manan Pathak (24BCS11495), Akshat Gupta (24BCS11506), and Rahul Singh Bisht (24BCS11487)</strong> who carried out the project work 
      under my/our supervision in partial fulfillment for the award of the degree of Bachelor of Engineering 
      in Computer Science and Engineering at Chandigarh University.
    </p>

    <div class="sig-grid" style="margin-top: 60px;">
      <div class="sig-col">
        <p style="font-style: italic; color: #64748B; margin: 0;">&lt;&lt;Signature of the HoD&gt;&gt;</p>
        <p style="font-weight: bold; margin: 4px 0 24px 0;">SIGNATURE</p>
        <p style="font-weight: bold; margin: 0;">&lt;&lt;Name of the Head of the Department&gt;&gt;</p>
        <p style="font-weight: bold; color: #475569; margin: 2px 0;">HEAD OF THE DEPARTMENT</p>
        <p style="margin: 0; font-size: 10pt;">Department of Computer Science & Engineering<br>Chandigarh University</p>
      </div>
      <div class="sig-col">
        <p style="font-style: italic; color: #64748B; margin: 0;">&lt;&lt;Signature of the Supervisor&gt;&gt;</p>
        <p style="font-weight: bold; margin: 4px 0 24px 0;">SIGNATURE</p>
        <p style="font-weight: bold; margin: 0;">Shivam Sharma</p>
        <p style="font-weight: bold; color: #475569; margin: 2px 0;">SUPERVISOR</p>
        <p style="margin: 0; font-size: 10pt;">Department of Computer Science & Engineering<br>Chandigarh University</p>
      </div>
    </div>

    <div style="margin-top: 60px;">
      <p style="font-weight: bold;">Submitted for the project viva-voce examination held on ____________________</p>
      <div class="sig-grid" style="margin-top: 30px;">
        <div style="font-weight: bold;">INTERNAL EXAMINER<br><span style="font-size: 9.5pt; font-weight: normal; color: #64748B;">(Signature with Date)</span></div>
        <div style="font-weight: bold; text-align: right;">EXTERNAL EXAMINER<br><span style="font-size: 9.5pt; font-weight: normal; color: #64748B;">(Signature with Date)</span></div>
      </div>
    </div>
  </div>

  <!-- PRELIM PAGE 3: DECLARATION & ACKNOWLEDGEMENT -->
  <div class="page-break">
    <div class="prelim-header">CANDIDATE DECLARATION</div>
    <p class="report-paragraph" style="line-height: 1.6;">
      I/We hereby declare that the project report entitled <strong>"RideX — A Smart Ride-Hailing and Intercity Carpooling Platform"</strong> 
      submitted to Chandigarh University, in partial fulfillment of the requirements for the award of the degree of Bachelor of Engineering 
      in Computer Science and Engineering, is an authentic record of our original work carried out under the guidance of our project supervisor, 
      Mr. Shivam Sharma. This work has not been submitted elsewhere for the award of any degree, diploma, fellowship, or other similar title.
    </p>
    <p style="font-weight: bold; margin-top: 24px; line-height: 1.6;">
      Date: ____________________<br>
      Place: Chandigarh University, Mohali<br><br>
      Candidates:<br>
      &bull; Rama Satya Durga Bhagavan (24BCS11975)<br>
      &bull; Manan Pathak (24BCS11495)<br>
      &bull; Akshat Gupta (24BCS11506)<br>
      &bull; Rahul Singh Bisht (24BCS11487)
    </p>

    <div class="prelim-header" style="margin-top: 40px;">ACKNOWLEDGEMENT</div>
    <p class="report-paragraph" style="line-height: 1.6;">
      We express our deepest gratitude to the Department of Computer Science & Engineering, Chandigarh University, 
      for providing world-class infrastructure, laboratory facilities, and an encouraging academic environment 
      that enabled the realization of this capstone engineering project.<br><br>
      We extend our profound appreciation to our Project Supervisor, Mr. Shivam Sharma, Head of the Department, 
      and faculty members for their continuous guidance, technical critiques, and encouragement throughout the system 
      design and implementation phases of RideX. Finally, we thank our peers and families for their unwavering support.
    </p>
  </div>

  <!-- PRELIM PAGE 4: ABSTRACT & GRAPHICAL ABSTRACT -->
  <div class="page-break">
    <div class="prelim-header">ABSTRACT</div>
    <p class="report-paragraph" style="line-height: 1.55;">
      Urban transportation networks in high-density metropolitan areas suffer from monopolistic surge multipliers, 
      high driver attrition, and siloed transit modes. RideX resolves these systemic market failures by unifying 
      intra-city on-demand hailing (Bike Taxi, Auto, Cab Economy, Express Parcel) and long-distance intercity 
      carpooling into a high-performance distributed real-time platform. A core innovation of RideX is its 
      decentralized peer-to-peer fare negotiation protocol (inspired by inDrive), enabling passengers to propose 
      custom fares and nearby drivers to return real-time counter-bids. Ride claiming is guaranteed conflict-free 
      via an atomic compare-and-swap (CAS) distributed mutex locking mechanism. For long-distance journeys, a spatial 
      corridor buffering algorithm matches intermediate passengers along the driver’s route within a strict 15% 
      detour tolerance envelope. Built on a resilient stack of React 18, Express.js microservices, PostgreSQL 16 
      with PostGIS 3.4 geometric indexing, and persistent WebSocket streams delivering GPS telemetry with sub-80ms 
      latency, RideX demonstrates enterprise-grade scalability, strict financial consistency, and production reliability.
    </p>

    <div class="prelim-header" style="margin-top: 28px;">GRAPHICAL ABSTRACT</div>
    <div class="diagram-wrapper">
      <img src="diagram_hld.png" alt="Graphical Abstract" />
      <p class="diagram-caption">Graphical Abstract: End-to-End Distributed Architecture of RideX Multi-Modal Mobility Platform</p>
    </div>
  </div>

  <!-- PRELIM PAGE 5: TABLE OF CONTENTS -->
  <div class="page-break">
    <div class="prelim-header">TABLE OF CONTENTS</div>
    <div class="table-container">
      <table class="report-table">
        <thead>
          <tr>
            <th>Chapter / Section</th>
            <th>Title</th>
            <th>Page</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Prelims</td><td>Cover Page, Bonafide Certificate, Declaration, Acknowledgement</td><td>i – iv</td></tr>
          <tr class="even-row"><td>Prelims</td><td>Abstract & Graphical Abstract</td><td>v</td></tr>
          <tr><td>Prelims</td><td>List of Figures & List of Tables</td><td>vi</td></tr>
          <tr class="even-row"><td>Prelims</td><td>List of Abbreviations & Symbols</td><td>vii</td></tr>
          <tr><td><strong>Chapter 1</strong></td><td><strong>Introduction & Executive Summary</strong></td><td><strong>1</strong></td></tr>
          <tr class="even-row"><td><strong>Chapter 2</strong></td><td><strong>Scale, Capacity & Performance Engineering</strong></td><td><strong>4</strong></td></tr>
          <tr><td><strong>Chapter 3</strong></td><td><strong>Technology Stack & Infrastructure Rationale</strong></td><td><strong>6</strong></td></tr>
          <tr class="even-row"><td><strong>Chapter 4</strong></td><td><strong>High-Level Design (HLD) & Microservices</strong></td><td><strong>8</strong></td></tr>
          <tr><td><strong>Chapter 5</strong></td><td><strong>Low-Level Design (LLD) & Component Architecture</strong></td><td><strong>10</strong></td></tr>
          <tr class="even-row"><td><strong>Chapter 6</strong></td><td><strong>Core Algorithms & Mathematical Formulations</strong></td><td><strong>13</strong></td></tr>
          <tr><td><strong>Chapter 7</strong></td><td><strong>Storage Architecture & Database Design</strong></td><td><strong>15</strong></td></tr>
          <tr class="even-row"><td><strong>Chapter 8</strong></td><td><strong>Complete API Catalog & Protocol Contracts</strong></td><td><strong>22</strong></td></tr>
          <tr><td><strong>Chapter 9</strong></td><td><strong>Project Execution Schedule & 5-Week Gantt Chart</strong></td><td><strong>28</strong></td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- PRELIM PAGE 6: LIST OF FIGURES & LIST OF TABLES -->
  <div class="page-break">
    <div class="prelim-header">LIST OF FIGURES</div>
    <ul class="report-list">
"""

    for f_id, f_desc in LIST_OF_FIGURES:
        html += f'      <li><strong>{f_id}:</strong> {f_desc}</li>\n'

    html += """    </ul>

    <div class="prelim-header" style="margin-top: 24px;">LIST OF TABLES</div>
    <ul class="report-list">
"""

    for t_id, t_desc in LIST_OF_TABLES:
        html += f'      <li><strong>{t_id}:</strong> {t_desc}</li>\n'

    html += """    </ul>
  </div>

  <!-- PRELIM PAGE 7: LIST OF ABBREVIATIONS & SYMBOLS -->
  <div class="page-break">
    <div class="prelim-header">LIST OF ABBREVIATIONS</div>
    <ul class="report-list" style="list-style: none; margin-left: 0; padding-left: 0;">
"""

    for a_code, a_exp in LIST_OF_ABBREVIATIONS:
        html += f'      <li style="margin-bottom: 4px;"><strong>{a_code}</strong> &mdash; {a_exp}</li>\n'

    html += """    </ul>

    <div class="prelim-header" style="margin-top: 24px;">LIST OF SYMBOLS</div>
    <ul class="report-list" style="list-style: none; margin-left: 0; padding-left: 0;">
"""

    for s_sym, s_def in LIST_OF_SYMBOLS:
        html += f'      <li style="margin-bottom: 4px;"><strong>{s_sym}</strong> : {s_def}</li>\n'

    html += """    </ul>
  </div>
"""

    # MAIN REPORT CHAPTERS (Each on fresh page)
    for sec in ALL_SECTIONS:
        html += '  <div class="page-break">\n'
        html += f'    <h2 class="sec-header">{sec["title"]}</h2>\n'
        for sub in sec["subsections"]:
            html += f'    <h3 class="subsec-header">{sub["title"]}</h3>\n'
            html += format_content_to_html(sub["content"])
        html += '  </div>\n'

    html += """
</body>
</html>
"""

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"SUCCESS: Academic Format HTML Report built: {output_filename}")

def convert_html_to_pdf(html_path="RideX_Academic_Format_Project_Report.html", pdf_path="RideX_Academic_Format_Project_Report.pdf"):
    print("Converting Academic HTML to PDF via Edge Headless...")
    abs_html = Path(html_path).resolve()
    abs_pdf = Path(pdf_path).resolve()
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={abs_pdf}",
        str(abs_html)
    ]
    
    subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_pdf):
        size_kb = os.path.getsize(abs_pdf) / 1024
        print(f"SUCCESS: Academic Format PDF Report generated: {abs_pdf} ({size_kb:.1f} KB)")
    else:
        print("WARNING: Academic PDF conversion failed.")

if __name__ == "__main__":
    build_docx_report()
    build_html_report()
    convert_html_to_pdf()
