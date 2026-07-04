def auth_headers(client, email="student@example.com", password="securepass", full_name="Test Student"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": full_name},
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_profile(client):
    headers = auth_headers(client)

    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "student@example.com"
    assert body["full_name"] == "Test Student"
    assert body["university"] is None


def test_update_profile(client):
    headers = auth_headers(client, email="profile@example.com")

    response = client.patch(
        "/api/v1/profile",
        headers=headers,
        json={
            "university": "Istanbul Technical University",
            "study_year": 3,
            "major": "Computer Engineering",
            "target_sectors": "Software, AI, Energy",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["university"] == "Istanbul Technical University"
    assert body["study_year"] == 3
    assert body["major"] == "Computer Engineering"
    assert "Software" in body["target_sectors"]

    get_response = client.get("/api/v1/profile", headers=headers)
    assert get_response.json()["study_year"] == 3


def test_profile_requires_auth(client):
    response = client.get("/api/v1/profile")
    assert response.status_code == 401
