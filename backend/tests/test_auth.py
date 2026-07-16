def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_verify_and_login(client):
    start = client.post(
        "/api/v1/auth/register/start",
        json={
            "email": "student@example.com",
            "password": "securepass",
            "full_name": "Test Student",
        },
    )
    assert start.status_code == 200
    body = start.json()
    assert body["email"] == "student@example.com"
    assert body["debug_code"]

    verify = client.post(
        "/api/v1/auth/register/verify",
        json={"email": "student@example.com", "code": body["debug_code"]},
    )
    assert verify.status_code == 201
    assert verify.json()["email"] == "student@example.com"

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


def test_register_rejects_bad_code(client):
    start = client.post(
        "/api/v1/auth/register/start",
        json={
            "email": "badcode@example.com",
            "password": "securepass",
            "full_name": "Bad Code",
        },
    )
    assert start.status_code == 200

    verify = client.post(
        "/api/v1/auth/register/verify",
        json={"email": "badcode@example.com", "code": "000000"},
    )
    assert verify.status_code == 400
    assert "Invalid verification code" in verify.json()["detail"]


def test_login_before_verify_fails(client):
    start = client.post(
        "/api/v1/auth/register/start",
        json={
            "email": "pending@example.com",
            "password": "securepass",
            "full_name": "Pending",
        },
    )
    assert start.status_code == 200

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": "pending@example.com", "password": "securepass"},
    )
    assert login_response.status_code == 401
