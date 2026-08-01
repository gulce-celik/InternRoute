"""HR Mock agent: role-specific mock interview via Gemini + RAG memory."""

from __future__ import annotations

import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.orm.attributes import flag_modified

from app.agents.llm import invoke_chat
from app.agents.targets import resolve_job_cv
from app.models.user import InterviewSession, InterviewSessionStatus, Job, User
from app.rag.retriever import build_agent_context, retrieve_cv_context
from app.rag.vectorstore.chroma_store import get_chroma_store
from app.schemas.agents import (
    InterviewSummary,
    InterviewTurn,
    MockInterviewAnswerRequest,
    MockInterviewAnswerResponse,
    MockInterviewSessionListItem,
    MockInterviewSessionResponse,
    MockInterviewStartRequest,
    MockInterviewStartResponse,
)

logger = logging.getLogger(__name__)

DEFAULT_QUESTION_LIMIT = 6

START_SYSTEM_PROMPT = """You are InternRoute's HR Mock interviewer for internship candidates.
Open a short behavioral + light role-fit interview for this specific company and role.
Respond with ONLY valid JSON (no markdown fences) using this exact shape:
{
  "question": "<first interview question>"
}
Rules:
- One clear opening question (motivation, company interest, or warm-up)
- Reference the company or role when natural
- Do not ask for personal data (age, religion, etc.)
- Keep the question concise (1–3 sentences)
"""

TURN_SYSTEM_PROMPT = """You are InternRoute's HR Mock interviewer for internship candidates.
Continue a short behavioral + light role-fit practice interview.
Respond with ONLY valid JSON (no markdown fences) using this exact shape:
{
  "feedback": "<2-4 sentences of coaching on the student's last answer>",
  "next_question": "<next question string, or null if the interview should end>",
  "done": <true|false>,
  "summary": null
}
When ending the interview (done=true or next_question=null), set summary to:
{
  "overall": "<2-4 sentence wrap-up>",
  "strengths": ["<strength>", "..."],
  "improvements": ["<improvement>", "..."],
  "practice_tips": ["<tip>", "..."]
}
Rules:
- Feedback is constructive and specific; never harsh or sarcastic
- Prefer STAR coaching when answers are vague
- Mix motivation, teamwork/STAR, and CV/role-bridge questions across the session
- You may use one adaptive follow-up that still counts toward the question budget
- Do not invent CV facts the student did not claim
- Respect remaining_questions: if it is 0, you MUST end (done=true, next_question=null, fill summary)
"""


def start_session(
    db: Session,
    user: User,
    data: MockInterviewStartRequest,
    *,
    chat_fn=None,
) -> MockInterviewStartResponse:
    job, cv, application = resolve_job_cv(
        db,
        user,
        job_id=data.job_id,
        cv_id=data.cv_id,
        application_id=data.application_id,
    )
    question_limit = _clamp_question_limit(data.question_limit)
    cv_context, rag_chunks_used = _load_cv_context(user, job, cv.id)

    user_prompt = f"""{_context_block(user, job, cv.name, cv_context)}

## Task
Ask the first interview question for this mock session (question_limit={question_limit}).
"""
    caller = chat_fn or invoke_chat
    raw = caller(user_prompt, system_prompt=START_SYSTEM_PROMPT, temperature=0.5)
    question = _parse_start_json(raw)["question"]

    now = _now_iso()
    session = InterviewSession(
        user_id=user.id,
        job_id=job.id,
        cv_id=cv.id,
        application_id=application.id if application else None,
        status=InterviewSessionStatus.ACTIVE,
        question_limit=question_limit,
        transcript=[
            {
                "role": "interviewer",
                "content": question,
                "feedback": None,
                "created_at": now,
            }
        ],
        summary=None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return MockInterviewStartResponse(
        session_id=session.id,
        job_id=job.id,
        cv_id=cv.id,
        application_id=session.application_id,
        status=session.status.value,
        question_index=1,
        question_limit=question_limit,
        question=question,
        rag_chunks_used=rag_chunks_used,
    )


def submit_answer(
    db: Session,
    user: User,
    data: MockInterviewAnswerRequest,
    *,
    chat_fn=None,
) -> MockInterviewAnswerResponse:
    session = _get_owned_session(db, user, data.session_id)
    if session.status != InterviewSessionStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is {session.status.value}; start a new practice session",
        )

    answer = data.answer.strip()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer cannot be empty",
        )

    transcript = list(session.transcript or [])
    asked = _count_interviewer_turns(transcript)
    if asked < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has no interviewer question yet",
        )

    last_question = _last_interviewer_question(transcript)
    now = _now_iso()
    transcript.append(
        {
            "role": "student",
            "content": answer,
            "feedback": None,
            "created_at": now,
        }
    )

    remaining = max(0, session.question_limit - asked)
    force_wrap = remaining <= 0

    job = session.job
    if job is None:
        job = db.query(Job).filter(Job.id == session.job_id).first()
    cv_name = session.cv.name if session.cv is not None else "cv.pdf"
    cv_context, _ = _load_cv_context(user, job, session.cv_id)

    user_prompt = f"""{_context_block(user, job, cv_name, cv_context)}

## Session
question_limit: {session.question_limit}
questions_asked_so_far: {asked}
remaining_questions_after_this_answer: {remaining}
force_end: {str(force_wrap).lower()}

## Transcript so far (including the student's latest answer)
{_format_transcript(transcript)}

## Task
Give brief coaching feedback on the latest student answer.
{"End the interview now and fill summary." if force_wrap else "If the interview should continue, ask next_question; otherwise end with summary."}
"""
    caller = chat_fn or invoke_chat
    raw = caller(user_prompt, system_prompt=TURN_SYSTEM_PROMPT, temperature=0.45)
    parsed = _parse_turn_json(raw, force_wrap=force_wrap)

    feedback = parsed["feedback"]
    # Attach feedback to the student turn just appended.
    transcript[-1]["feedback"] = feedback

    completed = force_wrap or parsed["done"] or not parsed["next_question"]
    next_question = None if completed else parsed["next_question"]
    summary_payload = parsed["summary"] if completed else None

    if completed and summary_payload is None:
        summary_payload = _fallback_summary(feedback)

    if next_question:
        transcript.append(
            {
                "role": "interviewer",
                "content": next_question,
                "feedback": None,
                "created_at": _now_iso(),
            }
        )

    session.transcript = transcript
    flag_modified(session, "transcript")

    if completed:
        session.status = InterviewSessionStatus.COMPLETED
        session.summary = summary_payload
        flag_modified(session, "summary")

    db.add(session)
    db.commit()
    db.refresh(session)

    _safe_upsert_turn(
        user_id=user.id,
        session_id=session.id,
        job_id=session.job_id,
        cv_id=session.cv_id,
        turn_index=asked,
        question=last_question,
        answer=answer,
        feedback=feedback,
    )

    question_index = _count_interviewer_turns(session.transcript or [])
    summary_model = (
        InterviewSummary(**summary_payload) if isinstance(summary_payload, dict) else None
    )

    return MockInterviewAnswerResponse(
        session_id=session.id,
        status=session.status.value,
        question_index=question_index,
        question_limit=session.question_limit,
        feedback=feedback,
        question=next_question,
        completed=completed,
        summary=summary_model,
    )


def get_session(
    db: Session,
    user: User,
    session_id: int,
) -> MockInterviewSessionResponse:
    session = _get_owned_session(db, user, session_id, with_job=True)
    return _to_session_response(session)


def list_sessions(
    db: Session,
    user: User,
    *,
    limit: int = 20,
) -> list[MockInterviewSessionListItem]:
    limit = max(1, min(limit, 50))
    rows = (
        db.query(InterviewSession)
        .options(joinedload(InterviewSession.job))
        .filter(InterviewSession.user_id == user.id)
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
        .all()
    )
    items: list[MockInterviewSessionListItem] = []
    for session in rows:
        job = session.job
        items.append(
            MockInterviewSessionListItem(
                session_id=session.id,
                job_id=session.job_id,
                cv_id=session.cv_id,
                application_id=session.application_id,
                job_title=job.title if job else "",
                job_company=job.company if job else "",
                status=session.status.value,
                question_limit=session.question_limit,
                created_at=_dt_iso(session.created_at),
            )
        )
    return items


def delete_session(db: Session, user: User, session_id: int) -> None:
    session = _get_owned_session(db, user, session_id, with_job=False)
    db.delete(session)
    db.commit()


def clear_sessions(db: Session, user: User) -> int:
    rows = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user.id)
        .all()
    )
    count = len(rows)
    for session in rows:
        db.delete(session)
    db.commit()
    return count


# ─── helpers ────────────────────────────────────────────────────


def _clamp_question_limit(value: int | None) -> int:
    if value is None:
        return DEFAULT_QUESTION_LIMIT
    return max(5, min(7, int(value)))


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _dt_iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC).isoformat()
    return value.isoformat()


def _load_cv_context(user: User, job: Job | None, cv_id: int) -> tuple[str, int]:
    if job is None:
        return (
            "(No job context available.)",
            0,
        )
    query_text = f"{job.title} at {job.company}\n{job.description}"
    try:
        chunks = retrieve_cv_context(
            user_id=user.id,
            query_text=query_text,
            cv_id=cv_id,
            top_k=6,
        )
    except Exception as exc:  # noqa: BLE001 — RAG failure should not block interview
        logger.warning("CV retrieve failed for mock interview user=%s: %s", user.id, exc)
        chunks = []
    cv_context = build_agent_context(chunks) or (
        "(No CV memory chunks found. Interview from profile and job text only.)"
    )
    return cv_context, len(chunks)


def _context_block(user: User, job: Job | None, cv_name: str, cv_context: str) -> str:
    profile_bits = [
        f"Name: {user.full_name or 'n/a'}",
        f"University: {user.university or 'n/a'}",
        f"Major: {user.major or 'n/a'}",
        f"Study year: {user.study_year if user.study_year is not None else 'n/a'}",
        f"Target sectors: {user.target_sectors or 'n/a'}",
    ]
    if job is None:
        job_block = "(Job missing.)"
    else:
        job_block = (
            f"Title: {job.title}\n"
            f"Company: {job.company}\n"
            f"Location: {job.location or 'n/a'}\n"
            f"Description:\n{job.description}"
        )
    return f"""## Student profile
{chr(10).join(profile_bits)}

## Job
{job_block}

## CV file
Filename: {cv_name}

## Relevant CV memory (RAG)
{cv_context}"""


def _format_transcript(transcript: list[dict[str, Any]]) -> str:
    lines: list[str] = []
    for turn in transcript:
        role = str(turn.get("role") or "unknown")
        content = str(turn.get("content") or "").strip()
        lines.append(f"{role.upper()}: {content}")
        feedback = turn.get("feedback")
        if feedback:
            lines.append(f"  (feedback): {feedback}")
    return "\n".join(lines) if lines else "(empty)"


def _count_interviewer_turns(transcript: list[dict[str, Any]]) -> int:
    return sum(1 for turn in transcript if turn.get("role") == "interviewer")


def _last_interviewer_question(transcript: list[dict[str, Any]]) -> str:
    for turn in reversed(transcript):
        if turn.get("role") == "interviewer":
            return str(turn.get("content") or "").strip()
    return ""


def _get_owned_session(
    db: Session,
    user: User,
    session_id: int,
    *,
    with_job: bool = True,
) -> InterviewSession:
    query = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user.id,
    )
    if with_job:
        query = query.options(
            joinedload(InterviewSession.job),
            joinedload(InterviewSession.cv),
        )
    session = query.first()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found",
        )
    return session


def _to_session_response(session: InterviewSession) -> MockInterviewSessionResponse:
    job = session.job
    turns: list[InterviewTurn] = []
    for raw in session.transcript or []:
        turns.append(
            InterviewTurn(
                role=str(raw.get("role") or ""),
                content=str(raw.get("content") or ""),
                feedback=(str(raw["feedback"]) if raw.get("feedback") is not None else None),
                created_at=(str(raw["created_at"]) if raw.get("created_at") is not None else None),
            )
        )
    summary = None
    if isinstance(session.summary, dict):
        summary = InterviewSummary(
            overall=str(session.summary.get("overall") or ""),
            strengths=_as_str_list(session.summary.get("strengths")),
            improvements=_as_str_list(session.summary.get("improvements")),
            practice_tips=_as_str_list(session.summary.get("practice_tips")),
        )
    return MockInterviewSessionResponse(
        session_id=session.id,
        job_id=session.job_id,
        cv_id=session.cv_id,
        application_id=session.application_id,
        job_title=job.title if job else "",
        job_company=job.company if job else "",
        status=session.status.value,
        question_index=_count_interviewer_turns(session.transcript or []),
        question_limit=session.question_limit,
        transcript=turns,
        summary=summary,
        created_at=_dt_iso(session.created_at),
        updated_at=_dt_iso(session.updated_at),
    )


def _as_str_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _fallback_summary(feedback: str) -> dict[str, Any]:
    return {
        "overall": feedback or "Practice session completed. Review your answers and try again.",
        "strengths": ["You completed the mock session"],
        "improvements": ["Add more concrete examples next time"],
        "practice_tips": ["Use STAR: Situation, Task, Action, Result"],
    }


def _safe_upsert_turn(
    *,
    user_id: int,
    session_id: int,
    job_id: int,
    cv_id: int,
    turn_index: int,
    question: str,
    answer: str,
    feedback: str | None,
) -> None:
    try:
        get_chroma_store().upsert_interview_turn(
            user_id=user_id,
            session_id=session_id,
            job_id=job_id,
            cv_id=cv_id,
            turn_index=turn_index,
            question=question,
            answer=answer,
            feedback=feedback,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Interview RAG upsert failed session=%s turn=%s: %s",
            session_id,
            turn_index,
            exc,
        )


def _extract_json_object(raw: str, *, label: str) -> dict[str, Any]:
    text = (raw or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{label} returned an empty response",
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
                detail=f"{label} returned non-JSON output",
            ) from None
        try:
            data = json.loads(text[start : end + 1])
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"{label} returned invalid JSON",
            ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{label} JSON must be an object",
        )
    return data


def _parse_start_json(raw: str) -> dict[str, str]:
    data = _extract_json_object(raw, label="HR Mock")
    question = str(data.get("question") or "").strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="HR Mock JSON missing question",
        )
    return {"question": question}


def _parse_turn_json(raw: str, *, force_wrap: bool) -> dict[str, Any]:
    data = _extract_json_object(raw, label="HR Mock")
    feedback = str(data.get("feedback") or "").strip()
    if not feedback:
        feedback = "Thanks for sharing — aim for a clearer example next time."

    next_raw = data.get("next_question")
    next_question = str(next_raw).strip() if next_raw is not None else ""
    if not next_question:
        next_question = None

    done = bool(data.get("done")) or force_wrap or next_question is None

    summary = None
    summary_raw = data.get("summary")
    if isinstance(summary_raw, dict):
        summary = {
            "overall": str(summary_raw.get("overall") or "").strip()
            or "Practice session completed.",
            "strengths": _as_str_list(summary_raw.get("strengths")),
            "improvements": _as_str_list(summary_raw.get("improvements")),
            "practice_tips": _as_str_list(summary_raw.get("practice_tips")),
        }

    if done:
        next_question = None
        if summary is None:
            summary = _fallback_summary(feedback)

    return {
        "feedback": feedback,
        "next_question": next_question,
        "done": done,
        "summary": summary,
    }
