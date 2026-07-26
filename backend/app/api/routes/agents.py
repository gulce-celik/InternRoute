from fastapi import APIRouter, Depends

from app.agents.llm import gemini_status
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/status")
def agents_status(current_user: User = Depends(get_current_user)) -> dict:
    """Report whether Gemini is configured for Analyzer / Writer / Mock Interview.

    Does not call the Gemini API (no quota cost). Auth required so the key
    readiness is not exposed anonymously beyond a boolean + model name.
    """
    _ = current_user
    return gemini_status()
