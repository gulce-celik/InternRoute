def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_and_login(client):
    register = client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@example.com",
            "password": "securepass",
            "full_name": "Test Student",
        },
    )
    assert register.status_code == 201
    assert register.json()["email"] == "student@example.com"

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "student@example.com", "password": "securepass"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["full_name"] == "Test Student"


def test_register_rejects_duplicate_email(client):
    payload = {
        "email": "dup@example.com",
        "password": "securepass",
        "full_name": "First",
    }
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"].lower()


def test_login_unknown_user_fails(client):
    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "missing@example.com", "password": "securepass"},
    )
    assert login_response.status_code == 401
