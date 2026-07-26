"""Analyzer agent: CV vs job gap scan using RAG + Gemini."""

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
from app.schemas.agents import AnalyzeRequest, AnalyzeResponse

SYSTEM_PROMPT = """You are InternRoute's Analyzer agent for students applying to internships.
Compare the job listing against the candidate's CV excerpts and profile.
Respond with ONLY valid JSON (no markdown fences) using this exact shape:
{
  "fit_score": <integer 0-100>,
  "summary": "<2-4 sentence overview>",
  "strengths": ["<strength>", "..."],
  "gaps": ["<missing skill or experience>", "..."],
  "keywords_to_add": ["<keyword to add on CV>", "..."],
  "recommendations": ["<actionable tip>", "..."]
}
Be specific and practical. If CV evidence is thin, say so and lower the fit_score.
"""


def analyze_job_cv(
    db: Session,
    user: User,
    data: AnalyzeRequest,
    *,
    chat_fn=None,
) -> AnalyzeResponse:
    job, cv, application = resolve_job_cv(
        db,
        user,
        job_id=data.job_id,
        cv_id=data.cv_id,
        application_id=data.application_id,
    )
    application_id = application.id if application else None

    query_text = f"{job.title} at {job.company}\n{job.description}"
    chunks = retrieve_cv_context(
        user_id=user.id,
        query_text=query_text,
        cv_id=cv.id,
        top_k=6,
    )
    cv_context = build_agent_context(chunks) or (
        "(No CV memory chunks found for this CV. Analyze from profile and filename only; "
        "note that RAG memory appears empty.)"
    )

    profile_bits = [
        f"Name: {user.full_name or 'n/a'}",
        f"University: {user.university or 'n/a'}",
        f"Major: {user.major or 'n/a'}",
        f"Study year: {user.study_year if user.study_year is not None else 'n/a'}",
        f"Target sectors: {user.target_sectors or 'n/a'}",
    ]

    user_prompt = f"""## Student profile
{chr(10).join(profile_bits)}

## Job
Title: {job.title}
Company: {job.company}
Location: {job.location or 'n/a'}
Description:
{job.description}

## CV file
Filename: {cv.name}

## Relevant CV memory (RAG)
{cv_context}
"""

    caller = chat_fn or invoke_chat
    raw = caller(user_prompt, system_prompt=SYSTEM_PROMPT, temperature=0.2)
    parsed = _parse_analysis_json(raw)

    return AnalyzeResponse(
        job_id=job.id,
        cv_id=cv.id,
        application_id=application_id,
        fit_score=parsed["fit_score"],
        summary=parsed["summary"],
        strengths=parsed["strengths"],
        gaps=parsed["gaps"],
        keywords_to_add=parsed["keywords_to_add"],
        recommendations=parsed["recommendations"],
        rag_chunks_used=len(chunks),
    )


def _parse_analysis_json(raw: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analyzer returned an empty response",
        )

    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Analyzer returned non-JSON output",
            ) from None
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Analyzer returned invalid JSON",
            ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analyzer JSON must be an object",
        )

    try:
        fit = int(data.get("fit_score", 0))
    except (TypeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Analyzer fit_score must be an integer",
        ) from exc
    fit = max(0, min(100, fit))

    def as_str_list(key: str) -> list[str]:
        value = data.get(key) or []
        if not isinstance(value, list):
            return []
        return [str(item).strip() for item in value if str(item).strip()]

    summary = str(data.get("summary") or "").strip()
    if not summary:
        summary = "Analysis completed."

    return {
        "fit_score": fit,
        "summary": summary,
        "strengths": as_str_list("strengths"),
        "gaps": as_str_list("gaps"),
        "keywords_to_add": as_str_list("keywords_to_add"),
        "recommendations": as_str_list("recommendations"),
    }
