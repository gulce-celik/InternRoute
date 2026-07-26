# Analiz Ajanı

İlan metni ile RAG'dan gelen CV verisini karşılaştırır.

## Endpoint

`POST /api/v1/agents/analyze` (JWT)

Body: `{ "job_id": 1, "cv_id": 2 }` or `{ "application_id": 3 }`

## Çıktılar

- `fit_score` (0–100)
- `summary`
- `strengths` / `gaps` / `keywords_to_add` / `recommendations`
- `rag_chunks_used`

## Implementation

`service.py` — ownership checks → RAG retrieve → Gemini JSON → `AnalyzeResponse`
