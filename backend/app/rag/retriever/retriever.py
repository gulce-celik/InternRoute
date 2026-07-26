"""Semantic CV retrieval for Sprint 3 agents."""

from __future__ import annotations

from dataclasses import dataclass

from app.rag.vectorstore.chroma_store import ChromaStore, get_chroma_store


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    source: str
    cv_id: str
    chunk_index: str
    distance: float


def retrieve_cv_context(
    *,
    user_id: int,
    query_text: str,
    cv_id: int | None = None,
    top_k: int = 5,
    store: ChromaStore | None = None,
) -> list[RetrievedChunk]:
    """Return the top-k CV chunks most similar to ``query_text``.

    Typical ``query_text`` is a job description (or a short focus prompt).
    Results are scoped to ``user_id`` and optionally a single ``cv_id``.
    """
    chroma = store or get_chroma_store()
    raw_hits = chroma.query_cv_chunks(
        user_id=user_id,
        query_text=query_text,
        cv_id=cv_id,
        top_k=top_k,
    )
    return [
        RetrievedChunk(
            text=str(hit["text"]),
            source=str(hit["source"]),
            cv_id=str(hit["cv_id"]),
            chunk_index=str(hit["chunk_index"]),
            distance=float(hit["distance"]),
        )
        for hit in raw_hits
    ]
