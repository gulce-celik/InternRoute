import io
import json

import fitz
import pytest
from fastapi.testclient import TestClient

from app.agents.hr_mock.service import _parse_start_json, _parse_turn_json
from tests.conftest import register_verified_user


def _make_pdf_bytes(text: str = "Python FastAPI SQLAlchemy intern experience.") -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    buffer = io.BytesIO()
    document.save(buffer)
    document.close()
    return buffer.getvalue()


def _fake_start_json(question: str = "Why are you interested in Acme?") -> str:
    return json.dumps({"question": question})


def _fake_turn_json(
    *,
    feedback: str = "Solid start — add a concrete example.",
    next_question: str | None = "Tell me about a teamwork challenge.",
    done: bool = False,
    summary: dict | None = None,
) -> str:
    payload = {
        "feedback": feedback,
        "next_question": next_question,
        "done": done,
        "summary": summary,
    }
    return json.dumps(payload)


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    return register_verified_user(client, email="hrmock@example.com", full_name="HR Mock User")


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


def test_parse_start_and_turn_json():
    assert _parse_start_json(_fake_start_json())["question"].startswith("Why")
    mid = _parse_turn_json(_fake_turn_json(), force_wrap=False)
    assert mid["next_question"] is not None
    assert mid["done"] is False

    end = _parse_turn_json(
        _fake_turn_json(
            next_question=None,
            done=True,
            summary={
                "overall": "Good practice.",
                "strengths": ["Clear motivation"],
                "improvements": ["More metrics"],
                "practice_tips": ["Use STAR"],
            },
        ),
        force_wrap=False,
    )
    assert end["done"] is True
    assert end["next_question"] is None
    assert end["summary"]["overall"] == "Good practice."


def test_mock_interview_requires_auth(client: TestClient):
    response = client.post(
        "/api/v1/agents/mock-interview/start",
        json={"job_id": 1, "cv_id": 1},
    )
    assert response.status_code == 401


def test_mock_interview_validates_body(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/api/v1/agents/mock-interview/start",
        headers=auth_headers,
        json={"job_id": 1},
    )
    assert response.status_code == 422


def test_mock_interview_start_answer_get_list(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, cv_id = job_and_cv
    calls: list[str] = []

    def _fake_chat(user_prompt: str, **kwargs) -> str:
        calls.append(user_prompt)
        if "Ask the first interview question" in user_prompt:
            return _fake_start_json("Why Acme for your internship?")
        if len(calls) == 2:
            return _fake_turn_json(
                feedback="Nice motivation.",
                next_question="Describe a project you are proud of.",
            )
        return _fake_turn_json(
            feedback="Great detail.",
            next_question=None,
            done=True,
            summary={
                "overall": "Strong practice session.",
                "strengths": ["Motivation", "Project story"],
                "improvements": ["Quantify impact"],
                "practice_tips": ["Rehearse aloud once"],
            },
        )

    monkeypatch.setattr("app.agents.hr_mock.service.invoke_chat", _fake_chat)
    monkeypatch.setattr(
        "app.agents.hr_mock.service.get_chroma_store",
        lambda: type(
            "Store",
            (),
            {"upsert_interview_turn": staticmethod(lambda **kwargs: 1)},
        )(),
    )

    start = client.post(
        "/api/v1/agents/mock-interview/start",
        headers=auth_headers,
        json={"job_id": job_id, "cv_id": cv_id, "question_limit": 5},
    )
    assert start.status_code == 200, start.text
    start_body = start.json()
    session_id = start_body["session_id"]
    assert start_body["question"] == "Why Acme for your internship?"
    assert start_body["question_index"] == 1
    assert start_body["question_limit"] == 5
    assert start_body["status"] == "active"

    mid = client.post(
        "/api/v1/agents/mock-interview/answer",
        headers=auth_headers,
        json={"session_id": session_id, "answer": "I like Acme's API culture and mentorship."},
    )
    assert mid.status_code == 200, mid.text
    mid_body = mid.json()
    assert mid_body["completed"] is False
    assert mid_body["feedback"] == "Nice motivation."
    assert mid_body["question"] == "Describe a project you are proud of."
    assert mid_body["question_index"] == 2

    end = client.post(
        "/api/v1/agents/mock-interview/answer",
        headers=auth_headers,
        json={"session_id": session_id, "answer": "I built a FastAPI job tracker."},
    )
    assert end.status_code == 200, end.text
    end_body = end.json()
    assert end_body["completed"] is True
    assert end_body["status"] == "completed"
    assert end_body["question"] is None
    assert end_body["summary"]["overall"] == "Strong practice session."

    detail = client.get(
        f"/api/v1/agents/mock-interview/{session_id}",
        headers=auth_headers,
    )
    assert detail.status_code == 200, detail.text
    detail_body = detail.json()
    assert detail_body["job_title"] == "Backend Intern"
    assert detail_body["job_company"] == "Acme"
    assert detail_body["status"] == "completed"
    assert len(detail_body["transcript"]) >= 3
    assert detail_body["summary"]["strengths"] == ["Motivation", "Project story"]

    listed = client.get("/api/v1/agents/mock-interview", headers=auth_headers)
    assert listed.status_code == 200, listed.text
    items = listed.json()
    assert len(items) >= 1
    assert items[0]["session_id"] == session_id
    assert items[0]["job_company"] == "Acme"

    again = client.post(
        "/api/v1/agents/mock-interview/answer",
        headers=auth_headers,
        json={"session_id": session_id, "answer": "One more thing"},
    )
    assert again.status_code == 400


def test_mock_interview_via_application_id(
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
        "app.agents.hr_mock.service.invoke_chat",
        lambda *args, **kwargs: _fake_start_json("Walk me through your CV."),
    )

    response = client.post(
        "/api/v1/agents/mock-interview/start",
        headers=auth_headers,
        json={"application_id": application_id},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["application_id"] == application_id
    assert body["question"].startswith("Walk me")


def test_mock_interview_missing_session(client: TestClient, auth_headers: dict[str, str]):
    response = client.get("/api/v1/agents/mock-interview/999999", headers=auth_headers)
    assert response.status_code == 404


def test_mock_interview_application_without_cv(
    client: TestClient,
    auth_headers: dict[str, str],
    job_and_cv: tuple[int, int],
    monkeypatch: pytest.MonkeyPatch,
):
    job_id, _cv_id = job_and_cv
    app_resp = client.post(
        "/api/v1/applications",
        headers=auth_headers,
        json={"job_id": job_id, "status": "draft"},
    )
    assert app_resp.status_code == 201, app_resp.text
    application_id = app_resp.json()["id"]

    monkeypatch.setattr(
        "app.agents.hr_mock.service.invoke_chat",
        lambda *args, **kwargs: _fake_start_json(),
    )

    response = client.post(
        "/api/v1/agents/mock-interview/start",
        headers=auth_headers,
        json={"application_id": application_id},
    )
    assert response.status_code == 400
