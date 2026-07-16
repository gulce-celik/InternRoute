from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterResend,
    RegisterVerify,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    VerificationStarted,
)
from app.services.auth_service import (
    login_user,
    resend_registration_code,
    start_registration,
    verify_registration,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/start", response_model=VerificationStarted)
def register_start(data: UserCreate, db: Session = Depends(get_db)) -> VerificationStarted:
    return start_registration(db, data)


@router.post("/register/verify", response_model=UserResponse, status_code=201)
def register_verify(data: RegisterVerify, db: Session = Depends(get_db)) -> User:
    return verify_registration(db, data)


@router.post("/register/resend", response_model=VerificationStarted)
def register_resend(data: RegisterResend, db: Session = Depends(get_db)) -> VerificationStarted:
    return resend_registration_code(db, data.email)


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> TokenResponse:
    token = login_user(db, UserLogin(email=form_data.username, password=form_data.password))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
