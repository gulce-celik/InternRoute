#!/usr/bin/env python3
"""Seed a rich demo student account for screenshots / demos.

Usage (from repo root, with backend venv active):

    python scripts/seed_demo_user.py

Login:
    email:    demo@internroute.app
    password: DemoStudent2026!
"""
from __future__ import annotations

import sys
from datetime import UTC, datetime
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models.user import Application, ApplicationStatus, CV, Job, User  # noqa: E402

DEMO_EMAIL = "demo@internroute.app"
DEMO_PASSWORD = "DemoStudent2026!"


def _now() -> datetime:
    return datetime.now(UTC)


def _minimal_pdf(title: str, body: str) -> bytes:
    """Tiny valid PDF with extractable text (no external deps)."""
    content = f"BT /F1 14 Tf 50 750 Td ({title}) Tj 0 -24 Td ({body[:80]}) Tj ET"
    stream = content.encode("latin-1", errors="replace")
    objects = [
        b"1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        b"2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        (
            b"3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n"
        ),
        f"4 0 obj<< /Length {len(stream)} >>stream\n".encode() + stream + b"\nendstream\nendobj\n",
        b"5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objects:
        offsets.append(len(out))
        out.extend(obj)
    xref_start = len(out)
    out.extend(f"xref\n0 {len(offsets)}\n".encode())
    out.extend(b"0000000000 65535 f \n")
    for off in offsets[1:]:
        out.extend(f"{off:010d} 00000 n \n".encode())
    out.extend(
        f"trailer<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF\n".encode()
    )
    return bytes(out)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if existing:
            db.query(Application).filter(Application.user_id == existing.id).delete()
            db.query(CV).filter(CV.user_id == existing.id).delete()
            db.query(Job).filter(Job.user_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        user = User(
            email=DEMO_EMAIL,
            hashed_password=hash_password(DEMO_PASSWORD),
            full_name="Ayşe Demir",
            university="Istanbul Technical University",
            study_year=3,
            major="Computer Engineering",
            target_sectors="Software, AI / ML, Product",
            created_at=_now(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        jobs_data = [
            {
                "title": "Software Engineering Intern",
                "company": "Trendyol",
                "location": "Istanbul · Hybrid",
                "status": "interview",
                "description": "Backend internship on marketplace services. Java/Spring or Node.",
            },
            {
                "title": "Data Science Intern",
                "company": "Getir",
                "location": "Istanbul · On-site",
                "status": "applied",
                "description": "Support demand forecasting and experimentation analytics.",
            },
            {
                "title": "Frontend Intern",
                "company": "Peak Games",
                "location": "Remote (TR)",
                "status": "offer",
                "description": "React intern on player-facing dashboards and design system.",
            },
            {
                "title": "ML Engineering Intern",
                "company": "Sahibinden",
                "location": "Istanbul",
                "status": "applied",
                "description": "Assist ranking and search quality experiments.",
            },
            {
                "title": "Product Design Intern",
                "company": "Insider",
                "location": "Istanbul · Hybrid",
                "status": "draft",
                "description": "Saved for later — UX research + Figma prototypes for B2B tools.",
            },
            {
                "title": "Cloud Intern",
                "company": "Turkcell",
                "location": "Istanbul",
                "status": "rejected",
                "description": "Azure / Kubernetes shadowing. Received polite rejection.",
            },
        ]

        jobs: list[Job] = []
        for item in jobs_data:
            job = Job(user_id=user.id, created_at=_now(), **item)
            db.add(job)
            jobs.append(job)
        db.commit()
        for job in jobs:
            db.refresh(job)

        upload_root = BACKEND_DIR / "uploads" / "cvs" / str(user.id)
        upload_root.mkdir(parents=True, exist_ok=True)

        cv_specs = [
            ("Ayşe_Demir_General.pdf", "General CV", "Computer Engineering · Python React SQL"),
            ("Ayşe_Demir_Data.pdf", "Data track CV", "Python pandas scikit-learn SQL experiments"),
            ("Ayşe_Demir_Frontend.pdf", "Frontend CV", "React TypeScript Figma accessibility"),
        ]
        cvs: list[CV] = []
        for filename, title, body in cv_specs:
            path = upload_root / filename
            path.write_bytes(_minimal_pdf(title, body))
            cv = CV(
                user_id=user.id,
                filename=filename,
                file_path=str(path),
                created_at=_now(),
            )
            db.add(cv)
            cvs.append(cv)
        db.commit()
        for cv in cvs:
            db.refresh(cv)

        applications = [
            Application(
                user_id=user.id,
                job_id=jobs[0].id,
                cv_id=cvs[0].id,
                status=ApplicationStatus.INTERVIEW,
                notes="HR screen done. Technical round Tue 15:00. Review Spring notes.",
                qa_items=[
                    {
                        "question": "Why Trendyol?",
                        "answer": "Scale of marketplace problems + strong eng culture in TR.",
                    },
                    {
                        "question": "Favorite project?",
                        "answer": "Campus course planner — React + FastAPI, 200+ weekly users.",
                    },
                ],
                created_at=_now(),
            ),
            Application(
                user_id=user.id,
                job_id=jobs[1].id,
                cv_id=cvs[1].id,
                status=ApplicationStatus.APPLIED,
                notes="Sent via Kariyer.net. Follow up in 10 days if silent.",
                qa_items=[
                    {
                        "question": "Experience with SQL?",
                        "answer": "Course projects + internship-style ETL on synthetic retail data.",
                    }
                ],
                created_at=_now(),
            ),
            Application(
                user_id=user.id,
                job_id=jobs[2].id,
                cv_id=cvs[2].id,
                status=ApplicationStatus.OFFER,
                notes="Verbal offer — waiting for written package. Compare with Peak Games.",
                qa_items=[],
                created_at=_now(),
            ),
            Application(
                user_id=user.id,
                job_id=jobs[3].id,
                cv_id=cvs[1].id,
                status=ApplicationStatus.APPLIED,
                notes="LinkedIn Easy Apply + tailored CV. Mention ranking coursework.",
                qa_items=[],
                created_at=_now(),
            ),
            Application(
                user_id=user.id,
                job_id=jobs[5].id,
                cv_id=cvs[0].id,
                status=ApplicationStatus.REJECTED,
                notes="Rejected after online test. Keep for practice questions.",
                qa_items=[
                    {
                        "question": "Cloud experience?",
                        "answer": "Course labs on Docker; no production yet — honest answer.",
                    }
                ],
                created_at=_now(),
            ),
        ]
        for app in applications:
            db.add(app)
        db.commit()

        print("Demo user ready.")
        print(f"  email:    {DEMO_EMAIL}")
        print(f"  password: {DEMO_PASSWORD}")
        print(f"  jobs:     {len(jobs)}")
        print(f"  cvs:      {len(cvs)}")
        print(f"  apps:     {len(applications)}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
