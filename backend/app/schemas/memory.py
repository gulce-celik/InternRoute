from pydantic import BaseModel


class MemoryChunk(BaseModel):
    source: str
    snippet: str


class MemoryContextResponse(BaseModel):
    cv_chunks: int
    snippets: list[MemoryChunk]
