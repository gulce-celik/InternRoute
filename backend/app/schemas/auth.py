from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RegisterVerify(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class RegisterResend(BaseModel):
    email: EmailStr


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    university: str | None = None
    study_year: int | None = None
    major: str | None = None
    target_sectors: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerificationStarted(BaseModel):
    email: EmailStr
    message: str
    expires_in_minutes: int
    emailed: bool
    debug_code: str | None = None
