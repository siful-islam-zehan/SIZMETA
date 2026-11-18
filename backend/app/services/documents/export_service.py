"""ResearchMeta AI - Document Export Service (DOCX, PDF, TXT, MD)"""
import io
import re
from typing import Tuple
from docx import Document as DocxDocument
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

def html_to_plain_text(html_content: str) -> str:
    """Convert HTML from TipTap to clean plain text."""
    if not html_content:
        return ""
    # Replace block level breaks
    text = re.sub(r"<(?:p|div|br|h[1-6]|li)[^>]*>", "\n", html_content, flags=re.IGNORECASE)
    # Strip remaining HTML tags
    text = re.sub(r"<[^>]+>", "", text)
    # Unescape HTML entities
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"')
    # Collapse multiple consecutive empty lines
    lines = [line.strip() for line in text.split("\n")]
    return "\n".join([line for i, line in enumerate(lines) if line or (i > 0 and lines[i-1])]).strip()

def html_to_markdown(html_content: str, title: str = "") -> str:
    """Convert basic HTML structure into Markdown."""
    if not html_content:
        return f"# {title}\n\n" if title else ""
    
    md = html_content
    # Headings
    for i in range(6, 0, -1):
        md = re.sub(rf"<h{i}[^>]*>(.*?)</h{i}>", rf"\n{'#' * i} \1\n", md, flags=re.IGNORECASE | re.DOTALL)
    # Formatting
    md = re.sub(r"<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>", r"**\1**", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<(?:em|i)[^>]*>(.*?)</(?:em|i)>", r"*\1*", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<code[^>]*>(.*?)</code>", r"`\1`", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<blockquote[^>]*>(.*?)</blockquote>", r"\n> \1\n", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<li[^>]*>(.*?)</li>", r"\n- \1", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<p[^>]*>(.*?)</p>", r"\n\1\n", md, flags=re.IGNORECASE | re.DOTALL)
    md = re.sub(r"<br\s*/?>", "\n", md, flags=re.IGNORECASE)
    md = re.sub(r"<[^>]+>", "", md)
    
    # Clean whitespace
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    header = f"# {title}\n\n" if title else ""
    return header + md

class DocumentExportService:
    """Service to export documents into multiple formats."""

    @staticmethod
    def export_docx(title: str, content_html: str, citation_style: str = "APA 7th") -> bytes:
        """Export document as Microsoft Word (.docx)."""
        doc = DocxDocument()
        
        # Configure margins (1 inch standard academic)
        for section in doc.sections:
            section.top_margin = Inches(1.0)
            section.bottom_margin = Inches(1.0)
            section.left_margin = Inches(1.0)
            section.right_margin = Inches(1.0)

        # Title
        title_para = doc.add_paragraph()
        title_run = title_para.add_run(title)
        title_run.font.name = "Times New Roman"
        title_run.font.size = Pt(18)
        title_run.bold = True
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Sub-header / metadata
        meta_para = doc.add_paragraph()
        meta_run = meta_para.add_run(f"ResearchMeta AI Workspace | Citation Standard: {citation_style}")
        meta_run.font.name = "Times New Roman"
        meta_run.font.size = Pt(9)
        meta_run.font.italic = True
        meta_run.font.color.rgb = RGBColor(120, 120, 120)
        meta_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        doc.add_paragraph()  # spacer

        # Extract plain text paragraphs for clean formatting
        plain_text = html_to_plain_text(content_html)
        paragraphs = plain_text.split("\n")
        
        for p in paragraphs:
            trimmed = p.strip()
            if not trimmed:
                continue
            para = doc.add_paragraph()
            run = para.add_run(trimmed)
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)
            para.paragraph_format.line_spacing = 1.5
            para.paragraph_format.space_after = Pt(6)

        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def export_pdf(title: str, content_html: str, citation_style: str = "APA 7th") -> bytes:
        """Export document as Adobe PDF using ReportLab."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=72,  # 1 inch = 72 points
            rightMargin=72,
            topMargin=72,
            bottomMargin=72
        )

        styles = getSampleStyleSheet()
        
        # Custom academic styles
        title_style = ParagraphStyle(
            "AcademicTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            alignment=1, # Center
            spaceAfter=10
        )
        meta_style = ParagraphStyle(
            "AcademicMeta",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#666666"),
            alignment=1, # Center
            spaceAfter=20
        )
        body_style = ParagraphStyle(
            "AcademicBody",
            parent=styles["Normal"],
            fontName="Times-Roman",
            fontSize=11,
            leading=18,
            spaceAfter=12
        )

        story = []
        story.append(Paragraph(title, title_style))
        story.append(Paragraph(f"ResearchMeta AI Workspace &bull; Style: {citation_style}", meta_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1D5DB"), spaceAfter=20))

        plain_text = html_to_plain_text(content_html)
        for p in plain_text.split("\n"):
            trimmed = p.strip()
            if trimmed:
                # Escape XML chars for ReportLab
                safe_text = trimmed.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(safe_text, body_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def export_txt(title: str, content_html: str, citation_style: str = "APA 7th") -> bytes:
        """Export document as plain text (.txt)."""
        plain = html_to_plain_text(content_html)
        output = f"{title}\n"
        output += f"{'=' * len(title)}\n"
        output += f"Citation Style: {citation_style}\n"
        output += f"Generated by ResearchMeta AI\n\n"
        output += plain + "\n"
        return output.encode("utf-8")

    @staticmethod
    def export_markdown(title: str, content_html: str, citation_style: str = "APA 7th") -> bytes:
        """Export document as Markdown (.md)."""
        md = html_to_markdown(content_html, title=title)
        footer = f"\n\n---\n*Citation Style: {citation_style} | ResearchMeta AI Workspace*"
        return (md + footer).encode("utf-8")
