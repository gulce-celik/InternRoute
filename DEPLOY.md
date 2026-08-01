# Deploy InternRoute (single live URL)

One Render service runs **both** the UI and the API. The jury opens one link, signs in, and can try the full app.

**Free tier note:** persistent disks are not available. App data (SQLite, uploads, Chroma) lives on the container filesystem and can reset after redeploys. Re-run the demo seed if needed. Fine for a jury demo.

## 1) Push to GitHub

Make sure `Dockerfile`, `render.yaml`, and the related backend changes are on `main`.

## 2) Deploy on Render

1. Sign in at [https://render.com](https://render.com) with GitHub.
2. **New → Blueprint** → select the `InternRoute` repo.
3. **Blueprint Name:** e.g. `InternRoute` (required).
4. Branch: `main` · Blueprint Path: `render.yaml`.
5. When prompted, paste your **`GEMINI_API_KEY`**.
6. Start the deploy (first build can take 5–10 minutes).

### Manual path (if you skip Blueprint)

1. **New → Web Service** → same repo.
2. Runtime: **Docker**.
3. Environment variables:

| Key | Value |
|-----|--------|
| `GEMINI_API_KEY` | your Gemini key |
| `GEMINI_MODEL` | `gemini-flash-lite-latest` |
| `SECRET_KEY` | long random string |
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DATABASE_URL` | `sqlite:///./data/internroute.db` |
| `CHROMA_PERSIST_DIRECTORY` | `./data/chroma_data` |
| `UPLOAD_DIR` | `./data/uploads` |
| `CORS_ORIGINS` | `*` |

## 3) Demo account

After deploy finishes, open the service → **Shell**:

```bash
cd /app && python scripts/seed_demo_user.py
```

Login:

- email: `demo@internroute.app`
- password: `DemoStudent2026!`

## 4) Link for the jury

Use the Render URL, for example:

`https://internroute-xxxx.onrender.com`

Notes:

- Free tier may sleep; the first open can take 30–60 seconds — warm it up once before the demo.
- Keep the Gemini key in Render env only; never commit it to GitHub.

## Optional: local Docker smoke test

```bash
docker build -t internroute .
docker run -p 8000:8000 -e GEMINI_API_KEY=... -e SECRET_KEY=dev -e DATABASE_URL=sqlite:///./data/internroute.db -e CHROMA_PERSIST_DIRECTORY=./data/chroma_data -e UPLOAD_DIR=./data/uploads internroute
```

Open: http://localhost:8000
