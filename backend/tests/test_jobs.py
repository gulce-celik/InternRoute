import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "jobuser@example.com",
            "password": "securepass",
            "full_name": "Job User",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "jobuser@example.com", "password": "securepass"},
    )
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_user_headers(client: TestClient) -> dict[str, str]:
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "other@example.com",
            "password": "securepass",
            "full_name": "Other User",
        },
    )
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "other@example.com", "password": "securepass"},
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


def test_jobs_require_auth(client: TestClient):
    response = client.get("/api/v1/jobs")
    assert response.status_code == 401


def test_create_and_list_jobs(client: TestClient, auth_headers: dict[str, str]):
    create_response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_headers)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["title"] == JOB_PAYLOAD["title"]
    assert created["company"] == JOB_PAYLOAD["company"]
    assert created["status"] == "applied"
    assert "id" in created
    assert "created_at" in created

    list_response = client.get("/api/v1/jobs", headers=auth_headers)
    assert list_response.status_code == 200
    jobs = list_response.json()
    assert len(jobs) == 1
    assert jobs[0]["id"] == created["id"]


def test_get_update_delete_job(client: TestClient, auth_headers: dict[str, str]):
    create_response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_headers)
    job_id = create_response.json()["id"]

    get_response = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["title"] == JOB_PAYLOAD["title"]

    update_response = client.put(
        f"/api/v1/jobs/{job_id}",
        json={"title": "Backend Stajyeri", "status": "interview"},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["title"] == "Backend Stajyeri"
    assert updated["status"] == "interview"
    assert updated["company"] == JOB_PAYLOAD["company"]

    delete_response = client.delete(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert delete_response.status_code == 204

    get_after_delete = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert get_after_delete.status_code == 404


def test_job_not_found(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/api/v1/jobs/9999", headers=auth_headers)
    assert response.status_code == 404


def test_job_scoped_to_owner(
    client: TestClient,
    auth_headers: dict[str, str],
    other_user_headers: dict[str, str],
):
    create_response = client.post("/api/v1/jobs", json=JOB_PAYLOAD, headers=auth_headers)
    job_id = create_response.json()["id"]

    other_get = client.get(f"/api/v1/jobs/{job_id}", headers=other_user_headers)
    assert other_get.status_code == 404

    other_list = client.get("/api/v1/jobs", headers=other_user_headers)
    assert other_list.status_code == 200
    assert other_list.json() == []
