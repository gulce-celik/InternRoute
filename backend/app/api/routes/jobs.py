from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import Job, User
from app.schemas.job import JobCreate, JobResponse, JobUpdate
from app.services.job_service import create_job, delete_job, get_job, list_jobs, update_job

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("", response_model=list[JobResponse])
def list_user_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Job]:
    return list_jobs(db, current_user)


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_user_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Job:
    return create_job(db, current_user, data)


@router.get("/{job_id}", response_model=JobResponse)
def get_user_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Job:
    return get_job(db, current_user, job_id)


@router.put("/{job_id}", response_model=JobResponse)
def update_user_job(
    job_id: int,
    data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Job:
    return update_job(db, current_user, job_id, data)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    delete_job(db, current_user, job_id)
