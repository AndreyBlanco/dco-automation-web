# DCO Automation — IVF API Gateway

FastAPI service for Laura’s operational workflow: **Google Sheet** as the operational database and **Dentrix** robot control. The React UI calls this gateway only (never Google or Dentrix directly).

**Sheet rows:** if `credentials/google_credentials.json` exists, `GET /api/sheet/rows` reads the live Google Sheet. **Dentrix robot:** `app/robots/dentrix_scraper.py` runs in-process (background thread) when `ROBOT_USE_STUB` is not set.

## Run locally

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Smoke test (server must be running):

```bash
python scripts/smoke_test_api.py
```

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | — | Liveness |
| POST | `/auth/login` | — | Issue JWT (`accessToken` + `user`) |
| GET | `/auth/me` | Bearer | Current user from token |
| GET | `/api/sheet/rows` | Bearer | List operational rows (filters: `date`, `dateFrom`, `dateTo`, `ivfStatus`, `kindOfInsurance`, `q`) |
| PATCH | `/api/sheet/row` | Bearer | Update `ivfStatus` and/or `notes` (columns E/J only — never G/H) |
| POST | `/api/robot/run` | Bearer (**admin**) | Start Dentrix → Sheet sync (`app/robots/dentrix_scraper.py`) |
| POST | `/api/robot/runs/{runId}/resume` | Bearer (**admin**) | Confirm Dentrix login + calendar ready |
| GET | `/api/robot/runs/{runId}` | Bearer | Poll run status + logs |

Demo users (class project only): `admin@dco.test` / `admin123`, `operator@dco.test` / `operator123`. Optional env: `AUTH_SECRET_KEY` (defaults to dev key).

### Removed (legacy Sprint 1)

- `GET /api/verification/catalog/lookup`
- `POST /api/verification/verify`
- `portal_scraper.py`, `verification_service.py`, `excel_catalog.py`

## Frontend wiring

In the repo root `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_SHEET_USE_API=true
VITE_DENTRIX_SYNC_USE_API=true
VITE_AUTH_USE_API=true
```

### Operator test (Laura / team)

1. Run API on the **same Windows PC** that can open Dentrix (`uvicorn` from `api/`).
2. Run UI with the env vars above.
3. **Dentrix Sync** → Start → Chromium opens → login + calendar.
4. Click **“Dentrix is ready — continue”** in the app.
5. When status is **Completed**, open **IVF Verification** (refresh) to see `test_excel` rows.

Run state files live in `runs/` (gitignored). Playwright profile: `user_data/`.

## Next steps (Laura)

- [ ] Google Sheets service account + `IVF-List-2026` tab
- [x] `app/robots/dentrix_scraper.py` — Playwright; writes columns A/C/D/E/F/I/J only
- [ ] Laura: harden selectors / production Sheet tab names

See `docs/ARCHITECTURE_IVF_WORKFLOW.md`.
