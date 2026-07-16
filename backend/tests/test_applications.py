import io

import fitz
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "appuser@example.com",
            "password": "securepass",
            "full_name": "App User",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "appuser@example.com", "password": "securepass"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


JOB_PAYLOAD = {
    "title": "Yazılım Stajyeri",
    "company": "Acme Teknoloji",
    "description": "İlan metni buraya...",
    "location": "İstanbul",
    "status": "applied",
}


def _make_pdf_bytes() -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), "Application CV content")
    buffer = io.BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()


def _create_job(client: TestClient, headers: dict[str, str]) -> int:
    response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=headers)
    return response.json()["id"]


def _create_cv(client: TestClient, headers: dict[str, str]) -> int:
    response = client.post(
        "/api/v1/cvs",
        headers=headers,
        files={"file": ("cv.pdf", _make_pdf_bytes(), "application/pdf")},
    )
    return response.json()["id"]


def test_applications_require_auth(client: TestClient):
    response = client.get("/api/v1/applications")
    assert response.status_code == 401


def test_create_list_and_update_application(client: TestClient, auth_headers: dict[str, str]):
    job_id = _create_job(client, auth_headers)
    cv_id = _create_cv(client, auth_headers)

    create_response = client.post(
        "/api/v1/applications",
        json={"job_id": job_id, "cv_id": cv_id, "status": "applied"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["job_title"] == JOB_PAYLOAD["title"]
    assert created["cv_filename"] == "cv.pdf"
    assert created["notes"] is None
    assert created["qa_items"] == []

    list_response = client.get("/api/v1/applications", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    patch_response = client.patch(
        f"/api/v1/applications/{created['id']}/status",
        json={"status": "interview"},
        headers=auth_headers,
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["status"] == "interview"


def test_application_notes_and_qa(client: TestClient, auth_headers: dict[str, str]):
    job_id = _create_job(client, auth_headers)
    cv_id = _create_cv(client, auth_headers)

    create_response = client.post(
        "/api/v1/applications",
        json={
            "job_id": job_id,
            "cv_id": cv_id,
            "status": "applied",
            "notes": "Applied via company career portal",
            "qa_items": [
                {
                    "question": "Why this internship?",
                    "answer": "I want to build backend APIs with FastAPI.",
                }
            ],
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["notes"] == "Applied via company career portal"
    assert len(created["qa_items"]) == 1
    assert created["qa_items"][0]["question"] == "Why this internship?"

    update_response = client.patch(
        f"/api/v1/applications/{created['id']}",
        json={
            "notes": "Recruiter asked for availability next week",
            "qa_items": [
                {
                    "question": "Why this internship?",
                    "answer": "Updated answer about InternRoute experience.",
                },
                {
                    "question": "Biggest project?",
                    "answer": "Built a career tracking app with RAG.",
                },
            ],
        },
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["notes"].startswith("Recruiter")
    assert len(updated["qa_items"]) == 2


def test_dashboard_stats(client: TestClient, auth_headers: dict[str, str]):
    job_id = _create_job(client, auth_headers)
    cv_id = _create_cv(client, auth_headers)
    client.post(
        "/api/v1/applications",
        json={"job_id": job_id, "cv_id": cv_id, "status": "interview"},
        headers=auth_headers,
    )

    stats_response = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert stats_response.status_code == 200
    stats = stats_response.json()
    assert stats["job_count"] == 1
    assert stats["cv_count"] == 1
    assert stats["application_count"] == 1
    assert stats["interview_count"] == 1
    assert stats["furthest_pipeline_stage"] == "interview"
