from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    job_count: int
    cv_count: int
    application_count: int
    interview_count: int
    offer_count: int
    furthest_pipeline_stage: str
