# InternRoute

**AI Destekli Kişisel Kariyer ve Staj Yönetim Üssü**

📋 **Scrum Board:** [InternRoute Bootcamp 2026 on Trello](https://trello.com/b/yTUmFEoB/internroutebootcamp2026)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)

> 6 haftalık Scrum metodolojisiyle yürütülen bootcamp projesi

---

## Proje Özeti

**InternRoute**, bir iş ilanı arama motoru veya web scraper değildir. Kullanıcıların **kendi buldukları** kurumsal staj ve iş ilanlarını manuel olarak sisteme girdikleri, her ilan için kullandıkları **spesifik CV versiyonunu** yükleyerek eşleştirdikleri ve **mülakat süreçlerini** yönettikleri bir platformdur.

Uygulamanın temel amacı, kullanıcının başvuru geçmişini bir **hafıza (RAG)** olarak kullanıp, **Multi-Agent** yapay zeka ajanları aracılığıyla adayı mülakatlara hazırlamak ve şirkete/ilana özel **niyet mektupları (cover letter)** üretmektir.

### Temel İş Akışı

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  İlan + CV  │────▶│  Dashboard   │────▶│  Hafıza (RAG)   │
│  Yükleme    │     │  Eşleştirme  │     │  Vektör DB      │
└─────────────┘     └──────────────┘     └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    ▼                             ▼                             ▼
            ┌───────────────┐           ┌─────────────────┐           ┌─────────────────┐
            │ Analiz Ajanı  │──────────▶│ Metin Yazarı    │           │ İK Ajanı        │
            │ Güçlü/Eksik   │           │ Cover Letter    │           │ Mock Mülakat    │
            │ Yön Analizi   │           │ Üretimi         │           │ Soru-Cevap      │
            └───────────────┘           └─────────────────┘           └─────────────────┘
```

---

## Temel Özellikler

| Modül | Açıklama |
|-------|----------|
| **İlan & CV Eşleştirme** | Kullanıcı ilan detaylarını ve o ilana özel PDF CV'sini yükler; sistem "hangi ilana hangi CV ile başvuruldu" bilgisini tutar |
| **Hafıza & RAG** | CV yetkinlikleri ve geçmiş mülakat yanıtları vektör veritabanına gömülür; yeni ilan hazırlığında bağlam olarak kullanılır |
| **Multi-Agent Orkestrasyon** | Analiz, Metin Yazarı ve İK ajanları birbirleriyle koordineli çalışır |
| **Mock Mülakat** | İlana özel sorularla deneme mülakatı; yanıtlar hafızaya işlenir |

### Multi-Agent Mimarisi

| Ajan | Rol |
|------|-----|
| **Analiz Ajanı** | İlan metni ile RAG'dan gelen CV verisini karşılaştırır; eksikleri ve güçlü yönleri çıkarır |
| **Metin Yazarı Ajanı** | Analiz çıktısıyla şirket kültürüne uygun özelleştirilmiş niyet mektubu yazar |
| **İK Ajanı** | Öğrenciye ilana özel sorular sorarak mock mülakat yapar; yanıtları veritabanına kaydeder |

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Python, FastAPI |
| **AI Orchestration** | LangChain |
| **Vector Database** | ChromaDB |
| **LLM API** | Google Gemini API |
| **Frontend** | React + Vite + TypeScript |
| **Veri Doğrulama** | Pydantic v2 |

---

## Klasör Yapısı

```
InternRoute/
├── backend/                    # FastAPI uygulaması
│   ├── app/
│   │   ├── api/                # REST endpoint'leri (routes)
│   │   ├── core/               # Konfigürasyon, güvenlik, bağımlılıklar
│   │   ├── models/             # Veritabanı modelleri (ORM)
│   │   ├── schemas/            # Pydantic request/response şemaları
│   │   ├── services/           # İş mantığı katmanı
│   │   ├── agents/             # Multi-Agent modülleri
│   │   │   ├── analyzer/       # Analiz Ajanı
│   │   │   ├── writer/         # Metin Yazarı Ajanı
│   │   │   └── hr_mock/        # İK / Mock Mülakat Ajanı
│   │   └── rag/                # RAG pipeline
│   │       ├── embeddings/     # Vektör gömme işlemleri
│   │       ├── retriever/      # Benzerlik arama & bağlam çekme
│   │       └── pipeline/       # Ingestion & indexing akışı
│   ├── tests/                  # Backend testleri
│   └── requirements.txt        # Python bağımlılıkları
│
├── frontend/                   # React (Vite) uygulaması
│   └── src/
│       ├── components/         # Yeniden kullanılabilir UI bileşenleri
│       ├── pages/              # Sayfa düzeyi görünümler
│       ├── services/           # API istemcisi
│       ├── hooks/              # Custom React hook'ları
│       ├── types/              # TypeScript tip tanımları
│       └── utils/              # Yardımcı fonksiyonlar
│
├── docs/                       # Proje dokümantasyonu
│   ├── architecture.md         # Mimari kararlar & diyagramlar
│   ├── api-design.md           # API endpoint tasarımı (taslak)
│   └── sprint-plan.md          # 6 haftalık Scrum planı
│
├── scripts/                    # Geliştirme & deployment scriptleri
├── .env.example                # Ortam değişkenleri şablonu
├── docker-compose.yml          # Servis orkestrasyonu (taslak)
└── README.md
```

---

## Kurulum (Geliştirme — Sprint 1'de tamamlanacak)

> Bu bölüm proje iskelet aşamasındadır. Kod implementasyonu Sprint 1'de başlayacaktır.

### Ön Gereksinimler

- Python 3.11+
- Node.js 20+
- Git
- Google Gemini API anahtarı

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp ../.env.example ../.env
# .env dosyasında GEMINI_API_KEY değerini güncelleyin

# Uygulamayı başlat (Sprint 1'de aktif olacak)
# uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp ../.env.example .env.local

# Geliştirme sunucusu (Sprint 1'de aktif olacak)
# npm run dev
```

### Docker (Opsiyonel — Sprint 4+)

```bash
docker-compose up -d
```

---

## 6 Haftalık Scrum Planı (Özet)

| Sprint | Hafta | Odak |
|--------|-------|------|
| Sprint 1 | 1 | Proje kurulumu, auth, temel CRUD (ilan & CV yükleme) |
| Sprint 2 | 2 | Dashboard, ilan-CV eşleştirme, dosya yönetimi |
| Sprint 3 | 3 | RAG pipeline, ChromaDB entegrasyonu, embedding |
| Sprint 4 | 4 | Analiz & Metin Yazarı ajanları, cover letter üretimi |
| Sprint 5 | 5 | İK Ajanı, mock mülakat akışı, hafıza güncelleme |
| Sprint 6 | 6 | Test, UI polish, deployment, demo hazırlığı |

Detaylı plan için: [`docs/sprint-plan.md`](docs/sprint-plan.md)

---

## API Tasarımı (Taslak)

Temel endpoint grupları Sprint 1 planlamasında netleştirilecektir. Ön tasarım: [`docs/api-design.md`](docs/api-design.md)

---

## Katkıda Bulunma

Bu proje bootcamp kapsamında geliştirilmektedir. Katkı süreci ve branch stratejisi Sprint 0'da belirlenecektir.

---

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

## İletişim

**Geliştirici:** [gulce-celik](https://github.com/gulce-celik)

**Repository:** [github.com/gulce-celik/InternRoute](https://github.com/gulce-celik/InternRoute)
