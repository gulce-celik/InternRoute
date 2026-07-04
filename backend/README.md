# FastAPI Backend — InternRoute

## Sprint 1 setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
```

Copy env file from project root:

```bash
copy ..\.env.example ..\.env
```

## Run API

```bash
uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/api/v1/health

## Run tests

```bash
pytest tests/ -v
```

## Sprint 1 endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login (OAuth2 form: username=email) |
| GET | `/api/v1/auth/me` | Current user (Bearer token) |

## Models (Sprint 1)

- `User` — active in auth flow
- `Job`, `CV`, `Application` — defined for Sprint 2
