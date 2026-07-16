from __future__ import annotations

from pathlib import Path

from app.rag.pipeline.pdf_extractor import chunk_text, extract_text_from_pdf
from app.rag.vectorstore.chroma_store import get_chroma_store


def ingest_cv_pdf(*, user_id: int, cv_id: int, filename: str, file_path: str) -> int:
    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)
    store = get_chroma_store()
    store.delete_cv_chunks(user_id=user_id, cv_id=cv_id)
    return store.upsert_cv_chunks(
        user_id=user_id,
        cv_id=cv_id,
        filename=filename,
        chunks=chunks,
    )
