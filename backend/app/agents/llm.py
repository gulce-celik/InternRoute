"""Shared Gemini chat client for Sprint 3 agents.

Embeddings may fall back to a local hash embedder when the API key is missing.
Agent chat must not: call ``require_chat_model()`` / ``invoke_chat()`` instead.
"""

from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status

from app.core.config import Settings, get_settings


class GeminiNotConfiguredError(RuntimeError):
    """Raised when GEMINI_API_KEY is missing or still a placeholder."""


def usable_gemini_key(api_key: str | None) -> bool:
    if not api_key:
        return False
    normalized = api_key.strip().lower()
    if not normalized or normalized.startswith("your_"):
        return False
    if normalized in {"changeme", "change-me", "test", "dummy"}:
        return False
    return True


def gemini_status(settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or get_settings()
    configured = usable_gemini_key(settings.google_api_key)
    return {
        "configured": configured,
        "model": settings.gemini_model,
        "ready": configured,
        "message": (
            "Gemini chat is ready."
            if configured
            else "Set a real GEMINI_API_KEY in .env (not a placeholder) to use AI agents."
        ),
    }


def get_chat_model(settings: Settings | None = None, *, temperature: float = 0.2):
    """Return a LangChain ChatGoogleGenerativeAI client, or raise if not configured."""
    settings = settings or get_settings()
    if not usable_gemini_key(settings.google_api_key):
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is missing or still a placeholder. "
            "Copy .env.example to .env and set a real key from Google AI Studio."
        )

    from langchain_google_genai import ChatGoogleGenerativeAI

    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=temperature,
    )


def require_chat_model(settings: Settings | None = None, *, temperature: float = 0.2):
    """FastAPI-friendly wrapper: 503 when Gemini is not configured."""
    try:
        return get_chat_model(settings, temperature=temperature)
    except GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def message_to_text(content: Any) -> str:
    """Normalize LangChain message content (str or content blocks) to plain text."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("text") is not None:
                parts.append(str(block["text"]))
            elif hasattr(block, "text"):
                parts.append(str(block.text))
            else:
                parts.append(str(block))
        return "".join(parts)
    return str(content)


def invoke_chat(
    user_prompt: str,
    *,
    system_prompt: str | None = None,
    temperature: float = 0.2,
    settings: Settings | None = None,
) -> str:
    """Run a one-shot chat completion and return plain text.

    Raises ``HTTPException`` 503 if the key is missing, or 502 if the API call fails.
    """
    llm = require_chat_model(settings, temperature=temperature)
    messages: list[tuple[str, str]] = []
    if system_prompt:
        messages.append(("system", system_prompt))
    messages.append(("user", user_prompt))

    try:
        response = llm.invoke(messages)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini request failed: {exc}",
        ) from exc

    return message_to_text(getattr(response, "content", response)).strip()
