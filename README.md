"I have no special talent, I am only passionately curious". Albert Einstein

# DCO Automation System — Web UI

**React + TypeScript + Vite** front end and **FastAPI** gateway for Laura’s operational IVF workflow: **Dentrix Ascend → Google Sheet → dashboard** with statuses **New** / **DONE B** (IVF 2026 document in Dentrix, not insurer portals).

> Demo data is **fictitious**. By default the UI uses in-browser mocks; connect the API gateway for end-to-end stubs (`api/app/stubs/`).

## What’s in this repo

| Screen | Route | Purpose |
|--------|-------|---------|
| IVF Verification | `/verification` | Operational sheet rows — filter by date, status, insurance type |
| Dentrix Sync | `/sync` | Start and poll Dentrix → Sheet robot runs |
| Login | `/login` | Simple auth gate (demo — any password) |

**Not included anymore:** Sprint 1 insurer-portal demo (`verified` / `denied`, Excel catalog, `/patients`, appointments, reports).

See `docs/ARCHITECTURE_IVF_WORKFLOW.md` and `api/README.md`.

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
```

Without those flags, the UI uses in-browser mocks (fine for layout review).

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

- Laura: Google Sheets service account, `api/app/robots/dentrix_scraper.py`, replace `api/app/stubs/`.
- Confirm Sheet tab name, PATCH rules, and robot trigger with `POST /api/robot/run`.
- Review on feature branch before merge to `main`.

## License

Private / team use unless the project owners specify otherwise.
