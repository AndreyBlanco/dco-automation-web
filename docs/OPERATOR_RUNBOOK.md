# DCO Automation — Operator Runbook

Quick guide for daily IVF verification workflow. Demo data is fictitious; production uses Laura’s Google Sheet and Dentrix PC.

## Prerequisites

| Item | Notes |
|------|--------|
| API machine | Windows PC with Dentrix Ascend + `uvicorn` from `api/` |
| Browser | React UI (`npm run dev` or deployed static site) |
| Credentials | Google service account JSON in `api/credentials/` (Laura); never commit secrets |
| Demo logins | `admin@dco.test` / `admin123` (sync + dashboard) · `operator@dco.test` / `operator123` (dashboard only) |

## Environment (full stack)

In repo root `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_SHEET_USE_API=true
VITE_DENTRIX_SYNC_USE_API=true
VITE_AUTH_USE_API=true
```

Start API: `cd api && uvicorn app.main:app --reload --port 8000`  
Start UI: `npm run dev` → http://localhost:5173

Health check: `GET http://localhost:8000/health` → `"status": "ok"`

## Daily workflow

### 1. Sign in

- Open `/login`.
- Use an account matching your role (admin can run sync; operator cannot).

### 2. Dentrix sync (admin only)

1. Go to **Dentrix Sync** (`/sync`).
2. Set **Start date** and **Days** (matches robot calendar range).
3. Press **Start sync** — Chromium opens on the **API machine** (not in the browser tab).
4. Log in to Dentrix if prompted; position the schedule on the first clinic day.
5. Press **Dentrix is ready — continue**.
6. Wait until status is **Completed**. Check the activity log for processed / skipped / errors.

### 3. IVF Verification dashboard

1. Open **IVF Verification** (`/verification`).
2. If a green banner appears (“Dentrix sync completed”), press **Refresh now**.
3. Filter by date range, status (`New` / `DONE B`), insurance type, or search.
4. Review **Productivity summary** and export CSV if needed.
5. Edit **status (E)** or **notes (J)** per row when corrections are needed.
6. Open **History** on a row to see who changed what (when audit API is available).

### 4. Columns the app never writes

Columns **G** and **H** are protected — robot and UI only touch **A, C, D, E, F, I, J**.

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Login “Failed to fetch” | Confirm API is running; or disable `VITE_AUTH_USE_API` for mock login |
| Empty dashboard | Widen date filters; confirm Sheet tab and credentials |
| 401 on dashboard | Session expired — sign in again |
| 403 on sync | Operator account — use admin for sync |
| Sync stuck on awaiting operator | Complete Dentrix login on API machine, then press continue |
| History empty in API mode | Laura’s `GET /api/sheet/audit` not deployed yet — mock mode shows sample events |

## Smoke test (developers)

```bash
cd api
python scripts/smoke_test_api.py
```

Requires server on port 8000 with admin login.

## Limitations (class project)

- No real PHI in the repository.
- Audit log in API mode depends on Laura’s Sprint 4 backend.
- Medicaid patients are skipped by the robot by design.
