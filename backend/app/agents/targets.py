"""Resolve job + CV targets for agent endpoints."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import Application, CV, Job, User


def resolve_job_cv(
    db: Session,
    user: User,
    *,
    job_id: int | None = None,
    cv_id: int | None = None,
    application_id: int | None = None,
) -> tuple[Job, CV, Application | None]:
    """Return owned Job + CV, and the Application when resolved via application_id."""
    if application_id is not None:
        application = (
            db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user.id)
            .first()
        )
        if application is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
        if application.cv_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application has no CV linked; assign a CV first",
            )
        job = db.query(Job).filter(Job.id == application.job_id, Job.user_id == user.id).first()
        cv = db.query(CV).filter(CV.id == application.cv_id, CV.user_id == user.id).first()
        if job is None or cv is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linked job or CV not found",
            )
        return job, cv, application

    if job_id is None or cv_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide application_id, or both job_id and cv_id",
        )

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.id).first()
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    return job, cv, None
