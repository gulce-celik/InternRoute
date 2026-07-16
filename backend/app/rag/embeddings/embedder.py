from __future__ import annotations

import hashlib
import math
import re
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
            model="models/text-embedding-004",
            google_api_key=api_key,
        )

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return self._client.embed_documents(texts)


def get_embedder(api_key: str | None) -> Embedder:
    if api_key:
        try:
            return GeminiEmbedder(api_key)
        except Exception:
            pass
    return LocalHashEmbedder()
