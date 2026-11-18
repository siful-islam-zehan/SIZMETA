"""ResearchMeta AI - Document Workspace, Autosave, and Versioning Tests"""
import pytest
from fastapi import HTTPException
from app.api.routes.documents import (
    create_document,
    get_document,
    list_documents,
    update_document,
    autosave_document,
    create_version_snapshot,
    restore_version,
    delete_document
)
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentAutosave

def test_create_document_and_metrics(db_session, test_user):
    """Test creating a document and verifying word/character metrics."""
    payload = DocumentCreate(
        title="Machine Learning in Climate Modeling",
        content="<p>Deep learning models provide accurate meteorological predictions.</p>",
        citation_style="APA 7th"
    )
    doc = create_document(payload, db_session, test_user)
    assert doc.title == "Machine Learning in Climate Modeling"
    assert doc.word_count == 7  # 7 words in sentence
    assert doc.current_version == 1
    assert len(doc.versions) == 1

def test_autosave_document(db_session, test_user):
    """Test rapid autosave endpoint without version explosion."""
    payload = DocumentCreate(title="Draft Paper")
    doc = create_document(payload, db_session, test_user)

    save_payload = DocumentAutosave(
        content="<p>This is an autosaved paragraph with eight distinct words.</p>",
        title="Draft Paper Updated Title"
    )
    res = autosave_document(doc.id, save_payload, db_session, test_user)
    assert res["success"] is True
    assert res["word_count"] == 9  # 9 words in string

    updated_doc = get_document(doc.id, db_session, test_user)
    assert updated_doc.title == "Draft Paper Updated Title"
    assert "autosaved paragraph" in updated_doc.content

def test_document_versioning_and_restore(db_session, test_user):
    """Test manual version snapshot and restoring previous versions."""
    payload = DocumentCreate(
        title="Versioned Document",
        content="<p>Version 1 content.</p>"
    )
    doc = create_document(payload, db_session, test_user)
    initial_version = doc.versions[0]

    # Explicit save with version snapshot
    update_payload = DocumentUpdate(
        content="<p>Version 2 content with new research insights.</p>",
        create_version_snapshot=True,
        version_summary="Added research insights"
    )
    updated = update_document(doc.id, update_payload, db_session, test_user)
    assert updated.current_version == 2

    # Create explicit manual checkpoint
    v3 = create_version_snapshot(doc.id, "Peer review checkpoint", db_session, test_user)
    assert v3.version_number == 3

    # Restore from initial version 1
    restored = restore_version(doc.id, initial_version.id, db_session, test_user)
    assert restored.content == "<p>Version 1 content.</p>"
    assert restored.current_version == 4  # Milestone created for restore

def test_document_isolation(db_session, test_user, other_user):
    """Verify that User B cannot access or modify User A's document."""
    doc = create_document(DocumentCreate(title="Private Doc"), db_session, test_user)
    
    with pytest.raises(HTTPException):
        get_document(doc.id, db_session, other_user)
        
    with pytest.raises(HTTPException):
        delete_document(doc.id, db_session, other_user)


def test_generate_assignment_no_key(db_session, test_user):
    """Verify that assignment generation gracefully informs user when no API key is set."""
    import asyncio
    from app.api.routes.documents import generate_assignment_endpoint
    from app.schemas.document import AssignmentGenerateRequest

    req = AssignmentGenerateRequest(
        title="Impact of Large Language Models on Scholarly Peer Review",
        assignment_brief="Write a comprehensive 500-word analysis examining the role of generative AI in scientific refereeing.",
        target_word_count=500
    )
    with pytest.raises(HTTPException) as exc:
        asyncio.run(generate_assignment_endpoint(req, db_session, test_user))
    assert exc.value.status_code == 400
    assert "Provider Error" in exc.value.detail or "API key" in exc.value.detail

