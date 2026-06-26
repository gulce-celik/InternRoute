# Multi-Agent Modülleri

LangChain tabanlı çoklu ajan orkestrasyonu.

## Ajanlar

| Dizin | Ajan | Görev |
|-------|------|-------|
| `analyzer/` | Analiz Ajanı | İlan-CV uyum analizi, güçlü/eksik yönler |
| `writer/` | Metin Yazarı Ajanı | Özelleştirilmiş cover letter üretimi |
| `hr_mock/` | İK Ajanı | Mock mülakat soruları ve değerlendirme |

## Orkestrasyon

Sprint 4'te `orchestrator.py` eklenecek — ajanlar arası veri akışını yönetecek.

```
Analyzer → Writer  (cover letter akışı)
HR Mock  → RAG    (mülakat yanıtları hafızaya)
```
