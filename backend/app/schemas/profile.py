from pydantic import BaseModel, ConfigDict, Field


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    university: str | None = Field(default=None, max_length=255)
    study_year: int | None = Field(default=None, ge=1, le=8)
    major: str | None = Field(default=None, max_length=255)
    target_sectors: str | None = Field(
        default=None,
        max_length=1000,
        description="Comma-separated sectors, e.g. Software, Energy, Finance",
    )


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str | None
    university: str | None
    study_year: int | None
    major: str | None
    target_sectors: str | None
