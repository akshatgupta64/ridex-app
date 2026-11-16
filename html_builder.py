# -*- coding: utf-8 -*-
"""
HTML and PDF Builder for RideX System Design Project Report
Generates RideX_System_Design_Project_Report.html and converts it to RideX_System_Design_Project_Report.pdf via Microsoft Edge headless.
"""

import os
import subprocess
from pathlib import Path

from report_data import METADATA, PRELIMINARY, ABBREVIATIONS
from chapters_part1 import CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5
from chapters_part2 import CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9, CHAPTER_10
from chapters_part3 import CHAPTER_11, CHAPTER_12, CHAPTER_13, CHAPTER_14, APPENDICES

def format_markdown_table_to_html(md_table_text):
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
                # Status badge
                if clean_c == "PASS":
                    clean_c = '<span class="badge badge-pass">PASS</span>'
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
        
        # Table
        if line.strip().startswith("|") and line.strip().endswith("|"):
            if in_list:
                html += "</ul>\n"
                in_list = False
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            html += format_markdown_table_to_html("\n".join(table_lines))
            continue
            
        # Code block
        elif line.strip().startswith("```"):
            if in_list:
                html += "</ul>\n"
                in_list = False
            lang = line.strip()[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1
            code_text = "\n".join(code_lines).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            html += f'<pre class="code-block"><code>{code_text}</code></pre>\n'
            continue
            
        # Bullet list
        elif line.strip().startswith("- ") or line.strip().startswith("* "):
            if not in_list:
                html += '<ul class="report-list">\n'
                in_list = True
            item_text = line.strip()[2:].strip()
            # replace **bold**
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
            
        # Standard paragraph or numbered list
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
    print(f"Generating HTML report: {output_filename}...")
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{METADATA['project_title']} — System Design Project Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {{
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {{
        content: counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8.5pt;
        color: #64748B;
      }}
    }}

    * {{
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }}

    /* Cover Page */
    .cover-container {{
      background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%);
      color: #FFFFFF;
      padding: 40px 32px;
      border-radius: 14px;
      margin-bottom: 30px;
      border-left: 8px solid #F59E0B;
      page-break-after: always;
    }}

    .cover-badge {{
      display: inline-block;
      background: #F59E0B;
      color: #0F172A;
      font-size: 9pt;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 4px;
      letter-spacing: 1px;
      margin-bottom: 16px;
      text-transform: uppercase;
    }}

    .cover-title {{
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.2;
      margin: 0 0 10px 0;
      color: #FFFFFF;
    }}

    .cover-subtitle {{
      font-size: 13pt;
      font-weight: 400;
      color: #CBD5E1;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }}

    .cover-degree {{
      font-size: 11pt;
      color: #E2E8F0;
      margin-bottom: 30px;
      line-height: 1.5;
    }}

    .cover-meta-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 20px;
      border-radius: 8px;
    }}

    .meta-box h6 {{
      margin: 0 0 4px 0;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #F59E0B;
      font-weight: 700;
    }}

    .meta-box p {{
      margin: 0;
      font-size: 10pt;
      color: #F8FAFC;
    }}

    /* Section & Chapter Typography */
    .page-break {{
      page-break-before: always;
    }}

    .preliminary-header, .chapter-header {{
      font-size: 18pt;
      font-weight: 800;
      color: #0F172A;
      margin-top: 24px;
      margin-bottom: 6px;
      border-bottom: 2.5px solid #F59E0B;
      padding-bottom: 6px;
    }}

    .section-header {{
      font-size: 12.5pt;
      font-weight: 700;
      color: #0F172A;
      margin-top: 18px;
      margin-bottom: 8px;
    }}

    .report-paragraph {{
      margin: 0 0 10px 0;
      text-align: justify;
      color: #1E293B;
      font-size: 9.5pt;
    }}

    .report-list {{
      margin: 0 0 12px 18px;
      padding: 0;
      font-size: 9.5pt;
      color: #1E293B;
    }}

    .report-list li {{
      margin-bottom: 4px;
    }}

    /* Tables */
    .table-container {{
      margin: 12px 0;
      overflow-x: auto;
    }}

    .report-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 6px 0;
      background: #FFFFFF;
    }}

    .report-table th {{
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 7px 9px;
      border: 1px solid #334155;
    }}

    .report-table td {{
      padding: 6px 9px;
      border: 1px solid #E2E8F0;
      color: #1E293B;
      vertical-align: top;
    }}

    .report-table tr.even-row td {{
      background: #F8FAFC;
    }}

    .badge-pass {{
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #10B981;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 7.5pt;
    }}

    /* Code Blocks */
    .code-block {{
      background: #0F172A;
      color: #F8FAFC;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 8pt;
      padding: 12px;
      border-radius: 6px;
      border-left: 4px solid #F59E0B;
      overflow-x: auto;
      margin: 10px 0;
      line-height: 1.4;
    }}

    /* Signature lines */
    .sig-table {{
      width: 100%;
      margin-top: 50px;
      border: none;
    }}

    .sig-table td {{
      border: none;
      vertical-align: top;
      padding: 0;
      font-size: 9.5pt;
    }}
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-container">
    <div class="cover-badge">Major Capstone System Design Project Report</div>
    <h1 class="cover-title">{METADATA['project_title']}</h1>
    <p class="cover-subtitle">{METADATA['project_subtitle']}</p>
    <div class="cover-degree">
      Submitted in partial fulfillment of the requirements for the award of the degree of<br>
      <strong>BACHELOR OF TECHNOLOGY IN COMPUTER SCIENCE & ENGINEERING</strong><br>
      Academic Year: {METADATA['academic_year']}
    </div>
    
    <div class="cover-meta-grid">
      <div class="meta-box">
        <h6>Submitted By:</h6>
        <p>{METADATA['student_names_placeholder']}</p>
      </div>
      <div class="meta-box">
        <h6>Project Guide / Supervisor:</h6>
        <p>{METADATA['guide_placeholder']}</p>
      </div>
      <div class="meta-box">
        <h6>Department:</h6>
        <p>{METADATA['department_placeholder']}</p>
      </div>
      <div class="meta-box">
        <h6>Institution:</h6>
        <p>{METADATA['institution_placeholder']}</p>
      </div>
    </div>
  </div>

  <!-- CERTIFICATE -->
  <div class="page-break"></div>
  <h2 class="preliminary-header">CERTIFICATE OF ORIGINAL WORK</h2>
  {format_content_to_html(PRELIMINARY['certificate'])}

  <!-- DECLARATION -->
  <div class="page-break"></div>
  <h2 class="preliminary-header">CANDIDATES' DECLARATION</h2>
  {format_content_to_html(PRELIMINARY['declaration'])}

  <!-- ACKNOWLEDGEMENT -->
  <div class="page-break"></div>
  <h2 class="preliminary-header">ACKNOWLEDGEMENT</h2>
  {format_content_to_html(PRELIMINARY['acknowledgement'])}

  <!-- ABSTRACT -->
  <div class="page-break"></div>
  <h2 class="preliminary-header">EXECUTIVE ABSTRACT</h2>
  {format_content_to_html(PRELIMINARY['abstract'])}

  <!-- ABBREVIATIONS -->
  <div class="page-break"></div>
  <h2 class="preliminary-header">LIST OF ABBREVIATIONS AND ACRONYMS</h2>
  <div class="table-container">
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 25%;">Abbreviation</th>
        <th>Expanded Technical Definition</th>
      </tr>
    </thead>
    <tbody>
"""
    for idx, (abbr, expansion) in enumerate(ABBREVIATIONS):
        row_cls = ' class="even-row"' if idx % 2 == 1 else ""
        html += f'      <tr{row_cls}><td><strong>{abbr}</strong></td><td>{expansion}</td></tr>\n'
    html += """    </tbody>
  </table>
  </div>
"""

    # CHAPTERS 1 TO 14
    all_chapters = [
        CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5,
        CHAPTER_6, CHAPTER_7, CHAPTER_8, CHAPTER_9, CHAPTER_10,
        CHAPTER_11, CHAPTER_12, CHAPTER_13, CHAPTER_14
    ]

    for ch in all_chapters:
        html += f"""
  <!-- {ch['title']} -->
  <div class="page-break"></div>
  <h2 class="chapter-header">{ch['title']}</h2>
"""
        for sec in ch["sections"]:
            html += f'  <h3 class="section-header">{sec["id"]} {sec["title"]}</h3>\n'
            html += format_content_to_html(sec["content"])

    # REFERENCES
    html += """
  <!-- REFERENCES -->
  <div class="page-break"></div>
  <h2 class="chapter-header">REFERENCES AND TECHNICAL BIBLIOGRAPHY</h2>
  <ol class="report-list" style="margin-left: 24px;">
"""
    for ref in APPENDICES["references"]:
        html += f"    <li>{ref}</li>\n"
    html += """  </ol>

  <h3 class="section-header" style="margin-top: 24px;">TECHNICAL GLOSSARY</h3>
  <div class="table-container">
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 30%;">Technical Term</th>
        <th>Engineering Definition</th>
      </tr>
    </thead>
    <tbody>
"""
    for idx, (term, definition) in enumerate(APPENDICES["glossary"]):
        row_cls = ' class="even-row"' if idx % 2 == 1 else ""
        html += f'      <tr{row_cls}><td><strong>{term}</strong></td><td>{definition}</td></tr>\n'
    html += """    </tbody>
  </table>
  </div>
</body>
</html>
"""

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(html)
        
    print(f"SUCCESS: HTML Report successfully built: {output_filename}")

def convert_html_to_pdf(html_path="RideX_System_Design_Project_Report.html", pdf_path="RideX_System_Design_Project_Report.pdf"):
    print(f"Converting HTML to PDF via Microsoft Edge headless...")
    abs_html = Path(html_path).resolve()
    abs_pdf = Path(pdf_path).resolve()
    
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    if not os.path.exists(edge_path):
        edge_path = r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
        
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        f"--print-to-pdf={abs_pdf}",
        str(abs_html)
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_pdf):
        size_kb = os.path.getsize(abs_pdf) / 1024
        print(f"SUCCESS: PDF Report successfully generated: {abs_pdf} ({size_kb:.1f} KB)")
    else:
        print(f"WARNING: PDF conversion failed: {res.stderr}")

if __name__ == "__main__":
    build_html_report()
    convert_html_to_pdf()
