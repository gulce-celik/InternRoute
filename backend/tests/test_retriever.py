from pathlib import Path

import pytest

from app.rag.embeddings.embedder import LocalHashEmbedder
from app.rag.retriever import build_agent_context, retrieve_cv_context
from app.rag.retriever.retriever import RetrievedChunk
from app.rag.vectorstore import chroma_store as chroma_module
from app.rag.vectorstore.chroma_store import ChromaStore


@pytest.fixture
def chroma(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> ChromaStore:
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setattr(
        "app.rag.vectorstore.chroma_store.get_settings",
        lambda: type(
            "S",
            (),
            {
                "chroma_persist_dir": str(tmp_path / "chroma"),
                "google_api_key": None,
            },
        )(),
    )
    chroma_module._store = None
    store = ChromaStore()
    store._embedder = LocalHashEmbedder()
    yield store
    chroma_module._store = None


def test_query_returns_empty_without_chunks(chroma: ChromaStore):
    assert (
        chroma.query_cv_chunks(
            user_id=1,
            query_text="Python FastAPI internship",
            top_k=3,
        )
        == []
    )


def test_semantic_query_prefers_related_chunk(chroma: ChromaStore):
    chroma.upsert_cv_chunks(
        user_id=7,
        cv_id=1,
        filename="resume.pdf",
        chunks=[
            "Experienced pastry chef specializing in French desserts and bakery management.",
            "Built REST APIs with Python, FastAPI, and SQLAlchemy for internship platforms.",
            "Volunteer soccer coach for under-12 teams on weekends.",
        ],
    )

    hits = chroma.query_cv_chunks(
        user_id=7,
        query_text="Looking for a Python FastAPI backend intern",
        top_k=2,
    )
    assert len(hits) == 2
    assert "FastAPI" in str(hits[0]["text"])


def test_cv_id_filter_scopes_results(chroma: ChromaStore):
    chroma.upsert_cv_chunks(
        user_id=3,
        cv_id=10,
        filename="backend.pdf",
        chunks=["Strong TypeScript and React frontend skills for dashboards."],
    )
    chroma.upsert_cv_chunks(
        user_id=3,
        cv_id=11,
        filename="data.pdf",
        chunks=["Machine learning pipelines with PyTorch and scikit-learn."],
    )

    hits = chroma.query_cv_chunks(
        user_id=3,
        query_text="PyTorch machine learning engineer role",
        cv_id=11,
        top_k=3,
    )
    assert len(hits) == 1
    assert hits[0]["cv_id"] == "11"
    assert "PyTorch" in str(hits[0]["text"])


def test_retrieve_and_build_agent_context(chroma: ChromaStore):
    chroma.upsert_cv_chunks(
        user_id=9,
        cv_id=2,
        filename="cv.pdf",
        chunks=["Internship experience with Docker, CI/CD, and cloud deployments."],
    )

    chunks = retrieve_cv_context(
        user_id=9,
        query_text="DevOps internship Docker CI/CD",
        cv_id=2,
        top_k=3,
        store=chroma,
    )
    assert len(chunks) == 1
    assert isinstance(chunks[0], RetrievedChunk)

    context = build_agent_context(chunks)
    assert "CV excerpt 1" in context
    assert "Docker" in context
    assert build_agent_context([]) == ""
