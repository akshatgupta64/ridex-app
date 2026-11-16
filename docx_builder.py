# -*- coding: utf-8 -*-
"""
DOCX Builder for RideX System Design Project Report
Constructs a highly polished, academic, and production-grade Word document.
"""

import docx
import re
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from report_data import METADATA, PRELIMINARY, ABBREVIATIONS
from chapters_part1 import CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5
from chapters_part2 import CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9, CHAPTER_10
from chapters_part3 import CHAPTER_11, CHAPTER_12, CHAPTER_13, CHAPTER_14, APPENDICES

# Color Palette Constants
COLOR_NAVY = RGBColor(15, 23, 42)      # #0F172A (Deep Slate Navy)
COLOR_AMBER = RGBColor(217, 119, 6)    # #D97706 (Amber Gold Accent)
COLOR_SLATE = RGBColor(71, 85, 105)    # #475569 (Secondary Text)
COLOR_TEXT = RGBColor(30, 41, 59)      # #1E293B (Primary Text)
COLOR_MUTED = RGBColor(100, 116, 139)  # #64748B (Muted Meta)

HEX_NAVY = "0F172A"
HEX_AMBER = "D97706"
HEX_LIGHT_BG = "F8FAFC"
HEX_BORDER = "CBD5E1"
HEX_CALLOUT_BG = "F1F5F9"
HEX_CALLOUT_BORDER = "3B82F6"

def clean_xml_str(text):
    if not text:
        return ""
    s = str(text).replace("\0", "")
    return re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", s)

def set_cell_background(cell, hex_color):
    shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

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
        hrun = hp.add_run("RideX — Distributed System Design & Engineering Project Report | B.Tech CSE")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = COLOR_MUTED
        
        # Footer
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun = fp.add_run("Department of Computer Science & Engineering | Semester Project Submission")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = COLOR_MUTED

def style_paragraph(p, space_after=6, line_spacing=1.15):
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing

def add_callout(doc, text, title="SYSTEM DESIGN NOTE"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, HEX_CALLOUT_BG)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="none"/>\n'
        f'  <w:left w:val="single" w:sz="36" w:space="0" w:color="{HEX_CALLOUT_BORDER}"/>\n'
        f'  <w:bottom w:val="none"/>\n'
        f'  <w:right w:val="none"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    cp = cell.paragraphs[0]
    style_paragraph(cp, space_after=2)
    trun = cp.add_run(clean_xml_str(f"📌 {title}: "))
    trun.font.name = "Calibri"
    trun.font.size = Pt(10)
    trun.font.bold = True
    trun.font.color.rgb = RGBColor(37, 99, 235)
    
    mrun = cp.add_run(clean_xml_str(text))
    mrun.font.name = "Calibri"
    mrun.font.size = Pt(9.5)
    mrun.font.color.rgb = COLOR_TEXT
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>\n'
        f'  <w:left w:val="single" w:sz="18" w:space="0" w:color="{HEX_AMBER}"/>\n'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>\n'
        f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="{HEX_BORDER}"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)
    
    cp = cell.paragraphs[0]
    style_paragraph(cp, space_after=0, line_spacing=1.0)
    run = cp.add_run(clean_xml_str(code_text))
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(15, 23, 42)
    
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_after = Pt(4)

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
    
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        clean_h = clean_xml_str(h.replace("**", "").strip())
        cell = hdr_cells[i]
        set_cell_background(cell, HEX_NAVY)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        style_paragraph(p, space_after=0)
        run = p.add_run(clean_h)
        run.font.name = "Calibri"
        run.font.size = Pt(9.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
    
    for r_idx, row_data in enumerate(data_rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for c_idx, val in enumerate(row_data):
            cell = row_cells[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            style_paragraph(p, space_after=0)
            clean_val = clean_xml_str(val.replace("**", "").replace("`", "").strip())
            run = p.add_run(clean_val)
            run.font.name = "Calibri"
            run.font.size = Pt(9.0)
            run.font.color.rgb = COLOR_TEXT
    
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

def add_content_block(doc, text_block):
    lines = text_block.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        
        if line.strip().startswith("|") and line.strip().endswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            parse_and_add_table(doc, "\n".join(table_lines))
            continue
            
        elif line.strip().startswith("```"):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1
            add_code_block(doc, "\n".join(code_lines))
            continue
            
        else:
            if line.strip():
                p = doc.add_paragraph()
                style_paragraph(p, space_after=6)
                
                if line.strip().startswith("- ") or line.strip().startswith("* "):
                    p.paragraph_format.left_indent = Inches(0.25)
                    run_bullet = p.add_run("▪  ")
                    run_bullet.font.name = "Arial"
                    run_bullet.font.size = Pt(8)
                    run_bullet.font.color.rgb = COLOR_AMBER
                    content = line.strip()[2:]
                elif line.strip().startswith("1.") or line.strip().startswith("2.") or line.strip().startswith("3.") or line.strip().startswith("4.") or line.strip().startswith("5."):
                    parts = line.strip().split(". ", 1)
                    p.paragraph_format.left_indent = Inches(0.25)
                    run_num = p.add_run(clean_xml_str(parts[0] + ". "))
                    run_num.font.name = "Calibri"
                    run_num.font.size = Pt(10)
                    run_num.font.bold = True
                    run_num.font.color.rgb = COLOR_NAVY
                    content = parts[1] if len(parts) > 1 else ""
                else:
                    content = line.strip()
                    
                if "**" in content:
                    tokens = content.split("**")
                    for t_idx, token in enumerate(tokens):
                        r = p.add_run(clean_xml_str(token))
                        r.font.name = "Calibri"
                        r.font.size = Pt(10)
                        r.font.color.rgb = COLOR_TEXT
                        if t_idx % 2 == 1:
                            r.font.bold = True
                else:
                    r = p.add_run(clean_xml_str(content))
                    r.font.name = "Calibri"
                    r.font.size = Pt(10)
                    r.font.color.rgb = COLOR_TEXT
            i += 1

def build_docx_report(output_filename="RideX_System_Design_Project_Report.docx"):
    print(f"Generating DOCX report: {output_filename}...")
    doc = docx.Document()
    add_header_footer(doc)
    
    # COVER PAGE
    p_badge = doc.add_paragraph()
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_badge, space_after=12)
    rb = p_badge.add_run("A MAJOR SYSTEM DESIGN CAPSTONE PROJECT REPORT")
    rb.font.name = "Calibri"
    rb.font.size = Pt(11)
    rb.font.bold = True
    rb.font.color.rgb = COLOR_AMBER
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_title, space_after=8)
    rt = p_title.add_run(clean_xml_str("RideX — A Smart Ride-Hailing and\nIntercity Carpooling Platform"))
    rt.font.name = "Calibri"
    rt.font.size = Pt(26)
    rt.font.bold = True
    rt.font.color.rgb = COLOR_NAVY
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_sub, space_after=28)
    rs = p_sub.add_run(clean_xml_str("Production-Oriented Distributed Architecture, Dynamic Peer-to-Peer Fare Negotiation (inDrive Model), and Corridor Carpooling"))
    rs.font.name = "Calibri"
    rs.font.size = Pt(12)
    rs.font.color.rgb = COLOR_SLATE
    
    p_degree = doc.add_paragraph()
    p_degree.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_paragraph(p_degree, space_after=28)
    rd = p_degree.add_run(
        clean_xml_str(
            f"Submitted in partial fulfillment of the requirements for the award of the degree of\n"
            f"BACHELOR OF TECHNOLOGY\nIN\nCOMPUTER SCIENCE AND ENGINEERING\n\n"
            f"Academic Year: {METADATA['academic_year']}"
        )
    )
    rd.font.name = "Calibri"
    rd.font.size = Pt(11)
    rd.font.color.rgb = COLOR_TEXT
    
    tbl_cov = doc.add_table(rows=2, cols=2)
    tbl_cov.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_cell_background(tbl_cov.cell(0, 0), HEX_LIGHT_BG)
    set_cell_background(tbl_cov.cell(0, 1), HEX_LIGHT_BG)
    set_cell_background(tbl_cov.cell(1, 0), HEX_LIGHT_BG)
    set_cell_background(tbl_cov.cell(1, 1), HEX_LIGHT_BG)
    
    p_st = tbl_cov.cell(0, 0).paragraphs[0]
    p_st.add_run("SUBMITTED BY:\n").font.bold = True
    p_st.add_run(clean_xml_str(METADATA["student_names_placeholder"])).font.size = Pt(9.5)
    
    p_gu = tbl_cov.cell(0, 1).paragraphs[0]
    p_gu.add_run("UNDER THE GUIDANCE OF:\n").font.bold = True
    p_gu.add_run(clean_xml_str(METADATA["guide_placeholder"])).font.size = Pt(9.5)
    
    p_dep = tbl_cov.cell(1, 0).paragraphs[0]
    p_dep.add_run("DEPARTMENT:\n").font.bold = True
    p_dep.add_run(clean_xml_str(METADATA["department_placeholder"])).font.size = Pt(9.5)
    
    p_ins = tbl_cov.cell(1, 1).paragraphs[0]
    p_ins.add_run("INSTITUTION:\n").font.bold = True
    p_ins.add_run(clean_xml_str(METADATA["institution_placeholder"])).font.size = Pt(9.5)
    
    doc.add_page_break()
    
    # PRELIMINARY PAGES
    for page_title, text_content in [
        ("CERTIFICATE OF ORIGINAL WORK", PRELIMINARY["certificate"]),
        ("CANDIDATES' DECLARATION", PRELIMINARY["declaration"]),
        ("ACKNOWLEDGEMENT", PRELIMINARY["acknowledgement"]),
        ("EXECUTIVE ABSTRACT", PRELIMINARY["abstract"])
    ]:
        hp = doc.add_paragraph()
        style_paragraph(hp, space_after=14)
        hrun = hp.add_run(page_title)
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(16)
        hrun.font.bold = True
        hrun.font.color.rgb = COLOR_NAVY
        
        for p_block in text_content.split("\n\n"):
            p = doc.add_paragraph()
            style_paragraph(p, space_after=8)
            run = p.add_run(clean_xml_str(p_block.strip()))
            run.font.name = "Calibri"
            run.font.size = Pt(10)
            run.font.color.rgb = COLOR_TEXT
            
        doc.add_page_break()
        
    # Table of Abbreviations
    hp = doc.add_paragraph()
    style_paragraph(hp, space_after=14)
    hrun = hp.add_run("LIST OF ABBREVIATIONS AND ACRONYMS")
    hrun.font.name = "Calibri"
    hrun.font.size = Pt(16)
    hrun.font.bold = True
    hrun.font.color.rgb = COLOR_NAVY
    
    tbl_abbr = doc.add_table(rows=len(ABBREVIATIONS) + 1, cols=2)
    tbl_abbr.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_abbr.rows[0].cells[0].paragraphs[0].add_run("Abbreviation").font.bold = True
    tbl_abbr.rows[0].cells[1].paragraphs[0].add_run("Full Expanded Technical Term").font.bold = True
    set_cell_background(tbl_abbr.rows[0].cells[0], HEX_NAVY)
    set_cell_background(tbl_abbr.rows[0].cells[1], HEX_NAVY)
    tbl_abbr.rows[0].cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    tbl_abbr.rows[0].cells[1].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    
    for idx, (abbr, expansion) in enumerate(ABBREVIATIONS):
        row = tbl_abbr.rows[idx + 1]
        bg = "FFFFFF" if idx % 2 == 0 else "F8FAFC"
        set_cell_background(row.cells[0], bg)
        set_cell_background(row.cells[1], bg)
        c0 = row.cells[0].paragraphs[0].add_run(clean_xml_str(abbr))
        c0.font.bold = True
        c0.font.size = Pt(9.5)
        c1 = row.cells[1].paragraphs[0].add_run(clean_xml_str(expansion))
        c1.font.size = Pt(9.5)
        
    doc.add_page_break()
    
    # CHAPTERS 1 TO 14
    all_chapters = [
        CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5,
        CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9, CHAPTER_10,
        CHAPTER_11, CHAPTER_12, CHAPTER_13, CHAPTER_14
    ]
    
    for ch in all_chapters:
        ch_title = ch["title"]
        print(f"  Adding {ch_title}...")
        
        hp = doc.add_paragraph()
        style_paragraph(hp, space_after=14)
        hrun = hp.add_run(clean_xml_str(ch_title))
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(18)
        hrun.font.bold = True
        hrun.font.color.rgb = COLOR_NAVY
        
        p_div = doc.add_paragraph()
        p_div.paragraph_format.space_after = Pt(10)
        r_div = p_div.add_run("━" * 55)
        r_div.font.color.rgb = COLOR_AMBER
        
        for sec in ch["sections"]:
            sec_h = f"{sec['id']}  {sec['title']}"
            sp = doc.add_paragraph()
            style_paragraph(sp, space_after=6)
            srun = sp.add_run(clean_xml_str(sec_h))
            srun.font.name = "Calibri"
            srun.font.size = Pt(13)
            srun.font.bold = True
            srun.font.color.rgb = COLOR_NAVY
            
            add_content_block(doc, sec["content"])
            
        doc.add_page_break()
        
    # APPENDICES
    hp = doc.add_paragraph()
    style_paragraph(hp, space_after=14)
    hrun = hp.add_run("REFERENCES AND TECHNICAL BIBLIOGRAPHY")
    hrun.font.name = "Calibri"
    hrun.font.size = Pt(18)
    hrun.font.bold = True
    hrun.font.color.rgb = COLOR_NAVY
    
    for idx, ref in enumerate(APPENDICES["references"]):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.3)
        style_paragraph(p, space_after=6)
        r_num = p.add_run(f"[{idx+1}] ")
        r_num.font.bold = True
        r_num.font.color.rgb = COLOR_AMBER
        r_text = p.add_run(clean_xml_str(ref))
        r_text.font.size = Pt(9.5)
        
    hp2 = doc.add_paragraph()
    style_paragraph(hp2, space_after=14)
    hrun2 = hp2.add_run("\nTECHNICAL GLOSSARY")
    hrun2.font.name = "Calibri"
    hrun2.font.size = Pt(16)
    hrun2.font.bold = True
    hrun2.font.color.rgb = COLOR_NAVY
    
    for term, definition in APPENDICES["glossary"]:
        p = doc.add_paragraph()
        style_paragraph(p, space_after=4)
        t_run = p.add_run(clean_xml_str(f"• {term}: "))
        t_run.font.bold = True
        t_run.font.color.rgb = COLOR_NAVY
        d_run = p.add_run(clean_xml_str(definition))
        d_run.font.size = Pt(9.5)
        
    doc.save(output_filename)
    print(f"SUCCESS: DOCX Report successfully built: {output_filename}")

if __name__ == "__main__":
    build_docx_report()
