# InternRoute — 6 Haftalık Scrum Sprint Planı

> Bootcamp süresince Scrum metodolojisiyle yürütülecek geliştirme planı.

---

## Sprint 0 — Hazırlık (Ön Hafta)

**Hedef:** Proje iskeleti, repo kurulumu, ekip/rol dağılımı

### Backlog
- [x] GitHub repository oluşturma
- [x] Klasör yapısı ve README
- [x] Mimari dokümantasyon taslağı
- [ ] Geliştirme ortamı kurulumu (Python, Node, API key)
- [ ] Scrum board oluşturma (GitHub Projects / Trello)
- [ ] Branch stratejisi belirleme (`main`, `develop`, `feature/*`)

### Definition of Done (DoD)
- Kod review yapılmış
- README güncel
- Temel testler geçiyor (Sprint 2+)

---

## Sprint 1 — Temel Altyapı (Hafta 1)

**Hedef:** FastAPI iskeleti, veritabanı, temel auth

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-1.1 | Kullanıcı olarak kayıt olup giriş yapabilmek istiyorum | 5 |
| US-1.2 | Geliştirici olarak FastAPI projesini çalıştırabilmek istiyorum | 3 |
| US-1.3 | Geliştirici olarak veritabanı modellerini tanımlayabilmek istiyorum | 5 |

### Teknik Görevler
- [ ] FastAPI `main.py` ve router yapısı
- [ ] SQLAlchemy modelleri: User, Job, CV, Application
- [ ] JWT auth middleware
- [ ] `.env` konfigürasyon yönetimi
- [ ] React + Vite proje kurulumu
- [ ] Temel login/register sayfaları (UI iskelet)

### Sprint Review Çıktıları
- Çalışan auth akışı
- Swagger UI (`/docs`) erişilebilir

---

## Sprint 2 — İlan & CV Yönetimi (Hafta 2)

**Hedef:** Dashboard, ilan ekleme, CV yükleme, eşleştirme

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-2.1 | Kullanıcı olarak manuel ilan ekleyebilmek istiyorum | 5 |
| US-2.2 | Kullanıcı olarak PDF CV yükleyebilmek istiyorum | 5 |
| US-2.3 | Kullanıcı olarak hangi ilana hangi CV ile başvurduğumu görebilmek istiyorum | 8 |

### Teknik Görevler
- [ ] Job CRUD API endpoint'leri
- [ ] CV upload (PDF) + dosya depolama
- [ ] Application eşleştirme servisi
- [ ] Dashboard sayfası (frontend)
- [ ] İlan listesi ve detay görünümleri
- [ ] Başvuru durumu güncelleme (applied, interview, rejected)

### Sprint Review Çıktıları
- Tam işlevsel dashboard
- İlan + CV + eşleştirme akışı uçtan uca

---

## Sprint 3 — RAG Pipeline (Hafta 3)

**Hedef:** ChromaDB entegrasyonu, CV ve mülakat verisi embedding

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-3.1 | Sistem olarak yüklenen CV'leri vektör veritabanına gömebilmek istiyorum | 8 |
| US-3.2 | Sistem olarak geçmiş mülakat yanıtlarını hafızaya ekleyebilmek istiyorum | 5 |
| US-3.3 | Geliştirici olarak RAG bağlamını sorgulayabilmek istiyorum | 5 |

### Teknik Görevler
- [ ] ChromaDB kurulumu ve koleksiyon yapısı
- [ ] PDF → metin çıkarma (PyMuPDF / pdfplumber)
- [ ] Embedding pipeline (Gemini embeddings veya alternatif)
- [ ] Retriever servisi (benzerlik arama)
- [ ] Ingestion trigger: CV yüklendiğinde otomatik embed
- [ ] Memory context API endpoint'i

### Sprint Review Çıktıları
- CV yüklendiğinde otomatik vektörleştirme
- RAG bağlam sorgusu çalışıyor

---

## Sprint 4 — Analiz & Cover Letter Ajanları (Hafta 4)

**Hedef:** Analiz Ajanı ve Metin Yazarı Ajanı implementasyonu

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-4.1 | Kullanıcı olarak ilan-CV uyum analizi görmek istiyorum | 8 |
| US-4.2 | Kullanıcı olarak ilana özel niyet mektubu ürettirmek istiyorum | 8 |
| US-4.3 | Kullanıcı olarak üretilen metni düzenleyip kaydedebilmek istiyorum | 3 |

### Teknik Görevler
- [ ] LangChain agent orchestrator yapısı
- [ ] Analyzer Agent: ilan vs CV karşılaştırma prompt'u
- [ ] Writer Agent: cover letter üretim prompt'u
- [ ] Agent → RAG retriever entegrasyonu
- [ ] `/agents/analyze` ve `/agents/cover-letter` endpoint'leri
- [ ] Frontend: analiz sonucu ve cover letter görünümü

### Sprint Review Çıktıları
- Tek tıkla cover letter üretimi
- Güçlü/eksik yön analizi raporu

---

## Sprint 5 — Mock Mülakat Ajanı (Hafta 5)

**Hedef:** İK Ajanı ile interaktif mock mülakat

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-5.1 | Kullanıcı olarak ilana özel mock mülakat yapabilmek istiyorum | 13 |
| US-5.2 | Kullanıcı olarak mülakat yanıtlarımın hafızaya kaydedildiğini bilmek istiyorum | 5 |
| US-5.3 | Kullanıcı olarak geçmiş mülakat oturumlarımı görebilmek istiyorum | 5 |

### Teknik Görevler
- [ ] HR Mock Agent: soru üretim ve değerlendirme
- [ ] Mülakat oturumu state yönetimi
- [ ] Yanıt → RAG ingestion pipeline
- [ ] Mock interview chat UI (frontend)
- [ ] Oturum geçmişi listesi

### Sprint Review Çıktıları
- Uçtan uca mock mülakat deneyimi
- Yanıtlar hafızaya işleniyor

---

## Sprint 6 — Test, Polish & Demo (Hafta 6)

**Hedef:** Kalite, UI iyileştirme, deployment, bootcamp demo

### User Stories
| ID | Story | Puan |
|----|-------|------|
| US-6.1 | Kullanıcı olarak tutarlı ve kullanılabilir bir arayüz istiyorum | 5 |
| US-6.2 | Geliştirici olarak temel testlerin geçtiğini doğrulamak istiyorum | 5 |
| US-6.3 | Ekip olarak canlı demo yapabilmek istiyoruz | 3 |

### Teknik Görevler
- [ ] Backend unit & integration testleri
- [ ] Frontend bileşen testleri (opsiyonel)
- [ ] UI/UX polish (responsive, loading states, error handling)
- [ ] Docker Compose finalizasyonu
- [ ] Deployment (Railway / Render / Vercel — karar verilecek)
- [ ] Demo senaryosu hazırlığı
- [ ] README ve dokümantasyon güncelleme

### Sprint Review Çıktıları
- Deploy edilmiş uygulama
- Bootcamp final demo

---

## Ceremonies

| Etkinlik | Sıklık | Süre |
|----------|--------|------|
| Daily Standup | Her gün | 15 dk |
| Sprint Planning | Sprint başı | 1 saat |
| Sprint Review | Sprint sonu | 30 dk |
| Sprint Retrospective | Sprint sonu | 30 dk |

## Velocity Takibi

Her sprint sonunda tamamlanan story point'ler kaydedilecek. İlk sprint'ten sonra ortalama velocity hesaplanacak.
