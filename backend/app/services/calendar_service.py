from datetime import UTC, date, datetime, time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.user import Application, CalendarEvent, Job, User
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate


CATEGORY_LABELS = {
    "aptitude_test": "Aptitude test",
    "ai_interview": "AI interview",
    "language_test": "Language test",
    "hr_interview": "HR interview",
    "technical_interview": "Technical interview",
    "team_interview": "Team interview",
    "case_study": "Case study",
}


def _as_utc_datetime(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=UTC)


def _default_title(category: str) -> str:
    return CATEGORY_LABELS.get(category, category.replace("_", " ").title())


def _to_response(event: CalendarEvent):
    from app.schemas.calendar import CalendarEventResponse

    job_title = event.job.title if event.job else None
    job_company = event.job.company if event.job else None
    if event.application and event.application.job:
        job_title = job_title or event.application.job.title
        job_company = job_company or event.application.job.company

    return CalendarEventResponse(
        id=event.id,
        category=event.category,
        event_date=event.event_date.date() if isinstance(event.event_date, datetime) else event.event_date,
        title=event.title,
        notes=event.notes,
        job_id=event.job_id,
        application_id=event.application_id,
        job_title=job_title,
        job_company=job_company,
        created_at=event.created_at,
    )


def _verify_links(db: Session, user: User, job_id: int | None, application_id: int | None) -> None:
    if job_id is not None:
        job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
        if job is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    if application_id is not None:
        application = (
            db.query(Application)
            .filter(Application.id == application_id, Application.user_id == user.id)
            .first()
        )
        if application is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")


def list_events(
    db: Session,
    user: User,
    *,
    year: int | None = None,
    month: int | None = None,
) -> list:
    query = (
        db.query(CalendarEvent)
        .options(
            joinedload(CalendarEvent.job),
            joinedload(CalendarEvent.application).joinedload(Application.job),
        )
        .filter(CalendarEvent.user_id == user.id)
    )

    if year is not None and month is not None:
        if month < 1 or month > 12:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month")
        start = datetime(year, month, 1, tzinfo=UTC)
        if month == 12:
            end = datetime(year + 1, 1, 1, tzinfo=UTC)
        else:
            end = datetime(year, month + 1, 1, tzinfo=UTC)
        query = query.filter(CalendarEvent.event_date >= start, CalendarEvent.event_date < end)

    events = query.order_by(CalendarEvent.event_date.asc(), CalendarEvent.id.asc()).all()
    return [_to_response(event) for event in events]


def create_event(db: Session, user: User, data: CalendarEventCreate):
    _verify_links(db, user, data.job_id, data.application_id)
    title = (data.title or "").strip() or _default_title(data.category.value)
    event = CalendarEvent(
        user_id=user.id,
        title=title,
        category=data.category,
        event_date=_as_utc_datetime(data.event_date),
        notes=(data.notes or "").strip() or None,
        job_id=data.job_id,
        application_id=data.application_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    event = (
        db.query(CalendarEvent)
        .options(
            joinedload(CalendarEvent.job),
            joinedload(CalendarEvent.application).joinedload(Application.job),
        )
        .filter(CalendarEvent.id == event.id)
        .one()
    )
    return _to_response(event)


def update_event(db: Session, user: User, event_id: int, data: CalendarEventUpdate):
    event = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id)
        .first()
    )
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    payload = data.model_dump(exclude_unset=True)
    job_id = payload.get("job_id", event.job_id)
    application_id = payload.get("application_id", event.application_id)
    _verify_links(db, user, job_id, application_id)

    if "category" in payload and payload["category"] is not None:
        event.category = payload["category"]
    if "event_date" in payload and payload["event_date"] is not None:
        event.event_date = _as_utc_datetime(payload["event_date"])
    if "title" in payload:
        title = (payload["title"] or "").strip()
        event.title = title or _default_title(event.category.value)
    if "notes" in payload:
        event.notes = (payload["notes"] or "").strip() or None
    if "job_id" in payload:
        event.job_id = payload["job_id"]
    if "application_id" in payload:
        event.application_id = payload["application_id"]

    db.commit()
    db.refresh(event)
    event = (
        db.query(CalendarEvent)
        .options(
            joinedload(CalendarEvent.job),
            joinedload(CalendarEvent.application).joinedload(Application.job),
        )
        .filter(CalendarEvent.id == event.id)
        .one()
    )
    return _to_response(event)


def delete_event(db: Session, user: User, event_id: int) -> None:
    event = (
        db.query(CalendarEvent)
        .filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id)
        .first()
    )
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    db.delete(event)
    db.commit()
