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


class CoverLetterRequest(BaseModel):
    """Draft a cover letter for a job + CV (or linked application)."""

    job_id: int | None = None
    cv_id: int | None = None
    application_id: int | None = None
    analysis_summary: str | None = Field(
        default=None,
        description="Optional Analyzer summary / notes to steer the letter",
    )
    notes: str | None = Field(
        default=None,
        description="Extra student instructions (length, emphasis, language)",
    )
    tone: str | None = Field(default="professional", max_length=80)
    save: bool | None = Field(
        default=None,
        description="Persist on application when application_id is set (default true in that case)",
    )

    @model_validator(mode="after")
    def require_ids(self) -> "CoverLetterRequest":
        if self.application_id is not None:
            return self
        if self.job_id is not None and self.cv_id is not None:
            return self
        raise ValueError(
            "Provide application_id, or both job_id and cv_id",
        )


class CoverLetterResponse(BaseModel):
    job_id: int
    cv_id: int
    application_id: int | None = None
    subject_line: str = ""
    letter: str
    rag_chunks_used: int = 0
    saved: bool = False
