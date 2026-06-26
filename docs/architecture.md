# InternRoute — Mimari Dokümantasyon

> Bu doküman proje iskelet aşamasındadır. Implementasyon sırasında güncellenecektir.

## Genel Bakış

InternRoute, üç katmanlı bir mimari üzerine kuruludur:

1. **Sunum Katmanı (Frontend)** — React + Vite
2. **Uygulama Katmanı (Backend)** — FastAPI REST API
3. **Zeka Katmanı (AI)** — LangChain Multi-Agent + ChromaDB RAG

## Sistem Diyagramı

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  Dashboard │ İlan Yönetimi │ CV Yükleme │ Mock Mülakat │ CL     │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────▼───────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐ │
│  │   API   │  │ Services │  │  Models  │  │  File Storage     │ │
│  │ Routes  │──│  Layer   │──│  (ORM)   │  │  (PDF uploads)    │ │
│  └────┬────┘  └────┬─────┘  └──────────┘  └───────────────────┘ │
│       │            │                                             │
│       │     ┌──────▼──────────────────────────────────────┐     │
│       │     │         AGENT ORCHESTRATOR                   │     │
│       │     │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │     │
│       │     │  │ Analyzer │→│  Writer  │ │  HR Mock     │  │     │
│       │     │  │  Agent   │ │  Agent   │ │  Agent       │  │     │
│       │     │  └────┬─────┘ └──────────┘ └──────┬───────┘  │     │
│       │     └───────┼─────────────────────────────┼──────────┘     │
│       │             │                             │                │
│       │     ┌───────▼─────────────────────────────▼──────────┐   │
│       │     │              RAG PIPELINE                       │   │
│       │     │  Embeddings → ChromaDB → Retriever → Context     │   │
│       │     └────────────────────────────────────────────────┘   │
└───────┼────────────────────────────────────────────────────────────┘
        │
┌───────▼────────┐    ┌─────────────────┐
│   ChromaDB     │    │  Gemini API     │
│  (Vector DB)   │    │  (LLM)          │
└────────────────┘    └─────────────────┘
```

## Veri Akışı

### 1. İlan & CV Yükleme
```
Kullanıcı → Frontend → POST /applications → Service → DB + File Storage
                                                    → RAG Pipeline (embedding)
```

### 2. Cover Letter Üretimi
```
Kullanıcı → POST /agents/cover-letter
         → Orchestrator
              → RAG Retriever (CV + geçmiş bağlam)
              → Analyzer Agent (güçlü/eksik analiz)
              → Writer Agent (cover letter)
         → Response
```

### 3. Mock Mülakat
```
Kullanıcı → POST /agents/mock-interview/start
         → HR Agent (ilana özel sorular)
         → Kullanıcı yanıtları → POST /agents/mock-interview/answer
         → RAG Pipeline (yanıtları hafızaya ekle)
```

## Teknoloji Kararları

| Karar | Seçim | Gerekçe |
|-------|-------|---------|
| Backend framework | FastAPI | Async destek, otomatik OpenAPI, Pydantic entegrasyonu |
| ORM | SQLAlchemy 2.x | Olgun ekosistem, async destek |
| Vector DB | ChromaDB | Yerel geliştirme kolaylığı, LangChain entegrasyonu |
| LLM | Gemini API | Ücretsiz tier, Türkçe destek, kolay entegrasyon |
| Agent framework | LangChain | Multi-agent orchestration, RAG araçları |
| Frontend | React + Vite | Hızlı dev server, TypeScript desteği, geniş ekosistem |

## Güvenlik Notları (Sprint 1+)

- API anahtarları `.env` dosyasında tutulacak, repoya commit edilmeyecek
- Yüklenen CV dosyaları kullanıcıya özel dizinlerde saklanacak
- JWT tabanlı kimlik doğrulama planlanıyor

## Açık Sorular

- [ ] Kalıcı veritabanı: SQLite (dev) / PostgreSQL (prod)?
- [ ] Kullanıcı kimlik doğrulama: JWT / OAuth?
- [ ] PDF parsing kütüphanesi: PyMuPDF / pdfplumber?
