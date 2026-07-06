# Sprint 1 — Daily Scrum Kayıtları (WhatsApp)

> **Format:** Asenkron daily standup — WhatsApp grup sohbeti  
> **Sprint:** 19 Haziran – 5 Temmuz 2026 (**17 gün** → **17 daily scrum**)  
> **Facilitator:** Gülce Çelik (Scrum Master)  
> **Katılımcılar:** Gülce Çelik, Muhammed Enes Andiç  
> **Standup şablonu:** Dün ne yaptım · Bugün ne yapacağım · Engel var mı

---

## Sprint özeti

| Bilgi | Değer |
|--------|--------|
| Sprint süresi | 17 takvim günü |
| Daily scrum sayısı | **17** (her gün 1 async standup) |
| Neden WhatsApp? | Bootcamp ders saatleri ve iki kişinin farklı programları yüzünden sabit video call zor; yazılı standup daha sürdürülebilir |
| Kanıt | Bu dosyadaki diyaloglar → WhatsApp'ta aynı metinlerle SS alınacak |

---

## 19 Haziran 2026 (Cuma) — Sprint 1 · Gün 1 · Sprint Planning

**Gülce:**  
Selam Enes Sprint 1 bugün başlıyor. Grubu InternRoute daily için açtım. Bootcamp'te 5 kişilik takımız ama diğer arkadaşlara hâlâ ulaşamıyoruz — haftalardır mesajlara dönüş yok. PO ve SM rollerini ikimiz üstlenmek zorundayız gibi görünüyor, README'ye de not düşeriz.

**Muhammed:**  
Selam Gülce. Evet maalesef durum bu. Ben PO tarafındayım, sen SM + dev. Sprint 1 hedefi net: auth + FastAPI iskeleti + DB modelleri. Trello'yu bu akşam düzenlerim, US-1.1'den US-1.4'e kadar 16 puan seçtik zaten.

**Gülce:**  
Süper. Daily'leri buradan yazılı atalım — sabit saat tutamayız. Format: dün / bugün / engel. Bugün ben repo klasör yapısına bakacağım, sen Trello'da mavi story + kırmızı task kartlarını ayırırsın. Engel: yok.

**Muhammed:**  
Tamam. Dün henüz sprint başlamadı sayılır Bugün planning + board + backlog sırası. LinkedIn scraper'ı Rejected'a atıyorum — proje manuel job tracking, scraping değil. Engel yok.

---

## 20 Haziran 2026 (Cumartesi) — Gün 2

**Muhammed:**  
Daily  Dün Trello'yu Kanban'a çevirdim: Rejected → Backlog → To Do → In Progress → Done. US-1.1 auth story'sinin altına JWT, login API, register API task'larını kırmızı kart olarak ekledim. Bugün GitHub repo'yu kontrol edip README'de takım bilgisini güncelleyeceğim.

**Gülce:**  
Daily  Dün backend için boş klasör yapısını düşündüm (`app/`, `routers/`, `models/`). Bugün `requirements.txt` ve FastAPI kurulumunu deneyeceğim — `.venv` açıp ilk `main.py` taslağını atarım. Engel: yok.

**Muhammed:**  
Kartlara story point'leri de yazdım (5-3-5-3). Hoca örnek repoda puan kuralını istiyormuş, tek story sprint toplamının yarısını geçmesin diye — bizde max 5, tamam.

---

## 21 Haziran 2026 (Pazar) — Gün 3

**Gülce:**  
Daily  Dün requirements + venv kurdum, FastAPI import sorunsuz. Bugün `main.py` ve health endpoint (`GET /health`) yazıyorum — US-1.2'nin ilk task'ı. Swagger'ın açılması hedef.

**Muhammed:**  
Daily  Dün README takım kısmını İngilizce güncelledim. Bugün mimariyi bir daha okuyup auth API için endpoint listesi çıkaracağım: register, login, me. `.env.example` taslağı da bugün.

**Gülce:**  
Health route çalışınca haber veririm, sen de Trello'da US-1.2'yi In Progress'e çek.

---

## 22 Haziran 2026 (Pazartesi) — Gün 4

**Gülce:**  
Daily  Dün health endpoint + `main.py` router iskeleti bitti, `/docs` açılıyor 🎉 Bugün API router yapısını düzgün ayıracağım (`routers/auth.py` vs.) ve Pydantic settings ile `.env` okumayı bağlarım.

**Muhammed:**  
Daily  Dün endpoint taslağı + env örneği hazır. Bugün SQLAlchemy araştırıyorum — User tablosu için alanlar: email, hashed_password, is_active. Sprint 2'de Job/CV/Application da lazım ama bugün sadece User'a odaklanmayalım, sen önce config bitsin.

**Gülce:**  
Aynen, önce US-1.2 bitsin sonra US-1.3. Engel yok.

---

## 23 Haziran 2026 (Salı) — Gün 5

**Muhammed:**  
Daily  Dün User model taslağını yazdım. Bugün SQLite `internroute.db` bağlantısı + `Base` metadata create — ilk migration gibi düşün. US-1.3 In Progress.

**Gülce:**  
Daily  Dün router ayrımı ve environment config tamam, Swagger'da health görünüyor. Bugün JWT middleware'e giriyorum — `python-jose`, token expire, `get_current_user` dependency. US-1.1'in backend kısmı.

**Muhammed:**  
Password hashing bcrypt ile olsun dedik, aynı hizada gidelim. Engel yok.

---

## 24 Haziran 2026 (Çarşamba) — Gün 6

**Gülce:**  
Daily  Dün JWT middleware + bcrypt hash fonksiyonları yazıldı. Bugün `POST /register` ve `POST /login` endpoint'lerini bitirip Swagger'dan test edeceğim. Token dönüyor mu bakacağız.

**Muhammed:**  
Daily  Dün User model DB'ye düştü, tablo oluştu. Bugün Job, CV, Application modellerini **scaffold** olarak ekliyorum — Sprint 2 için hazırlık, henüz API yok. US-1.3'ün geri kalanı.

**Gülce:**  
Register'da duplicate email kontrolü ekledim. Login'de yanlış şifre 401 dönüyor, iyi. Engel yok.

---

## 25 Haziran 2026 (Perşembe) — Gün 7

**Muhammed:**  
Daily  Dün Job/CV/Application scaffold modelleri eklendi, ilişkiler kabaca tanımlı. Bugün `GET /me` endpoint — giriş yapmış kullanıcı bilgisi. Sonra frontend tarafına geçeriz artık.

**Gülce:**  
Daily  Dün register/login çalışıyor, bugün `GET /me` + auth router cleanup. US-1.1 backend task'larını Trello'da Done'a çekiyorum. Yarın React kurulumuna başlarız.

**Muhammed:**  
Frontend için Vite + React 19 + TS mi? README'de öyle yazmıştık. Bugün `npm create vite` deneyeceğim akşam.

**Gülce:**  
Evet aynen. Engel yok ikimizde de.

---

## 26 Haziran 2026 (Cuma) — Gün 8

**Muhammed:**  
Daily  Dün Vite projesi kuruldu, `frontend/` klasörü hazır. Bugün Login sayfası UI — form, email/şifre, hata mesajı. API'ye bağlamadan önce tasarım bitsin.

**Gülce:**  
Daily  Dün auth API tamam (`/register`, `/login`, `/me`). Bugün React'te `api.ts` helper + login formunu backend'e bağlıyorum. Token'ı localStorage'a kaydetme kısmı bugün.

**Muhammed:**  
InternRoute teması için koyu arka plan + mor accent kullanalım mı? Dashboard sonra gelecek zaten.

**Gülce:**  
Olur, Sprint 1'de sadece login/register/profile yeter. Engel: redirect henüz yok, login sonrası nereye gidecek onu bugün çözeriz.

---

## 27 Haziran 2026 (Cumartesi) — Gün 9

**Gülce:**  
Daily  Dün login API bağlantısı çalışıyor ama sayfa yenilenince token kayboluyordu — localStorage fix yaptım. Bugün Register sayfası + aynı auth flow.

**Muhammed:**  
Daily  Dün login UI bitti. Bugün register sayfasını wire ediyorum ve React Router kuruyorum — `/login`, `/register`, korumalı `/profile` route'ları.

**Gülce:**  
Register'dan sonra otomatik login mi yapalım yoksa login'e yönlendirelim?

**Muhammed:**  
Login'e yönlendirme daha temiz, kullanıcı bilinçli giriş yapsın. Engel yok.

---

## 28 Haziran 2026 (Pazar) — Gün 10

**Muhammed:**  
Daily  Dün register + router yapısı tamam. Bugün **protected routes** — token yoksa `/login`'e at. Layout component (navbar, çıkış butonu).

**Gülce:**  
Daily  Dün register flow test ettim, validation mesajları düzelttim. Bugün auth redirect loop bug'ı vardı — giriş yapınca sürekli login'e dönüyordu, `useEffect` ve route guard'ı fixledim. US-1.1 frontend task'ları neredeyse bitti.

**Muhammed:**  
Loop fix önemliydi, iyi yakaladın. Bugün layout + logout. Engel yok.

---

## 29 Haziran 2026 (Pazartesi) — Gün 11

**Gülce:**  
Daily  Dün redirect loop çözüldü, protected route çalışıyor  US-1.1 Done sayılır artık. Bugün **student profile API** — `GET/PATCH /profile` university, year, major, target_sectors alanları. US-1.4 başlıyor.

**Muhammed:**  
Daily  Dün layout + logout bitti, placeholder sayfalar (job board vs.) "Coming Sprint 2" yazıyor — erken iş yapmayalım README'de de öyle dursun. Bugün profile sayfası UI, form alanları API'ye bağlı.

**Gülce:**  
Aynen Sprint 2 işlerine README'de girmiyoruz şimdilik. Profil Sprint 3 AI kişiselleştirmesi için lazım dedik PO olarak sen de onayladın.

**Muhammed:**  
Kesinlikle. Engel yok.

---

## 30 Haziran 2026 (Salı) — Gün 12

**Muhammed:**  
Daily  Dün profile formu var ama PATCH henüz kaydetmiyordu. Bugün kaydet butonu + başarı mesajı + sayfa yenileyince veri kalıyor mu test. US-1.4 UI tarafı.

**Gülce:**  
Daily  Dün profile API bitti, university/year/sectors DB'ye yazılıyor. Bugün frontend profile'ı son rötuş + US-1.2 ve US-1.3 kartlarını Trello'da Done. Sprint 1 feature'ları kodda tamam sayılır.

**Muhammed:**  
SS almak için login ve profile ekranı güzel duruyor mu bakarım bugün. Product status için lazım hocaya.

**Gülce:**  
UI ss klasörüne koyarız. Engel yok.

---

## 1 Temmuz 2026 (Çarşamba) — Gün 13

**Gülce:**  
Daily  Dün profile E2E çalışıyor. Bugün **pytest** — auth route testleri: register, login, me, yanlış şifre. `backend/tests/` yapısı. US-1.5 kalite task'ı.

**Muhammed:**  
Daily  Dün login/profile screenshot'ları aldım. Bugün **Vitest** — Login component render + form submit mock. Frontend test setup (jsdom).

**Gülce:**  
Hedef: 10 pytest + 5 vitest yeşil. Engel: pytest'te DB test için geçici sqlite veya fixture lazım, bugün çözerim.

**Muhammed:**  
Tamam, ben de Vitest config'e bakıyorum.

---

## 2 Temmuz 2026 (Perşembe) — Gün 14

**Muhammed:**  
Daily  Dün Vitest 5 test geçti. Bugün `HOW_TO_START_APP.md` — venv, npm install, uvicorn, hangi portlar. Bootcamp arkadaşları da çalıştırabilsin.

**Gülce:**  
Daily  Dün pytest 10 test yeşil 🎉 Bugün testleri CI gibi son kez koşup küçük lint/import temizliği. Swagger'da tüm auth endpoint'leri dokümante mi kontrol.

**Muhammed:**  
MD dosyasına backend 8000 frontend 5173 yazıyorum. Engel yok.

---

## 3 Temmuz 2026 (Cuma) — Gün 15

**Gülce:**  
Daily  Dün testler stabil. Bugün README Sprint 1 bölümü — backlog, daily, board SS, product status, review, retro. Hoca eksik demişti, örnek repoya benzetiyoruz.

**Muhammed:**  
Daily  Dün HOW_TO_START bitti. Bugün GitHub'a Sprint 1 kanıtları — `ProjectManagement/Sprint1Documents/` board screenshot'ları (başlangıç / orta / kapanış). Trello'dan export.

**Gülce:**  
3 board SS yeterli: sprint başı Done=3, ortası Done=12, sonu Done=25 gibi timeline. Engel yok.

**Muhammed:**  
Product status için login + profile SS README'ye gidecek. Job board Sprint 2'de kalacak.

---

## 4 Temmuz 2026 (Cumartesi) — Gün 16

**Muhammed:**  
Daily  Dün board SS'leri repo'ya koydum. Bugün **Sprint Review** hazırlığı — demo senaryosu: kayıt ol → giriş → profil doldur → Swagger'da /me göster. Review notlarını README'ye yazıyorum.

**Gülce:**  
Daily  Dün README Scrum kısımları genişletildi. Bugün demo'yu baştan sona koşuyorum, kritik bug var mı bakıyorum. Sprint 2'ye taşınanlar listesi: job board, CV upload, matching, RAG.

**Muhammed:**  
Demo akışı temiz geçti dün akşam denedim. Engel yok. Yarın retro + sprint kapanış.

**Gülce:**  
Katılımcılar yine ikimiz — PO + SM. Resmi 5 kişi ama aktif 2 kişi, README'de zaten not var.

---

## 5 Temmuz 2026 (Pazar) — Gün 17 · Sprint kapanış

**Gülce:**  
Daily  / Sprint kapanış 🏁 Dün demo + review tamam. Bugün **Sprint Retrospective:** WhatsApp daily iyi gitti, task kartları işi görünür kıldı; Sprint 2'de 8 puanlık story'lere daha dikkatli estimate; testleri sprint ortasından itibaren koşalım. Sprint 1 **Done**.

**Muhammed:**  
Daily  Dün review notları README'de. Bugün retro maddelerini ekleyip GitHub push — hoca mesaj at dedi bitince. Sprint 2 planning 6 Temmuz'da: US-2.1–2.4, 26 puan.

**Gülce:**  
17/17 daily tamam  WhatsApp SS'lerini bu metinlere göre gruba yapıştırıp kanıt olarak da ekleriz. Engel yok. Sprint 2'de görüşürüz 

**Muhammed:**  
Elinize sağlık — 2 kişiyle Sprint 1'i kapattık. Sprint 2'de job tracking geliyor, InternRoute'un asıl kısmı.

---

## WhatsApp screenshot kanıtları

_Aşağıya WhatsApp sohbet ekran görüntüleri eklenecek (günlük standup mesajları ile eşleşen)._

| Dosya | Tarih | İçerik |
|-------|-------|--------|
| `daily-scrum-01.png` | 19–20 Haz | Takım durumu + planning |
| `daily-scrum-02.png` | 22–24 Haz | Backend / FastAPI / DB |
| `daily-scrum-03.png` | 26–28 Haz | Auth + React |
| `daily-scrum-04.png` | 29 Haz – 1 Tem | Profile + testler |
| `daily-scrum-05.png` | 3–5 Tem | README kanıt + sprint kapanış |

<!-- SS dosyaları eklendikçe bu tablo güncellenecek -->
