from fastapi.testclient import TestClient

from app.agents.llm import (
    GeminiNotConfiguredError,
    get_chat_model,
    message_to_text,
    usable_gemini_key,
)
from app.core.config import Settings
from tests.conftest import register_verified_user


def test_usable_gemini_key_rejects_placeholders():
    assert usable_gemini_key(None) is False
    assert usable_gemini_key("") is False
    assert usable_gemini_key("your_gemini_api_key_here") is False
    assert usable_gemini_key("AIzaSyDummyRealLookingKey123") is True


def test_message_to_text_handles_blocks():
    assert message_to_text("plain") == "plain"
    assert message_to_text([{"type": "text", "text": "OK"}]) == "OK"
    assert message_to_text(["a", {"text": "b"}]) == "ab"


def test_get_chat_model_raises_without_key():
    settings = Settings(google_api_key="", gemini_model="gemini-flash-lite-latest")
    try:
        get_chat_model(settings)
        assert False, "expected GeminiNotConfiguredError"
    except GeminiNotConfiguredError:
        pass


def test_agents_status_requires_auth(client: TestClient):
    response = client.get("/api/v1/agents/status")
    assert response.status_code == 401


def test_agents_status_reports_not_configured(client: TestClient):
    headers = register_verified_user(client, email="agents@example.com")
    response = client.get("/api/v1/agents/status", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["configured"] is False
    assert body["ready"] is False
    assert "GEMINI_API_KEY" in body["message"]
    assert body["model"]
