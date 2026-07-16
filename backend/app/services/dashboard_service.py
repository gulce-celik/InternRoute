from sqlalchemy.orm import Session

from app.models.user import Application, ApplicationStatus, CV, Job, User

STAGE_ORDER = {
    "saved": 0,
    "applied": 1,
    "interview": 2,
    "offer": 3,
}


def _status_to_stage(status: ApplicationStatus | str) -> str:
    value = status.value if isinstance(status, ApplicationStatus) else status
    if value == "draft":
        return "saved"
    if value in STAGE_ORDER:
        return value
    return "applied"


def get_dashboard_stats(db: Session, user: User) -> dict[str, int | str]:
    jobs = db.query(Job).filter(Job.user_id == user.id).all()
    cvs = db.query(CV).filter(CV.user_id == user.id).count()
    applications = (
        db.query(Application).filter(Application.user_id == user.id).order_by(Application.created_at.desc()).all()
    )

    interview_count = sum(
        1 for application in applications if application.status == ApplicationStatus.INTERVIEW
    )
    offer_count = sum(1 for application in applications if application.status == ApplicationStatus.OFFER)

    stages = [_status_to_stage(application.status) for application in applications]
    if not stages:
        stages = [_status_to_stage(job.status) for job in jobs]

    furthest = "saved"
    for stage in stages:
        if STAGE_ORDER.get(stage, 0) > STAGE_ORDER.get(furthest, 0):
            furthest = stage

    return {
        "job_count": len(jobs),
        "cv_count": cvs,
        "application_count": len(applications),
        "interview_count": interview_count,
        "offer_count": offer_count,
        "furthest_pipeline_stage": furthest,
    }
