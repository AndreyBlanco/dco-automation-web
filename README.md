"I have no special talent, I am only passionately curious". Albert Einstein

# DCO Automation System — Web UI (demo)

Single-page application built with **React + TypeScript + Vite**. This repository contains a **non-sensitive** frontend template aligned with the DCO Automation System proposal: dashboard, patients, appointment form, reports placeholders, and a simulated insurance verification flow.

> All patient data is **fictitious**. Exports and portal checks are **UI-only** until the Python backend is integrated.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy (ready for team lead review)

### Vercel

1. Push this folder to GitHub.
2. In [Vercel](https://vercel.com), **Import** the repository.
3. Framework preset: **Vite**. Build command: `npm run build`, output directory: `dist`.
4. Deploy — client-side routes work without extra config.

### Netlify

1. **New site from Git** (or drag & drop the `dist` folder after `npm run build`).
2. Build settings: build command `npm run build`, publish directory `dist`.
3. This repo includes `netlify.toml` with SPA fallback to `index.html`.

### GitHub Pages (optional)

Set `base` in `vite.config.ts` to your repo name (e.g. `base: '/dco-automation-web/'`), then use a Pages action or `gh-pages` branch. For a root domain site, keep `base: '/'`.

## Project structure (monorepo)

| Path | Stack | Role |
|------|--------|------|
| `src/` | React + Vite | Web UI — patients, verification, dashboard |
| `api/` | Python + FastAPI | Robot service — Excel catalog, portal stub, audit log |

## Full stack (local)

**Terminal 1 — API**

```bash
cd api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Web**

```bash
cp .env.example .env.local   # sets VITE_VERIFICATION_API_URL=http://localhost:8000
npm install
npm run dev
```

See `api/README.md` for endpoints and Excel layout.

## Next steps (CSE499)

- Laura review on branch `python-service` before merge to `main`.
- Wire Playwright in `api/app/portal_scraper.py` (`USE_PLAYWRIGHT=true`).
- Deploy API (Render/Railway) and set `VITE_VERIFICATION_API_URL` in production.

## License

Private / team use unless the project owners specify otherwise.
