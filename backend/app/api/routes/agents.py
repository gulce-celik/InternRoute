from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.analyzer.service import analyze_job_cv
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
