from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import ApplicationStatus


class ApplicationQAItem(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(default="")


class ApplicationCreate(BaseModel):
    job_id: int
    cv_id: int | None = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    notes: str | None = None
    qa_items: list[ApplicationQAItem] = Field(default_factory=list)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus | None = None
    cv_id: int | None = None
    notes: str | None = None
    qa_items: list[ApplicationQAItem] | None = None


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    cv_id: int | None = None
    status: ApplicationStatus
    notes: str | None = None
    qa_items: list[ApplicationQAItem] = Field(default_factory=list)
    created_at: datetime
    job_title: str
    job_company: str
    cv_filename: str | None = None


class ApplicationDetailResponse(ApplicationResponse):
    job_description: str
    job_location: str | None
