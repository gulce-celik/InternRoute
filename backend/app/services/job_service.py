from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import Job, User
from app.schemas.job import JobCreate, JobUpdate


def _get_user_job(db: Session, user_id: int, job_id: int) -> Job:
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user_id).first()
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found",
        )
    return job


def list_jobs(db: Session, user: User) -> list[Job]:
    return db.query(Job).filter(Job.user_id == user.id).order_by(Job.created_at.desc()).all()


def create_job(db: Session, user: User, data: JobCreate) -> Job:
    job = Job(
        user_id=user.id,
        title=data.title,
        company=data.company,
        description=data.description,
        location=data.location,
        status=data.status,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, user: User, job_id: int) -> Job:
    return _get_user_job(db, user.id, job_id)


def update_job(db: Session, user: User, job_id: int, data: JobUpdate) -> Job:
    job = _get_user_job(db, user.id, job_id)
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )
    for field, value in updates.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, user: User, job_id: int) -> None:
    job = _get_user_job(db, user.id, job_id)
    db.delete(job)
    db.commit()
