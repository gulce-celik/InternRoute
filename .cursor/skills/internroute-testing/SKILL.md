---
name: internroute-testing
description: Runs and maintains InternRoute backend (pytest) and frontend (Vitest) test suites. Use when editing auth, jobs, API routes, React pages, adding features, fixing bugs, or before commits and sprint reviews.
---

# InternRoute Testing

## Quick commands

From repo root:

```bash
python scripts/run-backend-tests.py
python scripts/run-all-tests.py
```

From `frontend/`:

```bash
npm test          # single run
npm run test:watch
```

Or from repo root:

```bash
python scripts/run-frontend-tests.py
```

From `backend/` (with venv active):

```bash
pytest tests -v
```

## When to run

1. After any change to `backend/app/` or `backend/tests/`
2. After any change to `frontend/src/` (except pure CSS-only tweaks)
3. Before marking a task done or creating a commit
4. Cursor hooks auto-run targeted suites after `Write`/`StrReplace` on source files

## Backend conventions

- Tests live in `backend/tests/`
- `pytest.ini` sets `pythonpath = .` — no manual `PYTHONPATH`
- Use `client` + `db` fixtures from `conftest.py`
- Auth helper pattern:

```python
def auth_headers(client, email="student@example.com", password="securepass"):
    client.post("/api/v1/auth/register", json={...})
    token = client.post("/api/v1/auth/login", data={...}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
```

## Frontend conventions

- Vitest + Testing Library + jsdom
- Setup: `frontend/src/test/setup.ts`
- Helpers: `frontend/src/test/test-utils.tsx`
- Test files: `*.test.tsx` next to components or under `src/test/`
- Mock API in tests — never hit real backend

## Adding tests for new features

| Feature | Backend | Frontend |
|---------|---------|----------|
| New API route | `tests/test_<domain>.py` | mock `services/api.ts`, page render test |
| Auth change | extend `test_auth.py` | Login/Register flow test |
| New page | — | render + key interaction |

## Definition of done

- [ ] New behavior has at least one meaningful test
- [ ] `python scripts/run-all-tests.py` exits 0
- [ ] No skipped tests without a comment explaining why
