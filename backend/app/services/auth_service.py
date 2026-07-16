import logging
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import PendingRegistration, User
from app.schemas.auth import RegisterVerify, UserCreate, UserLogin, VerificationStarted
from app.services.email_service import send_verification_email

logger = logging.getLogger(__name__)


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _utcnow() -> datetime:
    return datetime.now(UTC)


def _email_failure_detail(exc: Exception) -> str:
    code = getattr(exc, "smtp_code", None)
    error = getattr(exc, "smtp_error", b"")
    if isinstance(error, bytes):
        error_text = error.decode("utf-8", errors="ignore").lower()
    else:
        error_text = str(error).lower()
    message = f"{code} {error_text} {exc}".lower()

    if "not yet activated" in message or "request activation" in message:
        return (
            "Brevo SMTP is not activated yet. In Brevo → Transactional → SMTP settings, "
            "finish step 2 Verification (or request SMTP activation), then try again."
        )
    if code == 525 or "unauthorized ip" in message:
        return (
            "Brevo blocked this computer's IP. In Brevo → Settings → Security → "
            "Authorized IPs, deactivate SMTP blocking or authorize your IP, then try again."
        )
    if code == 535 or "authentication failed" in message:
        return (
            "Email provider login failed. Check SMTP_USERNAME / SMTP_PASSWORD in .env "
            "(use the full Brevo SMTP key, not the masked ******** value), then restart the backend."
        )
    return f"Could not send verification email ({code or 'error'}). Try again in a moment."


def _deliver_code(email: str, code: str) -> tuple[bool, str | None]:
    """Try to email the code. In development, never block signup on provider failures."""
    settings = get_settings()
    include_debug = settings.debug or settings.app_env.lower() in {"development", "test"}

    try:
        emailed = send_verification_email(email, code)
    except Exception as exc:
        logger.exception("Verification email delivery failed for %s", email)
        if include_debug:
            return False, code
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=_email_failure_detail(exc),
        ) from exc

    if emailed:
        return True, None
    if include_debug:
        return False, code
    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=(
            "No email provider configured. Set RESEND_API_KEY in .env for real email delivery."
        ),
    )


def start_registration(db: Session, data: UserCreate) -> VerificationStarted:
    settings = get_settings()
    email = data.email.lower().strip()

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    code = _generate_code()
    expires_at = _utcnow() + timedelta(minutes=settings.verification_code_ttl_minutes)

    pending = db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    if pending is None:
        pending = PendingRegistration(email=email)
        db.add(pending)

    pending.hashed_password = hash_password(data.password)
    pending.full_name = data.full_name
    pending.code_hash = hash_password(code)
    pending.expires_at = expires_at

    db.commit()

    emailed, debug_code = _deliver_code(email, code)
    message = (
        "We sent a 6-digit code to your email. Enter it to finish creating your account."
        if emailed
        else "Email provider is not connected yet — use the on-screen code to finish signup."
    )
    return VerificationStarted(
        email=email,
        message=message,
        expires_in_minutes=settings.verification_code_ttl_minutes,
        emailed=emailed,
        debug_code=debug_code,
    )


def resend_registration_code(db: Session, email: str) -> VerificationStarted:
    settings = get_settings()
    normalized = email.lower().strip()
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == normalized).first()
    if pending is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration for this email. Start signup again.",
        )

    code = _generate_code()
    pending.code_hash = hash_password(code)
    pending.expires_at = _utcnow() + timedelta(minutes=settings.verification_code_ttl_minutes)
    db.commit()

    emailed, debug_code = _deliver_code(normalized, code)
    message = (
        "A new verification code was sent to your email."
        if emailed
        else "Email provider is not connected yet — use the new on-screen code."
    )
    return VerificationStarted(
        email=normalized,
        message=message,
        expires_in_minutes=settings.verification_code_ttl_minutes,
        emailed=emailed,
        debug_code=debug_code,
    )


def verify_registration(db: Session, data: RegisterVerify) -> User:
    email = data.email.lower().strip()
    pending = db.query(PendingRegistration).filter(PendingRegistration.email == email).first()
    if pending is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration. Start signup again.",
        )

    expires_at = pending.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)

    if expires_at < _utcnow():
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code expired. Start signup again.",
        )

    if not verify_password(data.code, pending.code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code",
        )

    if db.query(User).filter(User.email == email).first():
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=email,
        hashed_password=pending.hashed_password,
        full_name=pending.full_name,
    )
    db.add(user)
    db.delete(pending)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, data: UserLogin) -> User:
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if user is None or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def login_user(db: Session, data: UserLogin) -> str:
    user = authenticate_user(db, data)
    return create_access_token(str(user.id))
