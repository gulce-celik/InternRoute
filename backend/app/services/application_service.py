from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import Application, CV, Job, User
from app.schemas.application import ApplicationCreate, ApplicationStatusUpdate, ApplicationUpdate


def _normalize_qa(items: list | None) -> list[dict[str, str]]:
    if not items:
        return []
    normalized: list[dict[str, str]] = []
    for item in items:
        if hasattr(item, "model_dump"):
            payload = item.model_dump()
        elif isinstance(item, dict):
            payload = item
        else:
            continue
        question = str(payload.get("question", "")).strip()
        answer = str(payload.get("answer", "")).strip()
        if question:
            normalized.append({"question": question, "answer": answer})
    return normalized


def _to_response(application: Application) -> dict:
    return {
        "id": application.id,
        "job_id": application.job_id,
        "cv_id": application.cv_id,
        "status": application.status,
        "notes": application.notes,
        "qa_items": application.qa_items or [],
        "created_at": application.created_at,
        "job_title": application.job.title,
        "job_company": application.job.company,
        "cv_filename": application.cv.filename if application.cv is not None else None,
    }


def _get_user_application(db: Session, user_id: int, application_id: int) -> Application:
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == user_id)
        .first()
    )
    if application is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return application


def _resolve_cv(db: Session, user: User, cv_id: int | None) -> CV | None:
    if cv_id is None:
        return None
    cv = db.query(CV).filter(CV.id == cv_id, CV.user_id == user.id).first()
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found")
    return cv


def list_applications(db: Session, user: User) -> list[dict]:
    applications = (
        db.query(Application)
        .filter(Application.user_id == user.id)
        .order_by(Application.created_at.desc())
        .all()
    )
    return [_to_response(application) for application in applications]


def get_application(db: Session, user: User, application_id: int) -> dict:
    application = _get_user_application(db, user.id, application_id)
    response = _to_response(application)
    response["job_description"] = application.job.description
    response["job_location"] = application.job.location
    return response


def create_application(db: Session, user: User, data: ApplicationCreate) -> dict:
    job = db.query(Job).filter(Job.id == data.job_id, Job.user_id == user.id).first()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    cv = _resolve_cv(db, user, data.cv_id)

    duplicate = (
        db.query(Application)
        .filter(Application.user_id == user.id, Application.job_id == data.job_id)
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This job already has an application — change the CV on that card instead",
        )

    application = Application(
        user_id=user.id,
        job_id=data.job_id,
        cv_id=cv.id if cv is not None else None,
        status=data.status,
        notes=(data.notes or "").strip() or None,
        qa_items=_normalize_qa(data.qa_items),
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return _to_response(application)


def update_application_status(
    db: Session,
    user: User,
    application_id: int,
    data: ApplicationStatusUpdate,
) -> dict:
    application = _get_user_application(db, user.id, application_id)
    application.status = data.status
    db.commit()
    db.refresh(application)
    return _to_response(application)


def update_application(
    db: Session,
    user: User,
    application_id: int,
    data: ApplicationUpdate,
) -> dict:
    application = _get_user_application(db, user.id, application_id)
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    if "status" in updates and updates["status"] is not None:
        application.status = updates["status"]
    if "cv_id" in updates:
        cv = _resolve_cv(db, user, updates["cv_id"])
        application.cv_id = cv.id if cv is not None else None
    if "notes" in updates:
        notes = updates["notes"]
        application.notes = (notes or "").strip() or None
    if "qa_items" in updates:
        application.qa_items = _normalize_qa(updates["qa_items"])

    db.commit()
    db.refresh(application)
    return _to_response(application)
