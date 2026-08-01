# İK / Mock Mülakat Ajanı

Öğrenciye ilana özel sorular sorarak deneme mülakatı yapar.

## Akış

1. İlan + CV bağlamını al (`resolve_job_cv` + RAG)
2. `POST /agents/mock-interview/start` — ilk soru + `InterviewSession`
3. `POST /agents/mock-interview/answer` — feedback + sonraki soru (5–7 tur)
4. Yanıtları `internroute_interviews` koleksiyonuna kaydet
5. `GET /agents/mock-interview` / `{session_id}` — geçmiş

## Sprint: 3
