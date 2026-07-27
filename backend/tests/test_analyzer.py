import io
import json

import fitz
import pytest
from fastapi.testclient import TestClient

from app.agents.analyzer.service import _parse_analysis_json
from tests.conftest import register_verified_user


def _make_pdf_bytes(text: str = "Python FastAPI SQLAlchemy intern experience.") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    buffer = io.BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()


def _fake_analysis_json(**overrides) -> str:
    payload = {
        "fit_score": 78,
        "summary": "Solid backend match with a few tooling gaps.",
        "strengths": ["Python", "FastAPI"],
        "gaps": ["Kubernetes"],
        "keywords_to_add": ["Docker", "CI/CD"],
        "recommendations": ["Add a deployment project bullet"],
    }
    payload.update(overrides)
    return json.dumps(payload)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    return register_verified_user(client, email="analyzer@example.com", full_name="Analyzer User")


@pytest.fixture
def job_and_cv(client: TestClient, auth_headers: dict[str, str]) -> tuple[int, int]:
    job = client.post(
        "/api/v1/jobs",
        headers=auth_headers,
        json={
            "title": "Backend Intern",
            "company": "Acme",
            "description": "Python FastAPI intern role. Docker is a plus.",
            "location": "Istanbul",
            "status": "saved",
        },
    )
    assert job.status_code == 201, job.text
    upload = client.post(
        "/api/v1/cvs",
        headers=auth_headers,
        files={"file": ("resume.pdf", _make_pdf_bytes(), "application/pdf")},
    )
    assert upload.status_code == 201, upload.text
    return job.json()["id"], upload.json()["id"]


def test_parse_analysis_json_strips_fences():
    raw = "```json\n" + _fake_analysis_json() + "\n```"
    parsed = _parse_analysis_json(raw)
    assert parsed["fit_score"] == 78
    assert "Python" in parsed["strengths"]


def test_analyze_requires_auth(client: TestClient):
    response = client.post("/api/v1/agents/analyze", json={"job_id": 1, "cv_id": 1})
    assert response.status_code == 401


def test_analyze_validates_body(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/agents/analyze",
        headers=auth_headers,
        json={"job_id": 1},
    )
    assert response.status_code == 422


def test_analyze_job_cv_with_mocked_llm(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, cv_id = job_and_cv

    def _fake_chat(user_prompt: str, **kwargs) -> str:
        assert "Backend Intern" in user_prompt
        return _fake_analysis_json()

    monkeypatch.setattr("app.agents.analyzer.service.invoke_chat", _fake_chat)

    response = client.post(
        "/api/v1/agents/analyze",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["job_id"] == job_id
    assert body["cv_id"] == cv_id
    assert body["fit_score"] == 78
    assert body["strengths"] == ["Python", "FastAPI"]
    assert body["gaps"] == ["Kubernetes"]
    assert "Docker" in body["keywords_to_add"]


def test_analyze_via_application_id(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, cv_id = job_and_cv
    app_resp = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "status": "draft"},
    )
    assert app_resp.status_code == 201, app_resp.text
    application_id = app_resp.json()["id"]

    monkeypatch.setattr(
        "app.agents.analyzer.service.invoke_chat",
        lambda *args, **kwargs: _fake_analysis_json(fit_score=60),
    )

    response = client.post(
        "/api/v1/agents/analyze",
        headers=auth_headers,
        json={"application_id": application_id},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["application_id"] == application_id
    assert body["fit_score"] == 60


def test_analyze_missing_job(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    _, cv_id = job_and_cv
    monkeypatch.setattr(
        "app.agents.analyzer.service.invoke_chat",
        lambda *args, **kwargs: _fake_analysis_json(),
    )
    response = client.post(
        "/api/v1/agents/analyze",
        headers=auth_headers,
        json={"job_id": 999999, "cv_id": cv_id},
    )
    assert response.status_code == 404
