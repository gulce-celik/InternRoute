from collections.abc import Generator

from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


if settings.database_url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:  # noqa: ARG001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app.models.user import Application, CV, Job, User  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_user_profile_columns()
    _ensure_application_tracking_columns()
    _ensure_application_cv_nullable()


def _ensure_user_profile_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("users")}
    additions = {
        "university": "VARCHAR(255)",
        "study_year": "INTEGER",
        "major": "VARCHAR(255)",
        "target_sectors": "TEXT",
    }

    with engine.begin() as connection:
        for name, column_type in additions.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {name} {column_type}"))


def _ensure_application_tracking_columns() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "applications" not in inspector.get_table_names():
        return

    existing = {column["name"] for column in inspector.get_columns("applications")}
    additions = {
        "notes": "TEXT",
        "qa_items": "JSON",
    }

    with engine.begin() as connection:
        for name, column_type in additions.items():
            if name not in existing:
                connection.execute(
                    text(f"ALTER TABLE applications ADD COLUMN {name} {column_type}")
                )
        if "qa_items" not in existing:
            connection.execute(
                text("UPDATE applications SET qa_items = '[]' WHERE qa_items IS NULL")
            )


def _ensure_application_cv_nullable() -> None:
    """SQLite cannot ALTER NOT NULL → NULL; rebuild applications when needed."""
    if not settings.database_url.startswith("sqlite"):
        return

    inspector = inspect(engine)
    if "applications" not in inspector.get_table_names():
        return

    cv_column = next(
        (column for column in inspector.get_columns("applications") if column["name"] == "cv_id"),
        None,
    )
    if cv_column is None or cv_column.get("nullable"):
        return

    with engine.begin() as connection:
        connection.execute(text("PRAGMA foreign_keys=OFF"))
        connection.execute(
            text(
                """
                CREATE TABLE applications_new (
                    id INTEGER NOT NULL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    job_id INTEGER NOT NULL,
                    cv_id INTEGER,
                    status VARCHAR(11) NOT NULL,
                    notes TEXT,
                    qa_items JSON NOT NULL DEFAULT '[]',
                    created_at DATETIME NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY(job_id) REFERENCES jobs (id) ON DELETE CASCADE,
                    FOREIGN KEY(cv_id) REFERENCES cvs (id) ON DELETE SET NULL
                )
                """
            )
        )
        connection.execute(
            text(
                """
                INSERT INTO applications_new
                    (id, user_id, job_id, cv_id, status, notes, qa_items, created_at)
                SELECT
                    id,
                    user_id,
                    job_id,
                    cv_id,
                    status,
                    notes,
                    COALESCE(qa_items, '[]'),
                    created_at
                FROM applications
                """
            )
        )
        connection.execute(text("DROP TABLE applications"))
        connection.execute(text("ALTER TABLE applications_new RENAME TO applications"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_user_id ON applications (user_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_job_id ON applications (job_id)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_applications_cv_id ON applications (cv_id)"))
        connection.execute(text("PRAGMA foreign_keys=ON"))
