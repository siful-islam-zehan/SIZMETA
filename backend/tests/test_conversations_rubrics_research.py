"""ResearchMeta AI - Conversations, Rubrics, and Research Sources Tests"""
import pytest
from fastapi import HTTPException
from app.api.routes.conversations import (
    list_conversations,
    create_conversation,
    get_conversation,
    update_conversation,
    delete_conversation,
    add_message,
)
from app.api.routes.rubrics import (
    list_rubrics,
    create_rubric,
    get_rubric,
    update_rubric,
    delete_rubric,
)
from app.api.routes.research import (
    list_sources,
    add_source,
    get_source,
    delete_source,
    execute_research,
    ResearchSourceCreate,
    ResearchQueryRequest,
)
from app.schemas.conversation import ConversationCreate, ConversationUpdate, MessageCreate
from app.schemas.rubric import RubricCreate, RubricUpdate
from app.models.user import User


def test_conversation_lifecycle(db_session, test_user):
    """Test creating conversation, adding message, and retrieval."""
    conv_in = ConversationCreate(
        title="Literature Analysis on Diffusion Models",
        context_type="literature_review",
    )
    conv = create_conversation(conv_in, db_session, test_user)
    assert conv.id is not None
    assert conv.title == "Literature Analysis on Diffusion Models"
    assert conv.user_id == test_user.id

    # List conversations
    all_convs = list_conversations(db_session, test_user)
    assert any(c.id == conv.id for c in all_convs)

    # Post message
    msg_in = MessageCreate(
        content="What are the key differences between DDPM and score-based SDEs?",
        role="user",
    )
    msg = add_message(conv.id, msg_in, db_session, test_user)
    assert msg.id is not None
    assert msg.conversation_id == conv.id
    assert msg.role == "user"

    # Fetch conversation details
    detail = get_conversation(conv.id, db_session, test_user)
    assert detail.id == conv.id
    assert len(detail.messages) >= 1
    assert detail.messages[0].content == msg_in.content


def test_rubrics_lifecycle_and_versioning(db_session, test_user):
    """Test rubric creation, criteria update, version tracking, and deletion."""
    rubric_in = RubricCreate(
        title="Conference Paper Evaluation Rubric",
        description="Scoring criteria for peer-reviewed submissions",
        max_score=100.0,
        criteria=[
            {"name": "Empirical Soundness", "weight": 0.5, "description": "Sound benchmarks"},
            {"name": "Clarity of Writing", "weight": 0.5, "description": "Academic precision"},
        ],
    )
    rubric = create_rubric(rubric_in, db_session, test_user)
    assert rubric.id is not None
    assert rubric.title == "Conference Paper Evaluation Rubric"
    assert rubric.current_version == 1

    # List rubrics
    rubrics = list_rubrics(db_session, test_user)
    assert any(r.id == rubric.id for r in rubrics)

    # Update rubric
    update_in = RubricUpdate(
        title="Conference Paper Evaluation Rubric (Rev 2)",
        create_version_snapshot=True,
        criteria=[
            {"name": "Empirical Soundness", "weight": 0.4, "description": "Sound benchmarks"},
            {"name": "Clarity of Writing", "weight": 0.3, "description": "Academic precision"},
            {"name": "Reproducibility", "weight": 0.3, "description": "Open code and data"},
        ],
    )
    updated = update_rubric(rubric.id, update_in, db_session, test_user)
    assert updated.title == "Conference Paper Evaluation Rubric (Rev 2)"
    assert updated.current_version == 2
    assert len(updated.criteria) == 3

    # Delete rubric
    del_res = delete_rubric(rubric.id, db_session, test_user)
    assert "message" in del_res

    with pytest.raises(HTTPException) as exc:
        get_rubric(rubric.id, db_session, test_user)
    assert exc.value.status_code == 404


def test_research_source_lifecycle(db_session, test_user):
    """Test adding academic sources to research library and retrieving them."""
    src_in = ResearchSourceCreate(
        title="Deep Residual Learning for Image Recognition",
        authors=["He, K.", "Zhang, X.", "Ren, S.", "Sun, J."],
        publication_year=2016,
        venue_or_journal="CVPR 2016",
        doi_or_url="https://doi.org/10.1109/CVPR.2016.90",
        abstract="Deep residual networks are easier to optimize and gain accuracy from increased depth.",
        citation_key="he2016deep",
    )
    source = add_source(src_in, db_session, test_user)
    assert source.id is not None
    assert source.title == "Deep Residual Learning for Image Recognition"
    assert source.citation_key == "he2016deep"

    # List sources
    sources = list_sources(None, db_session, test_user)
    assert any(s.id == source.id for s in sources)

    # Get source
    fetched = get_source(source.id, db_session, test_user)
    assert fetched.id == source.id

    # Delete source
    del_res = delete_source(source.id, db_session, test_user)
    assert "message" in del_res

    with pytest.raises(HTTPException) as exc:
        get_source(source.id, db_session, test_user)
    assert exc.value.status_code == 404


def test_cross_user_isolation_rubrics_and_sources(db_session, test_user, other_user):
    """Ensure users cannot access or delete other users' rubrics or research sources."""
    # Create rubric for other_user
    rubric_in = RubricCreate(
        title="Other User Confidential Rubric",
        criteria=[{"name": "Quality", "weight": 1.0}],
    )
    other_rubric = create_rubric(rubric_in, db_session, other_user)

    # test_user cannot access other_user rubric
    with pytest.raises(HTTPException) as exc:
        get_rubric(other_rubric.id, db_session, test_user)
    assert exc.value.status_code == 404

    # test_user cannot delete other_user rubric
    with pytest.raises(HTTPException) as exc:
        delete_rubric(other_rubric.id, db_session, test_user)
    assert exc.value.status_code == 404

    # Create source for other_user
    src_in = ResearchSourceCreate(
        title="Confidential Research Source",
        authors=["Classified Author"],
    )
    other_source = add_source(src_in, db_session, other_user)

    # test_user cannot access other_user source
    with pytest.raises(HTTPException) as exc:
        get_source(other_source.id, db_session, test_user)
    assert exc.value.status_code == 404


def test_conversation_rename_and_delete(db_session, test_user):
    """Test renaming and deleting a conversation."""
    conv_in = ConversationCreate(title="Original Conversation Title")
    conv = create_conversation(conv_in, db_session, test_user)
    assert conv.id is not None

    # Rename
    update_in = ConversationUpdate(title="Renamed Academic Discussion")
    updated = update_conversation(conv.id, update_in, db_session, test_user)
    assert updated.title == "Renamed Academic Discussion"

    # Delete
    del_res = delete_conversation(conv.id, db_session, test_user)
    assert "message" in del_res

    with pytest.raises(HTTPException) as exc:
        get_conversation(conv.id, db_session, test_user)
    assert exc.value.status_code == 404


def test_research_query_disabled_mode(db_session, test_user):
    """Ensure research endpoint validates research_mode flag."""
    import asyncio
    req = ResearchQueryRequest(query="Quantum Key Distribution", research_mode=False)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(execute_research(req, db_session, test_user))
    assert exc.value.status_code == 400

