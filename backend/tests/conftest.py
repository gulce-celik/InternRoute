import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.user import PendingRegistration  # noqa: F401

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _isolate_email_delivery(monkeypatch):
    """Never hit real Brevo/Resend during pytest — keep debug_code available."""
    monkeypatch.setenv("SMTP_HOST", "")
    monkeypatch.setenv("SMTP_FROM", "")
    monkeypatch.setenv("SMTP_USERNAME", "")
    monkeypatch.setenv("SMTP_PASSWORD", "")
    monkeypatch.setenv("RESEND_API_KEY", "")
    monkeypatch.setenv("GEMINI_API_KEY", "")

    def _fake_send(_to_email: str, _code: str) -> bool:
        return False

    monkeypatch.setattr("app.services.email_service.send_verification_email", _fake_send)
    monkeypatch.setattr("app.services.auth_service.send_verification_email", _fake_send)

    import app.rag.vectorstore.chroma_store as chroma_store

    chroma_store._store = None
    yield
    chroma_store._store = None


def register_verified_user(
    client: TestClient,
    *,
    email: str,
    password: str = "securepass",
    full_name: str = "Test User",
) -> dict[str, str]:
    start = client.post(
        "/api/v1/auth/register/start",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert start.status_code == 200, start.text
    code = start.json()["debug_code"]
    assert code, "Expected debug_code in test mode"

    verify = client.post(
        "/api/v1/auth/register/verify",
        json={"email": email, "code": code},
    )
    assert verify.status_code == 201, verify.text

    login_response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
