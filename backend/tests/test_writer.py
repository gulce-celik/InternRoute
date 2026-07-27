import io
import json

import fitz
import pytest
from fastapi.testclient import TestClient

from app.agents.writer.service import _parse_cover_letter_json
from tests.conftest import register_verified_user


def _make_pdf_bytes(text: str = "Python FastAPI SQLAlchemy intern experience.") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    buffer = io.BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()


def _fake_letter_json(**overrides) -> str:
    payload = {
        "subject_line": "Application for Backend Intern",
        "letter": (
            "Dear Hiring Team,\n\n"
            "I am writing to apply for the Backend Intern role at Acme. "
            "My coursework and projects with Python and FastAPI prepared me to contribute quickly.\n\n"
            "Thank you for your consideration.\n\n"
            "Sincerely,\nAnalyzer User"
        ),
    }
    payload.update(overrides)
    return json.dumps(payload)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    return register_verified_user(client, email="writer@example.com", full_name="Writer User")


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
            "status": "applied",
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


def test_parse_cover_letter_json_and_plain_text():
    parsed = _parse_cover_letter_json(_fake_letter_json())
    assert "Backend Intern" in parsed["subject_line"]
    assert "Acme" in parsed["letter"]

    plain = _parse_cover_letter_json(
        "Dear Team,\n\n" + ("I would like to apply for this internship. " * 8) + "\n\nBest,\nEnes"
    )
    assert plain["letter"].startswith("Dear Team")


def test_cover_letter_requires_auth(client: TestClient):
    response = client.post("/api/v1/agents/cover-letter", json={"job_id": 1, "cv_id": 1})
    assert response.status_code == 401


def test_cover_letter_validates_body(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/agents/cover-letter",
        headers=auth_headers,
        json={"job_id": 1},
    )
    assert response.status_code == 422


def test_cover_letter_job_cv_without_save(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, cv_id = job_and_cv
    monkeypatch.setattr(
        "app.agents.writer.service.invoke_chat",
        lambda *args, **kwargs: _fake_letter_json(),
    )

    response = client.post(
        "/api/v1/agents/cover-letter",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "tone": "warm"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["job_id"] == job_id
    assert body["cv_id"] == cv_id
    assert body["saved"] is False
    assert "Acme" in body["letter"]
    assert body["subject_line"]


def test_cover_letter_saves_on_application(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
    db,
):
    from app.models.user import Application

    job_id, cv_id = job_and_cv
    app_resp = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "status": "draft"},
    )
    assert app_resp.status_code == 201, app_resp.text
    application_id = app_resp.json()["id"]

    monkeypatch.setattr(
        "app.agents.writer.service.invoke_chat",
        lambda *args, **kwargs: _fake_letter_json(letter="Saved letter for Acme Backend Intern."),
    )

    response = client.post(
        "/api/v1/agents/cover-letter",
        headers=auth_headers,
        json={
            "application_id": application_id,
            "analysis_summary": "Strong Python fit; mention FastAPI projects.",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["application_id"] == application_id
    assert body["saved"] is True
    assert "Saved letter" in body["letter"]

    db.expire_all()
    stored = db.get(Application, application_id)
    assert stored is not None
    assert stored.cover_letter is not None
    assert "Saved letter" in stored.cover_letter


def test_cover_letter_save_without_application_fails(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, cv_id = job_and_cv
    monkeypatch.setattr(
        "app.agents.writer.service.invoke_chat",
        lambda *args, **kwargs: _fake_letter_json(),
    )
    response = client.post(
        "/api/v1/agents/cover-letter",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "save": True},
    )
    assert response.status_code == 400
