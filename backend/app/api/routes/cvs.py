from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import CV, User
from app.schemas.cv import CVResponse
from app.services.cv_service import delete_cv, get_cv, list_cvs, upload_cv

router = APIRouter(prefix="/cvs", tags=["cvs"])


@router.get("", response_model=list[CVResponse])
def list_user_cvs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CV]:
    return list_cvs(db, current_user)


@router.post("", response_model=CVResponse, status_code=status.HTTP_201_CREATED)
def create_user_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CV:
    return upload_cv(db, current_user, file)


@router.get("/{cv_id}", response_model=CVResponse)
def get_user_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CV:
    return get_cv(db, current_user, cv_id)


@router.get("/{cv_id}/file")
def download_user_cv_file(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FileResponse:
    cv = get_cv(db, current_user, cv_id)
    path = Path(cv.file_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV file missing on disk")
    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=cv.filename,
        content_disposition_type="inline",
    )


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_cv(
    cv_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    delete_cv(db, current_user, cv_id)
