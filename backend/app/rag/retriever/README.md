# Retriever

Semantic search over ChromaDB CV chunks for Sprint 3 agents.

## Modules

| File | Role |
|------|------|
| `retriever.py` | `retrieve_cv_context` — top-k similarity search by job/query text |
| `context_builder.py` | `build_agent_context` — format chunks for LLM prompts |

## Usage

```python
from app.rag.retriever import build_agent_context, retrieve_cv_context

chunks = retrieve_cv_context(
    user_id=user.id,
    query_text=job.description,
    cv_id=cv.id,
    top_k=5,
)
context = build_agent_context(chunks)
```

Filters: always by `user_id`; optionally by `cv_id`.  
`GET /memory/context` remains the non-semantic technical preview.
