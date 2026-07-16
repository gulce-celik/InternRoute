from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_REPO_ROOT = _BACKEND_DIR.parent
_ENV_FILES = (
    str(_REPO_ROOT / ".env"),
    str(_BACKEND_DIR / ".env"),
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "InternRoute"
    app_env: str = "development"
    debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str = "sqlite:///./internroute.db"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    upload_dir: str = "uploads/cvs"
    chroma_persist_dir: str = "chroma_data"
    google_api_key: str | None = Field(default=None, validation_alias="GEMINI_API_KEY")

    # Prefer Resend when set; otherwise SMTP (e.g. free Brevo relay).
    resend_api_key: str | None = Field(default=None, validation_alias="RESEND_API_KEY")
    resend_from: str = Field(
        default="InternRoute <onboarding@resend.dev>",
        validation_alias="RESEND_FROM",
    )

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_use_tls: bool = True
    verification_code_ttl_minutes: int = 10

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def smtp_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_from)

    @property
    def resend_configured(self) -> bool:
        return bool(self.resend_api_key)

    @property
    def email_delivery_configured(self) -> bool:
        return self.resend_configured or self.smtp_configured


def get_settings() -> Settings:
    # Do not cache: .env SMTP keys change often during local setup.
    return Settings()
