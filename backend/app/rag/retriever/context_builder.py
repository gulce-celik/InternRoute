"""Format retrieved chunks into prompt-ready context for agents."""

from __future__ import annotations

from app.rag.retriever.retriever import RetrievedChunk


def build_agent_context(
    chunks: list[RetrievedChunk],
    *,
    max_chars: int = 4000,
) -> str:
    """Join retrieved chunks into a labeled block agents can paste into prompts.

    Returns an empty string when nothing was retrieved so callers can branch.
    """
    if not chunks:
        return ""

    parts: list[str] = []
    used = 0
    for index, chunk in enumerate(chunks, start=1):
        block = (
            f"[CV excerpt {index} | source={chunk.source} | cv_id={chunk.cv_id}]\n"
            f"{chunk.text.strip()}"
        )
        # +2 accounts for the blank line separator between blocks.
        extra = len(block) + (2 if parts else 0)
        if parts and used + extra > max_chars:
            break
        if not parts and len(block) > max_chars:
            parts.append(block[:max_chars].rstrip() + "…")
            break
        parts.append(block)
        used += extra

    return "\n\n".join(parts)
