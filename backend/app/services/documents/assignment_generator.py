"""ResearchMeta AI - Academic Assignment Generation Service

Performs requirement analysis, literature-backed structured planning,
AI generation, validation, and database persistence.
"""

import re
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentVersion
from app.models.rubric import Rubric
from app.models.generation import GenerationHistory
from app.services.ai.factory import get_user_provider
from app.services.ai.base import BaseAIProvider, AIProviderError
from app.services.research.research_engine import retrieve_academic_sources

def clean_html_response(raw_text: str) -> str:
    """Strip markdown code fences and ensure clean HTML."""
    cleaned = raw_text.strip()
    # Remove ```html ... ``` or ``` ... ```
    cleaned = re.sub(r"^```(?:html)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()
    return cleaned

def calculate_word_count_from_html(html_text: str) -> int:
    """Calculate actual text word count from HTML string."""
    text_only = re.sub(r"<[^>]+>", " ", html_text)
    words = [w for w in text_only.split() if w]
    return len(words)

async def generate_academic_assignment(
    db: Session,
    user_id: str,
    title: str,
    assignment_brief: str,
    document_type: str = "Academic Essay",
    target_word_count: int = 500,
    academic_level: str = "Undergraduate",
    citation_style: str = "APA 7th",
    rubric_id: Optional[str] = None,
    project_id: Optional[str] = None,
    include_research: bool = True
) -> Dict[str, Any]:
    """
    Generate an academic assignment based on instructions and save it directly to Documents.
    """
    # 1. Fetch user AI provider
    provider = get_user_provider(db, user_id)

    # 2. Extract rubric criteria if provided
    rubric_context = ""
    if rubric_id:
        rubric = db.query(Rubric).filter(Rubric.id == rubric_id, Rubric.user_id == user_id).first()
        if rubric and rubric.criteria:
            criteria_items = []
            for c in rubric.criteria:
                name = c.get("name", "Criterion")
                desc = c.get("description", "")
                weight = c.get("weight", 1.0)
                criteria_items.append(f"- {name} (Weight: {weight}): {desc}")
            rubric_context = "Evaluation Rubric Criteria to Satisfy:\n" + "\n".join(criteria_items) + "\n\n"

    # 3. Retrieve verified academic literature if research is enabled
    research_context = ""
    retrieved_sources_count = 0
    if include_research:
        search_query = title if len(title) > 10 else assignment_brief[:80]
        sources = await retrieve_academic_sources(search_query, max_total=4)
        if sources:
            retrieved_sources_count = len(sources)
            source_lines = []
            for idx, s in enumerate(sources, 1):
                author_str = ", ".join(s.authors[:2]) + (" et al." if len(s.authors) > 2 else "")
                source_lines.append(f"[{idx}] {author_str} ({s.year or 'n.d.'}). {s.title}. {s.venue_or_journal}. DOI/URL: {s.doi_or_url}")
            research_context = (
                "Verified Scholarly References to incorporate and cite in your argument:\n" +
                "\n".join(source_lines) +
                "\n\nCite these sources parenthetically where relevant using the requested citation style.\n\n"
            )

    # 4. Construct writing plan & prompt
    system_instruction = (
        f"You are ResearchMeta AI, an elite university professor and academic writing specialist.\n"
        f"You will generate a high-scoring {document_type} at the {academic_level} academic level.\n\n"
        f"Target Length: Approximately {target_word_count} words (must be between {int(target_word_count * 0.85)} and {int(target_word_count * 1.25)} words).\n"
        f"Citation Style: {citation_style}.\n\n"
        "Strict Architectural Directives:\n"
        "1. Structure the document with clear semantic HTML tags: <h1> for document title, <h2> for main sections, <h3> for sub-arguments, <p> for body paragraphs, <blockquote> for scholarly quotations, and <ul>/<li> for lists.\n"
        "2. Include a formal Introduction with a distinct thesis statement, well-developed analytical body sections with transition sentences, a rigorous Conclusion, and a 'References' section at the end.\n"
        "3. DO NOT copy the prompt instructions into the generated paper.\n"
        "4. DO NOT use placeholder text, lorem ipsum, or repeated generic phrases.\n"
        "5. Output ONLY valid, clean HTML without any markdown backticks or outer <html>/<body> tags.\n"
    )

    user_prompt = (
        f"Assignment Title: {title}\n\n"
        f"Assignment Instructions & Requirements:\n{assignment_brief}\n\n"
        f"{rubric_context}"
        f"{research_context}"
        f"Please write the complete, polished {document_type} now in clean HTML:"
    )

    # Calculate token budget (roughly 1.6 tokens per target word + buffer)
    token_budget = max(1200, int(target_word_count * 2.2))

    # 5. Generate with AI provider
    try:
        completion = await provider.generate_completion(
            prompt=user_prompt,
            system_instruction=system_instruction,
            max_tokens=token_budget,
            temperature=0.4
        )
    except Exception as e:
        raise AIProviderError(f"Assignment generation failed: {str(e)}", provider=provider.provider_name)

    raw_html = completion.get("text", "")
    if not raw_html:
        raise AIProviderError("AI provider returned an empty response.", provider=provider.provider_name)

    # 6. Clean and validate HTML
    cleaned_html = clean_html_response(raw_html)
    actual_word_count = calculate_word_count_from_html(cleaned_html)
    char_count = len(cleaned_html)

    # 7. Persist generated Document into database
    new_doc = Document(
        user_id=user_id,
        project_id=project_id,
        title=title.strip() or "Generated Academic Assignment",
        content=cleaned_html,
        citation_style=citation_style,
        word_count=actual_word_count,
        character_count=char_count,
        current_version=1,
        is_archived=False
    )
    db.add(new_doc)
    db.flush()

    # 8. Create version snapshot
    snapshot = DocumentVersion(
        document_id=new_doc.id,
        user_id=user_id,
        version_number=1,
        title="Initial AI Generated Draft",
        notes=f"Generated via {provider.provider_name.upper()} based on assignment brief ({actual_word_count} words).",
        content=cleaned_html,
        word_count=actual_word_count,
        character_count=char_count
    )
    db.add(snapshot)

    # 9. Log in GenerationHistory
    tokens_meta = completion.get("usage", {})
    gen_log = GenerationHistory(
        user_id=user_id,
        document_id=new_doc.id,
        project_id=project_id,
        prompt_type="assignment_generation",
        prompt_summary=f"Assignment: {title} ({document_type}, target {target_word_count} words)",
        provider_used=provider.provider_name,
        model_used=completion.get("model", "default"),
        input_tokens=tokens_meta.get("prompt_tokens"),
        output_tokens=tokens_meta.get("completion_tokens"),
        total_tokens=tokens_meta.get("total_tokens")
    )
    db.add(gen_log)
    db.commit()
    db.refresh(new_doc)

    return {
        "success": True,
        "document_id": new_doc.id,
        "title": new_doc.title,
        "word_count": actual_word_count,
        "target_word_count": target_word_count,
        "citation_style": citation_style,
        "document_type": document_type,
        "provider_used": provider.provider_name,
        "retrieved_sources_count": retrieved_sources_count,
        "created_at": new_doc.created_at.isoformat() if new_doc.created_at else None
    }
