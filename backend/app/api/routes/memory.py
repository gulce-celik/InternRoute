from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.rag.vectorstore.chroma_store import get_chroma_store
from app.schemas.memory import MemoryChunk, MemoryContextResponse

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/context", response_model=MemoryContextResponse)
def read_memory_context(current_user: User = Depends(get_current_user)) -> MemoryContextResponse:
    store = get_chroma_store()
    snippets = store.get_user_context(current_user.id, limit=5)
    return MemoryContextResponse(
        cv_chunks=store.count_user_chunks(current_user.id),
        snippets=[MemoryChunk(**snippet) for snippet in snippets],
    )
