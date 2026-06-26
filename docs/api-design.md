# InternRoute — API Tasarımı (Taslak)

> Endpoint'ler Sprint 1 planlamasında netleştirilecektir. Bu doküman ön tasarımdır.

**Base URL:** `http://localhost:8000/api/v1`

---

## Kimlik Doğrulama

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/auth/register` | Yeni kullanıcı kaydı |
| `POST` | `/auth/login` | Giriş, JWT token döner |
| `POST` | `/auth/refresh` | Token yenileme |

---

## İlan Yönetimi (Job Postings)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/jobs` | Kullanıcının tüm ilanlarını listele |
| `POST` | `/jobs` | Yeni ilan ekle (metin + şirket bilgisi) |
| `GET` | `/jobs/{job_id}` | İlan detayı |
| `PUT` | `/jobs/{job_id}` | İlan güncelle |
| `DELETE` | `/jobs/{job_id}` | İlan sil |

**Örnek Request Body (POST /jobs):**
```json
{
  "title": "Yazılım Stajyeri",
  "company": "Acme Teknoloji",
  "description": "İlan metni buraya...",
  "location": "İstanbul",
  "status": "applied"
}
```

---

## CV Yönetimi

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/cvs` | Kullanıcının CV versiyonlarını listele |
| `POST` | `/cvs` | Yeni CV yükle (PDF, multipart/form-data) |
| `GET` | `/cvs/{cv_id}` | CV detayı |
| `DELETE` | `/cvs/{cv_id}` | CV sil |

---

## Başvuru Eşleştirme (Applications)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/applications` | Tüm başvuruları listele (ilan + CV eşleşmesi) |
| `POST` | `/applications` | Yeni başvuru oluştur (job_id + cv_id) |
| `GET` | `/applications/{app_id}` | Başvuru detayı |
| `PATCH` | `/applications/{app_id}/status` | Başvuru durumu güncelle |

**Başvuru Durumları:** `draft` | `applied` | `interview` | `offer` | `rejected`

---

## AI Ajanları

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `POST` | `/agents/analyze` | İlan-CV uyum analizi (Analiz Ajanı) |
| `POST` | `/agents/cover-letter` | Niyet mektubu üret (Metin Yazarı Ajanı) |
| `POST` | `/agents/mock-interview/start` | Mock mülakat başlat (İK Ajanı) |
| `POST` | `/agents/mock-interview/answer` | Mülakat sorusuna yanıt ver |
| `GET` | `/agents/mock-interview/{session_id}` | Mülakat oturumu geçmişi |

---

## RAG / Hafıza

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/memory/context` | Kullanıcının RAG bağlam özetini getir |
| `POST` | `/memory/ingest` | Manuel hafıza ekleme (CV veya mülakat notu) |

---

## Dashboard

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/dashboard/stats` | Özet istatistikler (toplam başvuru, mülakat sayısı vb.) |
| `GET` | `/dashboard/timeline` | Başvuru zaman çizelgesi |

---

## Hata Yanıt Formatı

```json
{
  "detail": "Hata mesajı",
  "code": "ERROR_CODE",
  "status": 400
}
```

## Notlar

- Tüm endpoint'ler (auth hariç) JWT Bearer token gerektirecek
- Dosya yükleme endpoint'leri `multipart/form-data` kullanacak
- AI endpoint'leri streaming response desteği Sprint 5'te değerlendirilecek
