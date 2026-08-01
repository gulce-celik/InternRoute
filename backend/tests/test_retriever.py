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
                "chroma_collection_interviews": "internroute_interviews",
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


def test_upsert_interview_turn_and_count(chroma: ChromaStore):
    assert chroma.count_user_interview_turns(4) == 0

    written = chroma.upsert_interview_turn(
        user_id=4,
        session_id=12,
        job_id=3,
        cv_id=8,
        turn_index=1,
        question="Why do you want this internship?",
        answer="I want to build APIs with FastAPI and grow as a backend engineer.",
        feedback="Good motivation; add a concrete project example.",
    )
    assert written == 1
    assert chroma.count_user_interview_turns(4) == 1

    # Idempotent upsert for the same turn id
    chroma.upsert_interview_turn(
        user_id=4,
        session_id=12,
        job_id=3,
        cv_id=8,
        turn_index=1,
        question="Why do you want this internship?",
        answer="Updated answer about FastAPI and SQLAlchemy.",
        feedback="Clearer.",
    )
    assert chroma.count_user_interview_turns(4) == 1

    chroma.upsert_interview_turn(
        user_id=4,
        session_id=12,
        job_id=3,
        cv_id=8,
        turn_index=2,
        question="Tell me about a team conflict.",
        answer="We disagreed on API design and compromised with a spike.",
    )
    assert chroma.count_user_interview_turns(4) == 2

    chroma.delete_interview_session_turns(user_id=4, session_id=12)
    assert chroma.count_user_interview_turns(4) == 0


def test_upsert_interview_turn_skips_empty(chroma: ChromaStore):
    assert (
        chroma.upsert_interview_turn(
            user_id=1,
            session_id=1,
            job_id=1,
            cv_id=1,
            turn_index=0,
            question="  ",
            answer="",
        )
        == 0
    )
