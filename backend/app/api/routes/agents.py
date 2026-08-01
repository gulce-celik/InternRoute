from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.agents.analyzer.service import analyze_job_cv
from app.agents.hr_mock.service import get_session, list_sessions, start_session, submit_answer
from app.agents.llm import gemini_status
from app.agents.writer.service import generate_cover_letter
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.agents import (
    AnalyzeRequest,
    AnalyzeResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    MockInterviewAnswerRequest,
    MockInterviewAnswerResponse,
    MockInterviewSessionListItem,
    MockInterviewSessionResponse,
    MockInterviewStartRequest,
    MockInterviewStartResponse,
)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/status")
def agents_status(current_user: User = Depends(get_current_user)) -> dict:
    """Report whether Gemini is configured for Analyzer / Writer / Mock Interview.

    Does not call the Gemini API (no quota cost). Auth required so the key
    readiness is not exposed anonymously beyond a boolean + model name.
    """
    _ = current_user
    return gemini_status()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    payload: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    """CV vs job gap analysis using RAG memory + Gemini."""
    return analyze_job_cv(db, current_user, payload)


@router.post("/cover-letter", response_model=CoverLetterResponse)
def cover_letter(
    payload: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CoverLetterResponse:
    """Draft a cover letter using job text, CV memory, and optional analyzer notes."""
    return generate_cover_letter(db, current_user, payload)


@router.post("/mock-interview/start", response_model=MockInterviewStartResponse)
def mock_interview_start(
    payload: MockInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MockInterviewStartResponse:
    """Start a role-specific mock HR interview session."""
    return start_session(db, current_user, payload)


@router.post("/mock-interview/answer", response_model=MockInterviewAnswerResponse)
def mock_interview_answer(
    payload: MockInterviewAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MockInterviewAnswerResponse:
    """Submit an answer; receive coaching feedback and the next question (or summary)."""
    return submit_answer(db, current_user, payload)


@router.get("/mock-interview", response_model=list[MockInterviewSessionListItem])
def mock_interview_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=20, ge=1, le=50),
) -> list[MockInterviewSessionListItem]:
    """List the current user's recent mock interview sessions."""
    return list_sessions(db, current_user, limit=limit)


@router.get("/mock-interview/{session_id}", response_model=MockInterviewSessionResponse)
def mock_interview_get(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MockInterviewSessionResponse:
    """Fetch a mock interview session transcript and summary."""
    return get_session(db, current_user, session_id)
