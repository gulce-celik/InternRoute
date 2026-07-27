# Metin Yazarı Ajanı

Cover letter drafts grounded in job text + CV RAG (+ optional Analyzer summary).

## Endpoint

`POST /api/v1/agents/cover-letter` (JWT)

Body: `{ "job_id": 1, "cv_id": 2 }` or `{ "application_id": 3 }`

Optional: `analysis_summary`, `notes`, `tone`, `save` (defaults to true when `application_id` is set).

## Outputs

- `subject_line`
- `letter`
- `rag_chunks_used`
- `saved` — true when persisted on the application

## Implementation

`service.py` — resolve targets → RAG → Gemini JSON → optional Application.cover_letter save
