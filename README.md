"I have no special talent, I am only passionately curious". Albert Einstein

# DCO Automation System — Web UI

**React + TypeScript + Vite** front end and **FastAPI** gateway for Laura’s operational IVF workflow: **Dentrix Ascend → Google Sheet → dashboard** with statuses **New** / **DONE B** (IVF 2026 document in Dentrix, not insurer portals).

> Demo data is **fictitious**. By default the UI uses in-browser mocks; connect the API gateway for end-to-end stubs (`api/app/stubs/`).

## What’s in this repo

| Screen | Route | Purpose |
|--------|-------|---------|
| IVF Verification | `/verification` | Sheet rows, edit history, productivity summary, CSV export |
| Dentrix Sync | `/sync` | Start and poll Dentrix → Sheet robot runs |
| Login | `/login` | Mock or API auth; roles **admin** / **operator** |

**Not included anymore:** Sprint 1 insurer-portal demo (`verified` / `denied`, Excel catalog, `/patients`, appointments, reports).

See `docs/ARCHITECTURE_IVF_WORKFLOW.md`, `docs/OPERATOR_RUNBOOK.md`, and `api/README.md`.

## Scripts

```bash
npm install
npm run dev          # http://localhost:5173
npm run build
npm run preview
```

## Project structure

| Path | Stack | Role |
|------|--------|------|
| `src/` | React + Vite | IVF dashboard, Dentrix sync UI, login |
| `api/` | Python + FastAPI | Sheet + robot API gateway (stubs until Laura wires Sheets / Playwright) |
| `api/app/robots/` | Playwright | Dentrix robot (core); `scraper.py` at repo root is a thin CLI launcher |
| `docs/` | Markdown | Architecture and contracts |

## Full stack (local)

**Terminal 1 — API**

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # Windows — use source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Smoke test (server running):

```bash
python scripts/smoke_test_api.py
```

**Terminal 2 — Web**

```bash
cp .env.example .env.local
npm install
npm run dev
```

### Connect UI to the API (optional)

In `.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_SHEET_USE_API=true
VITE_DENTRIX_SYNC_USE_API=true
VITE_AUTH_USE_API=true
```

Without the sheet/sync flags, the UI uses in-browser mocks (fine for layout review). Auth stays on **mock** until `VITE_AUTH_USE_API=true` (Laura’s `POST /auth/login`).

### Auth and roles (Sprint 3)

| Mode | Flag | Demo accounts |
|------|------|----------------|
| Mock (default) | omit `VITE_AUTH_USE_API` | `admin` / `admin`, `operator` / `operator` |
| API | `VITE_AUTH_USE_API=true` | `admin@dco.test` / `admin123`, `operator@dco.test` / `operator123` |

- **admin** — IVF dashboard + Dentrix Sync (`/sync`).
- **operator** — IVF dashboard only; Sync is hidden and blocked server-side.

With API auth enabled, the app restores the session on load via `GET /auth/me` and signs out automatically when the API returns **401** (expired or invalid token).

### Sprint 4 — Audit, reports, operator docs

| Feature | UI behavior |
|---------|-------------|
| **Change audit** | Per-row **History** modal; **Last edit** column when metadata exists. Mock log in browser until `GET /api/sheet/audit` ships. |
| **Reports (S4.1)** | **Productivity summary** on `/verification`: completion %, breakdown by insurance type and top carriers. |
| **Export** | **Export rows CSV** and **Export summary CSV** for the current filtered view. |
| **Post-sync UX** | After a completed Dentrix run, `/verification` shows a refresh banner. |
| **Runbook** | `docs/OPERATOR_RUNBOOK.md` — daily workflow for operators. |

## Deploy (static UI)

### Vercel

1. Push to GitHub.
2. Import in [Vercel](https://vercel.com) — preset **Vite**, build `npm run build`, output `dist`.
3. Set environment variables for production API URL (see above).

### Netlify

Build: `npm run build`, publish `dist`. SPA fallback is in `netlify.toml`.

### GitHub Pages

Set `base` in `vite.config.ts` if the site is not at the domain root (e.g. `base: '/dco-automation-web/'`).

Deploy the **API** separately (Render, Railway, etc.) and set `VITE_API_URL` in the hosting provider.

## Team next steps (CSE499)

- Laura: `GET /api/sheet/audit` + persist PATCH events; server-side data validation (S3.4).
- Confirm audit storage (Sheet tab vs backend) and `lastEdit` on row payloads.
- Review Sprint 4 on feature branch before merge to `main`.

## License

Private / team use unless the project owners specify otherwise.
