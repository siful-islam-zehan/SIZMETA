"""ResearchMeta AI - Document Export Service Tests"""
import pytest
from app.services.documents.export_service import DocumentExportService, html_to_plain_text, html_to_markdown
from app.api.routes.documents import create_document
from app.api.routes.export import export_document
from app.schemas.document import DocumentCreate
from app.schemas.export import ExportFormat

def test_html_cleaning_utilities():
    """Verify HTML stripping and Markdown conversion."""
    html = "<h1>Abstract</h1><p>This is <strong>important</strong> research.</p>"
    plain = html_to_plain_text(html)
    assert "Abstract" in plain
    assert "important research" in plain
    assert "<" not in plain

    md = html_to_markdown(html, title="Paper Title")
    assert "# Paper Title" in md
    assert "**important**" in md

def test_export_document_formats(db_session, test_user):
    """Test exporting documents to all 4 supported formats."""
    doc = create_document(DocumentCreate(
        title="Empirical Study of Deep Architectures",
        content="<h1>Introduction</h1><p>Neural networks have transformed contemporary scientific discovery.</p>"
    ), db_session, test_user)

    # 1. Export as DOCX
    docx_resp = export_document(doc.id, ExportFormat.DOCX, db_session, test_user)
    assert docx_resp.status_code == 200
    assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in docx_resp.media_type
    assert len(docx_resp.body) > 1000

    # 2. Export as PDF
    pdf_resp = export_document(doc.id, ExportFormat.PDF, db_session, test_user)
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.media_type
    assert pdf_resp.body.startswith(b"%PDF")
    assert len(pdf_resp.body) > 1000

    # 3. Export as Markdown
    md_resp = export_document(doc.id, ExportFormat.MARKDOWN, db_session, test_user)
    assert md_resp.status_code == 200
    assert "text/markdown" in md_resp.media_type
    text_content = md_resp.body.decode("utf-8")
    assert "# Empirical Study of Deep Architectures" in text_content
    assert "Neural networks have transformed" in text_content

    # 4. Export as TXT
    txt_resp = export_document(doc.id, ExportFormat.TXT, db_session, test_user)
    assert txt_resp.status_code == 200
    assert "text/plain" in txt_resp.media_type
    txt_content = txt_resp.body.decode("utf-8")
    assert "Empirical Study of Deep Architectures" in txt_content
