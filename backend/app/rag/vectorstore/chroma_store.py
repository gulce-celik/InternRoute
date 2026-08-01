from __future__ import annotations

from pathlib import Path

import chromadb
from chromadb.api.models.Collection import Collection

from app.core.config import get_settings
from app.rag.embeddings.embedder import get_embedder

CV_COLLECTION = "internroute_cv"
DEFAULT_INTERVIEW_COLLECTION = "internroute_interviews"


class ChromaStore:
    def __init__(self) -> None:
        settings = get_settings()
        persist_dir = Path(settings.chroma_persist_dir)
        persist_dir.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(persist_dir))
        self._embedder = get_embedder(settings.google_api_key)
        self._interview_collection_name = (
            getattr(settings, "chroma_collection_interviews", None)
            or DEFAULT_INTERVIEW_COLLECTION
        )

    def _cv_collection(self) -> Collection:
        return self._client.get_or_create_collection(
            name=CV_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )

    def _interview_collection(self) -> Collection:
        return self._client.get_or_create_collection(
            name=self._interview_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def upsert_cv_chunks(
        self,
        *,
        user_id: int,
        cv_id: int,
        filename: str,
        chunks: list[str],
    ) -> int:
        if not chunks:
            return 0

        collection = self._cv_collection()
        embeddings = self._embedder.embed_texts(chunks)
        ids = [f"user-{user_id}-cv-{cv_id}-chunk-{index}" for index in range(len(chunks))]
        metadatas = [
            {
                "user_id": str(user_id),
                "cv_id": str(cv_id),
                "filename": filename,
                "chunk_index": str(index),
            }
            for index in range(len(chunks))
        ]

        collection.upsert(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        return len(chunks)

    def delete_cv_chunks(self, *, user_id: int, cv_id: int) -> None:
        collection = self._cv_collection()
        existing = collection.get(
            where={"$and": [{"user_id": str(user_id)}, {"cv_id": str(cv_id)}]},
        )
        if existing["ids"]:
            collection.delete(ids=existing["ids"])

    def get_user_context(self, user_id: int, limit: int = 5) -> list[dict[str, str]]:
        collection = self._cv_collection()
        results = collection.get(
            where={"user_id": str(user_id)},
            include=["documents", "metadatas"],
        )

        documents = results.get("documents") or []
        metadatas = results.get("metadatas") or []
        pairs = list(zip(documents, metadatas, strict=False))
        # Prefer longer, more useful chunks for the technical preview (avoid tiny contact fragments).
        pairs.sort(key=lambda pair: len(pair[0] or ""), reverse=True)

        snippets: list[dict[str, str]] = []
        for document, metadata in pairs:
            filename = metadata.get("filename", "cv.pdf") if metadata else "cv.pdf"
            snippet = _preview_snippet(document or "")
            if len(snippet) < 20:
                continue
            snippets.append({"source": filename, "snippet": snippet})
            if len(snippets) >= limit:
                break

        return snippets

    def query_cv_chunks(
        self,
        *,
        user_id: int,
        query_text: str,
        cv_id: int | None = None,
        top_k: int = 5,
    ) -> list[dict[str, str | float]]:
        """Semantic search over a user's CV chunks (optional single-CV filter)."""
        cleaned = (query_text or "").strip()
        if not cleaned or top_k <= 0:
            return []

        collection = self._cv_collection()
        if self.count_user_chunks(user_id) == 0:
            return []

        where = (
            {"$and": [{"user_id": str(user_id)}, {"cv_id": str(cv_id)}]}
            if cv_id is not None
            else {"user_id": str(user_id)}
        )

        # Cap n_results to available rows so Chroma does not error on small collections.
        available = collection.get(where=where, include=[])
        available_count = len(available.get("ids") or [])
        if available_count == 0:
            return []

        query_embedding = self._embedder.embed_texts([cleaned])[0]
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, available_count),
            where=where,
            include=["documents", "metadatas", "distances"],
        )

        documents = (results.get("documents") or [[]])[0]
        metadatas = (results.get("metadatas") or [[]])[0]
        distances = (results.get("distances") or [[]])[0]

        hits: list[dict[str, str | float]] = []
        for document, metadata, distance in zip(documents, metadatas, distances, strict=False):
            if not document:
                continue
            meta = metadata or {}
            hits.append(
                {
                    "text": document,
                    "source": str(meta.get("filename") or "cv.pdf"),
                    "cv_id": str(meta.get("cv_id") or ""),
                    "chunk_index": str(meta.get("chunk_index") or ""),
                    "distance": float(distance),
                }
            )
        return hits

    def count_user_chunks(self, user_id: int) -> int:
        collection = self._cv_collection()
        results = collection.get(where={"user_id": str(user_id)}, include=[])
        return len(results.get("ids") or [])

    def upsert_interview_turn(
        self,
        *,
        user_id: int,
        session_id: int,
        job_id: int,
        cv_id: int,
        turn_index: int,
        question: str,
        answer: str,
        feedback: str | None = None,
    ) -> int:
        """Persist one mock-interview Q&A turn into the interviews collection."""
        q = (question or "").strip()
        a = (answer or "").strip()
        if not q and not a:
            return 0

        parts = [f"Q: {q}", f"A: {a}"]
        fb = (feedback or "").strip()
        if fb:
            parts.append(f"Feedback: {fb}")
        document = "\n".join(parts)

        collection = self._interview_collection()
        doc_id = f"user-{user_id}-session-{session_id}-turn-{turn_index}"
        embedding = self._embedder.embed_texts([document])[0]
        collection.upsert(
            ids=[doc_id],
            documents=[document],
            embeddings=[embedding],
            metadatas=[
                {
                    "user_id": str(user_id),
                    "session_id": str(session_id),
                    "job_id": str(job_id),
                    "cv_id": str(cv_id),
                    "turn_index": str(turn_index),
                }
            ],
        )
        return 1

    def delete_interview_session_turns(self, *, user_id: int, session_id: int) -> None:
        collection = self._interview_collection()
        existing = collection.get(
            where={
                "$and": [
                    {"user_id": str(user_id)},
                    {"session_id": str(session_id)},
                ]
            },
        )
        if existing["ids"]:
            collection.delete(ids=existing["ids"])

    def count_user_interview_turns(self, user_id: int) -> int:
        collection = self._interview_collection()
        results = collection.get(where={"user_id": str(user_id)}, include=[])
        return len(results.get("ids") or [])


def _preview_snippet(text: str, max_len: int = 280) -> str:
    cleaned = " ".join(text.split()).strip()
    if not cleaned:
        return ""
    if len(cleaned) <= max_len:
        return cleaned

    clipped = cleaned[:max_len]
    # Prefer cutting on a word boundary so previews don't look broken mid-word.
    if " " in clipped:
        clipped = clipped.rsplit(" ", 1)[0]
    return f"{clipped.strip()}…"


_store: ChromaStore | None = None


def get_chroma_store() -> ChromaStore:
    global _store
    if _store is None:
        _store = ChromaStore()
    return _store
