import io

import fitz
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    from tests.conftest import register_verified_user

    return register_verified_user(
        client,
        email="cvuser@example.com",
        full_name="CV User",
    )

def _make_pdf_bytes(text: str = "InternRoute CV content for testing.") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    buffer = io.BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()


def test_cvs_require_auth(client: TestClient):
    response = client.get("/api/v1/cvs")
    assert response.status_code == 401


def test_upload_list_delete_cv(client: TestClient, auth_headers: dict[str, str]):
    pdf_bytes = _make_pdf_bytes()
    upload_response = client.post(
        "/api/v1/cvs",
        headers=auth_headers,
        files={"file": ("resume.pdf", pdf_bytes, "application/pdf")},
    )
    assert upload_response.status_code == 201
    created = upload_response.json()
    assert created["filename"] == "resume.pdf"
    cv_id = created["id"]

    list_response = client.get("/api/v1/cvs", headers=auth_headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    memory_response = client.get("/api/v1/memory/context", headers=auth_headers)
    assert memory_response.status_code == 200
    memory = memory_response.json()
    assert memory["cv_chunks"] >= 1
    assert len(memory["snippets"]) >= 1

    file_response = client.get(f"/api/v1/cvs/{cv_id}/file", headers=auth_headers)
    assert file_response.status_code == 200
    assert file_response.headers["content-type"].startswith("application/pdf")
    assert len(file_response.content) > 0

    delete_response = client.delete(f"/api/v1/cvs/{cv_id}", headers=auth_headers)
    assert delete_response.status_code == 204

    memory_after_delete = client.get("/api/v1/memory/context", headers=auth_headers)
    assert memory_after_delete.json()["cv_chunks"] == 0


def test_delete_cv_clears_application_link_but_keeps_pipeline(
    client: TestClient, auth_headers: dict[str, str]
):
    job_response = client.post(
        "/api/v1/jobs",
        headers=auth_headers,
        json={
            "title": "Intern",
            "company": "Acme",
            "description": "Role",
            "status": "applied",
        },
    )
    assert job_response.status_code == 201
    job_id = job_response.json()["id"]

    upload_response = client.post(
        "/api/v1/cvs",
        headers=auth_headers,
        files={"file": ("resume.pdf", _make_pdf_bytes(), "application/pdf")},
    )
    assert upload_response.status_code == 201
    cv_id = upload_response.json()["id"]

    app_response = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "status": "applied"},
    )
    assert app_response.status_code == 201
    application_id = app_response.json()["id"]

    delete_response = client.delete(f"/api/v1/cvs/{cv_id}", headers=auth_headers)
    assert delete_response.status_code == 204

    apps = client.get("/api/v1/applications", headers=auth_headers)
    assert apps.status_code == 200
    assert len(apps.json()) == 1
    assert apps.json()[0]["id"] == application_id
    assert apps.json()[0]["cv_id"] is None
    assert apps.json()[0]["cv_filename"] is None

    replacement = client.post(
        "/api/v1/cvs",
        headers=auth_headers,
        files={"file": ("new-cv.pdf", _make_pdf_bytes("Replacement CV"), "application/pdf")},
    )
    assert replacement.status_code == 201
    new_cv_id = replacement.json()["id"]

    reassign = client.patch(
        f"/api/v1/applications/{application_id}",
        headers=auth_headers,
        json={"cv_id": new_cv_id},
    )
    assert reassign.status_code == 200
    assert reassign.json()["cv_id"] == new_cv_id
    assert reassign.json()["cv_filename"] == "new-cv.pdf"
