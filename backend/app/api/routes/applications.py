from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationDetailResponse,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.services.application_service import (
    create_application,
    get_application,
    list_applications,
    update_application,
    update_application_status,
)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationResponse])
def list_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    return list_applications(db, current_user)


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_user_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return create_application(db, current_user, data)


@router.get("/{application_id}", response_model=ApplicationDetailResponse)
def get_user_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return get_application(db, current_user, application_id)


@router.patch("/{application_id}", response_model=ApplicationResponse)
def patch_user_application(
    application_id: int,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return update_application(db, current_user, application_id, data)


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
def patch_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return update_application_status(db, current_user, application_id, data)
