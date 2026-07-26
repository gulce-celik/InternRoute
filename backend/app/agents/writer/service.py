"""Writer agent: company-aware cover letter drafts using RAG + Gemini."""

from __future__ import annotations

import json
import re
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.agents.llm import invoke_chat
from app.agents.targets import resolve_job_cv
from app.models.user import User
from app.rag.retriever import build_agent_context, retrieve_cv_context
from app.schemas.agents import CoverLetterRequest, CoverLetterResponse

SYSTEM_PROMPT = """You are InternRoute's Writer agent for students applying to internships.
Draft a sincere, specific cover letter grounded in the job listing and CV evidence.
Respond with ONLY valid JSON (no markdown fences) using this exact shape:
{
  "subject_line": "<optional short email subject or empty string>",
  "letter": "<full cover letter body, plain text with paragraph breaks>"
}
Rules:
- 250–450 words unless the notes ask otherwise
- No invented employers, degrees, or metrics not supported by the CV/profile
- Mention the company and role by name
- Sound like a capable student, not corporate marketing copy
- If CV evidence is thin, write a careful letter and keep claims modest
"""


def generate_cover_letter(
    db: Session,
    user: User,
    data: CoverLetterRequest,
    *,
    chat_fn=None,
) -> CoverLetterResponse:
    job, cv, application = resolve_job_cv(
        db,
        user,
        job_id=data.job_id,
        cv_id=data.cv_id,
        application_id=data.application_id,
    )

    query_text = f"{job.title} at {job.company}\n{job.description}"
    chunks = retrieve_cv_context(
        user_id=user.id,
        query_text=query_text,
        cv_id=cv.id,
        top_k=6,
    )
    cv_context = build_agent_context(chunks) or (
        "(No CV memory chunks found. Draft carefully from profile and filename only; "
        "do not invent experience.)"
    )

    profile_bits = [
        f"Name: {user.full_name or 'n/a'}",
        f"University: {user.university or 'n/a'}",
        f"Major: {user.major or 'n/a'}",
        f"Study year: {user.study_year if user.study_year is not None else 'n/a'}",
        f"Target sectors: {user.target_sectors or 'n/a'}",
    ]

    analysis_block = (data.analysis_summary or "").strip() or "(No analyzer summary provided.)"
    notes_block = (data.notes or "").strip() or "(None.)"
    tone = (data.tone or "professional").strip() or "professional"

    user_prompt = f"""## Student profile
{chr(10).join(profile_bits)}

## Job
Title: {job.title}
Company: {job.company}
Location: {job.location or 'n/a'}
Description:
{job.description}

## CV file
Filename: {cv.filename}

## Relevant CV memory (RAG)
{cv_context}

## Analyzer summary (optional)
{analysis_block}

## Writer notes from student
{notes_block}

## Tone
{tone}
"""

    caller = chat_fn or invoke_chat
    raw = caller(user_prompt, system_prompt=SYSTEM_PROMPT, temperature=0.4)
    parsed = _parse_cover_letter_json(raw)

    saved = False
    should_save = data.save if data.save is not None else application is not None
    if should_save and application is not None:
        application.cover_letter = parsed["letter"]
        db.add(application)
        db.commit()
        db.refresh(application)
        saved = True
    elif should_save and application is None:
        # Explicit save requested without an application — nothing to attach to.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot save cover letter without application_id",
        )

    return CoverLetterResponse(
        job_id=job.id,
        cv_id=cv.id,
        application_id=application.id if application else None,
        subject_line=parsed["subject_line"],
        letter=parsed["letter"],
        rag_chunks_used=len(chunks),
        saved=saved,
    )


def _parse_cover_letter_json(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Writer returned an empty response",
        )

    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()

    data: Any
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Model sometimes returns plain letter text — accept that.
        if len(text) > 80 and "{" not in text[:40]:
            return {"subject_line": "", "letter": text}
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Writer returned non-JSON output",
            ) from None
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Writer returned invalid JSON",
            ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Writer JSON must be an object",
        )

    letter = str(data.get("letter") or "").strip()
    if not letter:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Writer JSON missing letter text",
        )
    subject = str(data.get("subject_line") or "").strip()
    return {"subject_line": subject, "letter": letter}
