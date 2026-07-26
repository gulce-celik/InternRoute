from pydantic import BaseModel, Field, model_validator


class AnalyzeRequest(BaseModel):
    """Analyze a job vs CV. Pass job_id+cv_id, or application_id to resolve both."""

    job_id: int | None = None
    cv_id: int | None = None
    application_id: int | None = None

    @model_validator(mode="after")
    def require_ids(self) -> "AnalyzeRequest":
        if self.application_id is not None:
            return self
        if self.job_id is not None and self.cv_id is not None:
            return self
        raise ValueError(
            "Provide application_id, or both job_id and cv_id",
        )


class AnalyzeResponse(BaseModel):
    job_id: int
    cv_id: int
    application_id: int | None = None
    fit_score: int = Field(ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    keywords_to_add: list[str]
    recommendations: list[str] = Field(default_factory=list)
    rag_chunks_used: int = 0
