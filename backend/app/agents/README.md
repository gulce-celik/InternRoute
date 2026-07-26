# Multi-Agent Modülleri

LangChain + Google Gemini chat for Sprint 3 agents.

## Shared LLM

| File | Role |
|------|------|
| `llm.py` | `get_chat_model` / `require_chat_model` / `invoke_chat` — shared Gemini client |

Env: `GEMINI_API_KEY`, `GEMINI_MODEL` (see repo `.env.example`).

Status probe: `GET /api/v1/agents/status` (JWT required).

## Ajanlar

| Dizin | Ajan | Görev |
|-------|------|-------|
| `analyzer/` | Analiz Ajanı | İlan-CV uyum analizi, güçlü/eksik yönler |
| `writer/` | Metin Yazarı Ajanı | Özelleştirilmiş cover letter üretimi |
| `hr_mock/` | İK Ajanı | Mock mülakat soruları ve değerlendirme |

## Orkestrasyon

Thin services call `invoke_chat` + RAG retriever (no heavy LangGraph required for delivery).

```
Analyzer → Writer  (cover letter akışı)
HR Mock  → RAG    (mülakat yanıtları hafızaya)
```
