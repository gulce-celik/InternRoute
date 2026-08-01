"""Schema smoke tests for mock interview request/response models."""

import pytest
from pydantic import ValidationError

from app.schemas.agents import (
    MockInterviewAnswerRequest,
    MockInterviewStartRequest,
    MockInterviewStartResponse,
)


def test_start_request_accepts_application_id():
    req = MockInterviewStartRequest(application_id=5)
    assert req.application_id == 5
    assert req.question_limit is None


def test_start_request_accepts_job_and_cv():
    req = MockInterviewStartRequest(job_id=1, cv_id=2, question_limit=6)
    assert req.job_id == 1
    assert req.cv_id == 2
    assert req.question_limit == 6


def test_start_request_rejects_incomplete_ids():
    with pytest.raises(ValidationError):
        MockInterviewStartRequest(job_id=1)


def test_start_request_clamps_question_limit():
    with pytest.raises(ValidationError):
        MockInterviewStartRequest(application_id=1, question_limit=4)
    with pytest.raises(ValidationError):
        MockInterviewStartRequest(application_id=1, question_limit=8)


def test_answer_request_requires_nonempty_answer():
    with pytest.raises(ValidationError):
        MockInterviewAnswerRequest(session_id=1, answer="")


def test_start_response_shape():
    resp = MockInterviewStartResponse(
        session_id=9,
        job_id=1,
        cv_id=2,
        status="active",
        question_index=1,
        question_limit=6,
        question="Why this role?",
    )
    assert resp.question.startswith("Why")
    assert resp.application_id is None
