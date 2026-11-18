"""ResearchMeta AI - Conversations, Live Chatbot & History Routes"""
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.conversation import Conversation, Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationRead,
    ChatQueryRequest,
    MessageCreate,
    MessageRead
)
from app.services.ai.factory import get_user_provider
from app.services.ai.base import AIProviderError
from app.services.research.research_engine import retrieve_academic_sources

router = APIRouter(prefix="/conversations", tags=["Conversations"])

@router.get("", response_model=List[ConversationRead])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """List all research conversations for the user."""
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

@router.post("", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new research conversation."""
    conversation = Conversation(
        user_id=current_user.id,
        project_id=conv_in.project_id,
        title=conv_in.title or "Academic Inquiry",
        context_type=conv_in.context_type
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@router.get("/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get conversation details with all messages."""
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation

@router.patch("/{conversation_id}", response_model=ConversationRead)
def update_conversation(
    conversation_id: str,
    conv_update: ConversationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update conversation title or metadata."""
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    if conv_update.title is not None and conv_update.title.strip():
        conversation.title = conv_update.title.strip()
    
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(conversation)
    return conversation

@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a conversation and all its messages."""
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted successfully"}

@router.post("/{conversation_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def add_message(
    conversation_id: str,
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Add a manual message to a conversation."""
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    message = Message(
        conversation_id=conversation.id,
        user_id=current_user.id,
        role=msg_in.role,
        content=msg_in.content,
        model_used=msg_in.model_used,
        provider_used=msg_in.provider_used,
        token_count=msg_in.token_count,
        metadata_json=msg_in.metadata_json or {}
    )
    db.add(message)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(message)
    return message

@router.post("/{conversation_id}/chat", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def chat_with_assistant(
    conversation_id: str,
    chat_req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Submit a user message, run academic AI inference (with optional live research retrieval),
    and save both the prompt and the assistant's reply.
    """
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    user_text = chat_req.content.strip()

    # 1. Save user's message
    user_msg = Message(
        conversation_id=conversation.id,
        user_id=current_user.id,
        role="user",
        content=user_text,
        metadata_json={"include_research": chat_req.include_research}
    )
    db.add(user_msg)
    db.flush()

    # 2. If Research Mode is enabled, retrieve verified literature
    research_context = ""
    citations_meta = []
    if chat_req.include_research:
        sources = await retrieve_academic_sources(user_text, max_total=3)
        if sources:
            source_lines = []
            for idx, s in enumerate(sources, 1):
                author_str = ", ".join(s.authors[:2]) + (" et al." if len(s.authors) > 2 else "")
                source_lines.append(f"[{idx}] {author_str} ({s.year or 'n.d.'}). {s.title}. {s.venue_or_journal}. DOI/URL: {s.doi_or_url}")
                citations_meta.append({
                    "title": s.title,
                    "url": s.doi_or_url,
                    "authors": s.authors,
                    "year": s.year,
                    "credibility": s.credibility_score
                })
            research_context = (
                "\n\n[Grounded Scholarly Literature from arXiv/Crossref]:\n" +
                "\n".join(source_lines) +
                "\nCite these sources parenthetically when relevant.\n"
            )

    # 3. Retrieve conversational memory (last 8 messages)
    history_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id, Message.id != user_msg.id)
        .order_by(Message.created_at.asc())
        .all()
    )[-8:]

    history_text = ""
    if history_messages:
        lines = []
        for m in history_messages:
            prefix = "Scholar" if m.role == "user" else "Assistant"
            lines.append(f"{prefix}: {m.content}")
        history_text = "Prior Conversation History:\n" + "\n".join(lines) + "\n\n"

    # 4. Resolve AI provider
    try:
        provider = get_user_provider(db, current_user.id)
    except AIProviderError as e:
        # Informative error returned if no key configured
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"AI Provider Not Configured: {e.message}. Please configure your API key in Settings."
        )

    system_instruction = (
        "You are ResearchMeta AI, an elite academic research assistant and writing mentor. "
        "Your role is to help scholars explore research topics, synthesize literature, outline academic arguments, "
        "critique methodologies, and refine scholarly prose. "
        "Rules:\n"
        "1. Write with intellectual clarity, academic precision, and objective tone.\n"
        "2. Use clean markdown formatting (headings, bullet points, bold key terms, and code blocks for algorithms/math).\n"
        "3. When referencing scholarly literature, cite accurately.\n"
        "4. If answering questions about assignments, guide the user on structure, evidence, and critical thinking."
    )

    full_prompt = (
        f"{history_text}"
        f"Scholar's Query: {user_text}"
        f"{research_context}"
    )

    # 5. Execute generation
    try:
        completion = await provider.generate_completion(
            prompt=full_prompt,
            system_instruction=system_instruction,
            max_tokens=1800,
            temperature=0.4
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{provider.provider_name.upper()} Generation Error: {str(e)}"
        )

    assistant_text = completion.get("text", "")
    if not assistant_text:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI provider returned an empty response. Please retry."
        )

    # 6. Save assistant message to database
    tokens_meta = completion.get("usage", {})
    assistant_msg = Message(
        conversation_id=conversation.id,
        user_id=current_user.id,
        role="assistant",
        content=assistant_text,
        model_used=completion.get("model", "default"),
        provider_used=provider.provider_name,
        token_count=tokens_meta.get("total_tokens"),
        metadata_json={"citations": citations_meta}
    )
    db.add(assistant_msg)

    # Update conversation title if default
    if conversation.title == "Academic Inquiry" and len(user_text) > 4:
        # Generate a short 4-6 word title from the user prompt
        clean_words = user_text.split()[:5]
        conversation.title = " ".join(clean_words)

    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg
