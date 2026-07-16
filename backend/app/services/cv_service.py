from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.user import Application, CV, User
from app.rag.pipeline.ingestion import ingest_cv_pdf
from app.rag.vectorstore.chroma_store import get_chroma_store


def _get_user_cv(db: Session, user_id: int, cv_id: int) -> CV:
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user_id).first()
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    return cv


def list_cvs(db: Session, user: User) -> list[CV]:
    return db.query(CV).filter(CV.user_id == user.id).order_by(CV.created_at.desc()).all()


def get_cv(db: Session, user: User, cv_id: int) -> CV:
    return _get_user_cv(db, user.id, cv_id)


def upload_cv(db: Session, user: User, file: UploadFile) -> CV:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    filename = Path(file.filename or "cv.pdf").name
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.pdf"

    settings = get_settings()
    user_dir = Path(settings.upload_dir) / str(user.id)
    user_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}_{filename}"
    destination = user_dir / stored_name

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    destination.write_bytes(content)

    cv = CV(
        user_id=user.id,
        filename=filename,
        file_path=str(destination),
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)

    try:
        ingest_cv_pdf(
            user_id=user.id,
            cv_id=cv.id,
            filename=cv.filename,
            file_path=cv.file_path,
        )
    except Exception as exc:
        db.delete(cv)
        db.commit()
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not process PDF for memory ingestion: {exc}",
        ) from exc

    return cv


def delete_cv(db: Session, user: User, cv_id: int) -> None:
    cv = _get_user_cv(db, user.id, cv_id)
    file_path = Path(cv.file_path)

    # Keep pipeline rows; only clear the CV link so the user can pick another CV later.
    db.query(Application).filter(
        Application.user_id == user.id,
        Application.cv_id == cv.id,
    ).update({Application.cv_id: None}, synchronize_session=False)

    try:
        get_chroma_store().delete_cv_chunks(user_id=user.id, cv_id=cv.id)
    except Exception:
        pass

    db.delete(cv)
    db.commit()
    file_path.unlink(missing_ok=True)
