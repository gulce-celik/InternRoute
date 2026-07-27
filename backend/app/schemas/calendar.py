from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.user import CalendarEventCategory


class CalendarEventCreate(BaseModel):
    category: CalendarEventCategory
    event_date: date
    title: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    job_id: int | None = None
    application_id: int | None = None


class CalendarEventUpdate(BaseModel):
    category: CalendarEventCategory | None = None
    event_date: date | None = None
    title: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    job_id: int | None = None
    application_id: int | None = None


class CalendarEventResponse(BaseModel):
    id: int
    category: CalendarEventCategory
    event_date: date
    title: str | None
    notes: str | None
    job_id: int | None
    application_id: int | None
    job_title: str | None = None
    job_company: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
