# -*- coding: utf-8 -*-
"""
Build Clean Report: Generates RideX_System_Design_Project_Report.docx, .html, and .pdf.
Professional, production-grade system design report in Times New Roman.
Includes high-resolution diagrams, clean math notation, section-level page breaks,
and strictly no code dumps or student signature sheets.
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

from clean_report_data import METADATA, ALL_SECTIONS

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

DIAGRAM_CAPTIONS = {
    "diagram_hld.png": "Figure 4.1: RideX High-Level Microservices & Distributed Real-Time Architecture",
    "diagram_bidding_flowchart.png": "Figure 5.1: RideX inDrive-Style Peer-to-Peer Dynamic Bidding Negotiation Protocol",
    "diagram_state_machine.png": "Figure 5.2: RideX Finite State Machine (FSM) Lifecycle & Mutex State Transitions",
    "diagram_carpool_corridor.png": "Figure 6.1: RideX Intercity Corridor Spatial Buffering & 15% Detour Tolerance Geometry",
    "diagram_gantt_chart.png": "Figure 9.1: RideX Engineering Implementation Schedule (5 Phases across 5 Weeks)"
}

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
        hrun = hp.add_run("RideX — Smart Ride-Hailing & Intercity Carpooling System Design")
        set_run_font(hrun, size_pt=9, italic=True, color=COLOR_MUTED)
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Production System Design & Scalability Engineering Report")
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

def build_docx_report(output_filename="RideX_System_Design_Project_Report.docx"):
    print(f"Building clean DOCX report: {output_filename}...")
    doc = docx.Document()
    
    # Configure document default font style
    style_normal = doc.styles['Normal']
    style_normal.font.name = FONT_PRIMARY
    style_normal.font.size = Pt(11)
    
    add_header_footer(doc)
    
    # -----------------------------------------------------------------
    # ELEGANT TITLE COVER HEADER (No student signature sheets)
    # -----------------------------------------------------------------
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_title, space_before=36, space_after=8)
    rt = p_title.add_run("RideX — Smart Ride-Hailing & Intercity Carpooling\nSystem Design")
    set_run_font(rt, size_pt=24, bold=True, color=COLOR_NAVY)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_sub, space_before=4, space_after=24)
    rs = p_sub.add_run(
        "A Distributed Architecture and System Design Specification for Multi-Modal Mobility,\n"
        "Dynamic Peer-to-Peer Fare Negotiation, and High-Throughput Real-Time Telematics"
    )
    set_run_font(rs, size_pt=12, italic=True, color=COLOR_SLATE)
    
    p_div = doc.add_paragraph()
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_div, space_before=8, space_after=28)
    r_div = p_div.add_run("─" * 48)
    set_run_font(r_div, size_pt=11, color=COLOR_AMBER)
    
    # -----------------------------------------------------------------
    # ALL MAIN SECTIONS (Each section on a new page)
    # -----------------------------------------------------------------
    for sec_idx, sec in enumerate(ALL_SECTIONS):
        sec_title = sec["title"]
        print(f"  Adding {sec_title}...")
        
        # Each main section starts on a new page
        doc.add_page_break()
        
        hp = doc.add_paragraph()
        style_paragraph(hp, space_before=12, space_after=10)
        hrun = hp.add_run(clean_xml_str(sec_title))
        set_run_font(hrun, size_pt=16, bold=True, color=COLOR_NAVY)
        
        # Decorative underline bar for section header
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
    print(f"SUCCESS: Clean DOCX Report successfully built: {output_filename}")

# -------------------------------------------------------------------------
# HTML & PDF BUILDER
# -------------------------------------------------------------------------
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

def build_html_report(output_filename="RideX_System_Design_Project_Report.html"):
    print(f"Building clean HTML report: {output_filename}...")
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{METADATA['title']}</title>
  <style>
    @page {{
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
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

    .cover-header {{
      text-align: center;
      padding: 60px 20px 40px 20px;
      margin-bottom: 20px;
      page-break-after: always;
      break-after: page;
    }}

    .doc-title {{
      font-size: 26pt;
      font-weight: bold;
      line-height: 1.25;
      margin: 0 0 16px 0;
      color: #0F172A;
    }}

    .doc-subtitle {{
      font-size: 13pt;
      font-style: italic;
      color: #475569;
      max-width: 780px;
      margin: 0 auto 30px auto;
      line-height: 1.45;
    }}

    .title-divider {{
      width: 180px;
      height: 2px;
      background: #D97706;
      margin: 0 auto;
    }}

    .main-section {{
      page-break-before: always;
      break-before: page;
      margin-top: 10px;
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
      margin: 22px auto;
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
  </style>
</head>
<body>

  <!-- CLEAN TITLE COVER -->
  <div class="cover-header">
    <h1 class="doc-title">{METADATA['title']}</h1>
    <p class="doc-subtitle">
      A Distributed Architecture and System Design Specification for Multi-Modal Mobility,<br>
      Dynamic Peer-to-Peer Fare Negotiation, and High-Throughput Real-Time Telematics
    </p>
    <div class="title-divider"></div>
  </div>
"""

    for sec in ALL_SECTIONS:
        html += '  <div class="main-section">\n'
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
        
    print(f"SUCCESS: Clean HTML Report built: {output_filename}")

def convert_html_to_pdf(html_path="RideX_System_Design_Project_Report.html", pdf_path="RideX_System_Design_Project_Report.pdf"):
    print("Converting Clean HTML to PDF via Edge Headless...")
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
        print(f"SUCCESS: Clean PDF Report generated: {abs_pdf} ({size_kb:.1f} KB)")
    else:
        print("WARNING: PDF conversion failed.")

if __name__ == "__main__":
    build_docx_report()
    build_html_report()
    convert_html_to_pdf()
