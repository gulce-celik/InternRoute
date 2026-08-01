# Single live URL: frontend + API on one service (jury opens one link).

FROM node:22-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API — no separate frontend host needed.
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ ./backend/
COPY scripts/seed_demo_user.py ./scripts/seed_demo_user.py
COPY --from=frontend /build/dist ./backend/static

WORKDIR /app/backend

ENV APP_ENV=production
ENV DEBUG=false
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
CMD ["sh", "-c", "mkdir -p ./data/uploads ./data/chroma_data && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
