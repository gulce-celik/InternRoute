# How to Start InternRoute (Local Development)

Use **two terminals** — one for the backend, one for the frontend.

---

## Prerequisites

- **Python 3.11+** with backend virtualenv already created
- **Node.js 20+** (you have v24 at `C:\Program Files\nodejs\`)
- Project folder: `c:\Users\gulce\Desktop\bootcamp`

First-time setup (only if not done yet):

```powershell
# Backend
cd c:\Users\gulce\Desktop\bootcamp\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd c:\Users\gulce\Desktop\bootcamp\frontend
npm install
```

Optional env files:

```powershell
# Root .env (backend reads from backend/ or copy values as needed)
copy c:\Users\gulce\Desktop\bootcamp\.env.example c:\Users\gulce\Desktop\bootcamp\.env

# Frontend API URL (optional — default is http://localhost:8000/api/v1)
# Create frontend/.env.local with:
# VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Terminal 1 — Backend (FastAPI)

```powershell
cd c:\Users\gulce\Desktop\bootcamp\backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

You should see:

```text
Uvicorn running on http://127.0.0.1:8000
```

**Check:** open http://localhost:8000/api/v1/health — should return `{"status":"ok"}`  
**API docs:** http://localhost:8000/docs

Leave this terminal open. Closing it stops the backend.

---

## Terminal 2 — Frontend (React + Vite)

```powershell
cd c:\Users\gulce\Desktop\bootcamp\frontend
npm run dev
```

If `npm` is not recognized, use the full path:

```powershell
cd c:\Users\gulce\Desktop\bootcamp\frontend
& "C:\Program Files\nodejs\npm.cmd" run dev
```

You should see:

```text
Local:   http://localhost:5173/
```

**Open the app:** http://localhost:5173

Leave this terminal open. Closing it (or closing Cursor) stops the frontend.

---

## Quick reference

| Service   | URL                                      |
|-----------|------------------------------------------|
| App (UI)  | http://localhost:5173                    |
| Backend   | http://localhost:8000                    |
| Health    | http://localhost:8000/api/v1/health      |
| Swagger   | http://localhost:8000/docs               |

---

## Run tests (optional)

From project root:

```powershell
cd c:\Users\gulce\Desktop\bootcamp
python scripts/run-all-tests.py
```

Backend only:

```powershell
python scripts/run-backend-tests.py
```

Frontend only:

```powershell
cd c:\Users\gulce\Desktop\bootcamp\frontend
npm test
```

---

## Demo user (screenshots / full desk)

Seed a filled student account (jobs, CVs, applications, notes):

```powershell
cd c:\Users\gulce\Desktop\bootcamp\backend
.\.venv\Scripts\activate
python ..\scripts\seed_demo_user.py
```

| | |
|--|--|
| **Email** | `demo@internroute.app` |
| **Password** | `DemoStudent2026!` |

Re-running the script resets this account to the same sample data.

---

## Troubleshooting

### Browser shows connection error / blank page

Both servers must be running. Restart Terminal 1 and Terminal 2 using the commands above.

### `npm` is not recognized

Use:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Or restart Cursor so your terminal picks up the Node.js PATH.

### Login / API errors after restart

Backend uses `backend/internroute.db`. Your users and jobs are still there — log in again with the same email and password.

### Port already in use

Change backend port:

```powershell
uvicorn app.main:app --reload --port 8001
```

Then set `VITE_API_BASE_URL=http://localhost:8001/api/v1` in `frontend/.env.local` and restart the frontend.

---

## Stop the app

In each terminal: **Ctrl + C**
