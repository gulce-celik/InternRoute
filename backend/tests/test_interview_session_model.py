"""InterviewSession model creates with the rest of the schema."""

from app.models.user import (
    Application,
    ApplicationStatus,
    CV,
    InterviewSession,
    InterviewSessionStatus,
    Job,
    User,
)


def test_interview_session_roundtrip(db):
    user = User(email="mock@example.com", hashed_password="x", full_name="Mock")
    db.add(user)
    db.flush()

    job = Job(
        user_id=user.id,
        title="Backend Intern",
        company="Acme",
        description="Build APIs",
    )
    cv = CV(
        user_id=user.id,
        name="cv.pdf",
        filename="cv.pdf",
        file_path="/tmp/cv.pdf",
    )
    db.add_all([job, cv])
    db.flush()

    application = Application(
        user_id=user.id,
        job_id=job.id,
        cv_id=cv.id,
        status=ApplicationStatus.APPLIED,
        qa_items=[],
    )
    db.add(application)
    db.flush()

    session = InterviewSession(
        user_id=user.id,
        job_id=job.id,
        cv_id=cv.id,
        application_id=application.id,
        status=InterviewSessionStatus.ACTIVE,
        question_limit=6,
        transcript=[
            {
                "role": "interviewer",
                "content": "Why Acme?",
                "feedback": None,
                "created_at": "2026-08-01T12:00:00+00:00",
            }
        ],
        summary=None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    assert session.id is not None
    assert session.status == InterviewSessionStatus.ACTIVE
    assert len(session.transcript) == 1
    assert session.transcript[0]["content"] == "Why Acme?"
    assert session.job.title == "Backend Intern"
    assert session.application_id == application.id
