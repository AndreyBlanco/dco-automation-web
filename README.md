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

## Project structure (high level)

- `src/components` — layout shell, UI primitives (buttons, cards, fields).
- `src/pages` — routed screens.
- `src/data` — mock fixtures for demos.
- `src/context` — lightweight demo auth + toasts.

## Next steps (with team lead)

- Replace mock data with API calls to the Python service layer.
- Add real authentication and role-based views.
- Connect “Verify insurance” and exports to backend jobs (Playwright / Pandas / OpenPyXL).

## License

Private / team use unless the project owners specify otherwise.
