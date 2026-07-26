from __future__ import annotations

import hashlib
import math
import re
import time
from typing import Protocol


class Embedder(Protocol):
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        ...


class LocalHashEmbedder:
    """Deterministic local embedder for dev/test when Gemini API key is absent."""

    def __init__(self, dimensions: int = 384) -> None:
        self.dimensions = dimensions

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        tokens = re.findall(r"\w+", text.lower())
        if not tokens:
            tokens = ["empty"]

        vector = [0.0] * self.dimensions
        for token in tokens:
            digest = hashlib.sha256(token.encode("utf-8")).digest()
            for index, byte in enumerate(digest):
                slot = (index * 17 + byte) % self.dimensions
                vector[slot] += (byte / 255.0) - 0.5

        norm = math.sqrt(sum(value * value for value in vector)) or 1.0
        return [value / norm for value in vector]


class GeminiEmbedder:
    def __init__(self, api_key: str) -> None:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        self._client = GoogleGenerativeAIEmbeddings(
            # text-embedding-004 is retired on current Gemini API; use gemini-embedding-001.
            model="models/gemini-embedding-001",
            google_api_key=api_key,
        )

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        # Transient DNS / connectivity blips are common on some Windows networks.
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                return self._client.embed_documents(texts)
            except Exception as exc:
                last_error = exc
                message = str(exc).lower()
                retryable = any(
                    token in message
                    for token in ("getaddrinfo", "name resolution", "temporarily", "timeout", "connect")
                )
                if not retryable or attempt == 2:
                    raise
                time.sleep(1.5 * (attempt + 1))
        raise last_error  # pragma: no cover


def get_embedder(api_key: str | None) -> Embedder:
    if _usable_gemini_key(api_key):
        try:
            return GeminiEmbedder(api_key)
        except Exception:
            pass
    return LocalHashEmbedder()


def _usable_gemini_key(api_key: str | None) -> bool:
    if not api_key:
        return False
    normalized = api_key.strip().lower()
    if not normalized or normalized.startswith("your_"):
        return False
    if normalized in {"changeme", "change-me", "test", "dummy"}:
        return False
    return True
