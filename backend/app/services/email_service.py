import logging
import smtplib
from email.message import EmailMessage

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _message_body(code: str, ttl_minutes: int) -> str:
    return (
        f"Your InternRoute verification code is: {code}\n\n"
        f"It expires in {ttl_minutes} minutes.\n"
        "If you did not try to create an account, you can ignore this email."
    )


def _send_via_resend(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.resend_from,
            "to": [to_email],
            "subject": subject,
            "text": body,
        },
        timeout=20.0,
    )
    if response.is_error:
        detail = response.text
        logger.error("Resend failed (%s): %s", response.status_code, detail)
        raise RuntimeError(f"Resend error {response.status_code}: {detail}")


def _send_via_smtp(to_email: str, subject: str, body: str) -> None:
    settings = get_settings()
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username and settings.smtp_password:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


def send_verification_email(to_email: str, code: str) -> bool:
    """Deliver signup code. Returns True if emailed, False if only logged (dev fallback)."""
    settings = get_settings()
    subject = "Your InternRoute verification code"
    body = _message_body(code, settings.verification_code_ttl_minutes)

    if settings.resend_configured:
        try:
            _send_via_resend(to_email, subject, body)
            return True
        except Exception:
            logger.exception("Failed to send verification email via Resend to %s", to_email)
            raise

    if settings.smtp_configured:
        try:
            _send_via_smtp(to_email, subject, body)
            return True
        except Exception:
            logger.exception("Failed to send verification email via SMTP to %s", to_email)
            raise

    logger.info("No email provider configured — verification code for %s: %s", to_email, code)
    return False
