# DCO Automation — IVF workflow architecture (Sprint 2)

Domain types, API contracts, and Laura’s operational **Dentrix → Google Sheets → web UI** flow. Sprint 2 cleanup removed the legacy insurer-portal demo from the repo.

## Verification path (operational only)

| Path | Backend module | What “verified” means | Persistence |
|------|----------------|----------------------|-------------|
| **Operational (Laura)** | `api/app/robots/dentrix_scraper.py` (planned) | **IVF 2026** document in Dentrix → `New` or `DONE B` | Google Sheet (operational DB) |

The Sprint 1 **insurer portal** demo (`portal_scraper.py`, `/api/verification/*`, Excel catalog) was **removed** in Sprint 2 cleanup. Do not reintroduce `verified` / `denied` portal semantics on the IVF dashboard.

### Dentrix robot — Laura’s core

- Prototype logic lives in repo root `scraper.py` (human-in-the-loop Playwright).
- Sprint 2 target: native module **`api/app/robots/dentrix_scraper.py`** (name per team).
- Writes columns **A, C, D, E, F, I, J** only; **never G or H**.

## Google Sheet column contract

| Col | Field | Values / notes |
|-----|--------|----------------|
| A | date | `YYYY-MM-DD` |
| C | patientName | From schedule (authoritative name) |
| D | kindOfInsurance | `PPO` \| `Medicaid` \| `No info` |
| E | ivfStatus | `New` \| `DONE B` |
| F | ageType | `CHILD` \| `TEENAGER` \| `Adult` \| empty |
| G | — | **Protected — do not write** |
| H | — | **Protected — do not write** |
| I | insurance | Normalized label (e.g. DDIL, BCBSIL) |
| J | notes | Chart, PID, subscriber id, IVF note |

Frontend types: `src/types/sheet-row.ts`, `src/types/sheet-api.ts`, `src/types/dentrix-sync-api.ts`.

## Proposed API endpoints (for Laura to confirm)

### Sheet gateway (UI reads operational data)

```
GET /api/sheet/rows?date=YYYY-MM-DD
GET /api/sheet/rows?dateFrom=...&dateTo=...&ivfStatus=New|DONE%20B&kindOfInsurance=PPO&q=search
```

Response: `{ rows: SheetRow[], meta?: { count, dateFrom, dateTo } }`

```
PATCH /api/sheet/row
Body: { rowIndex, ivfStatus?, notes? }
```

Enforce: no updates to columns G/H.

### Sheet audit (Sprint 4 — proposed for Laura)

```
GET /api/sheet/audit?rowIndex=12&dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

Response:

```json
{
  "events": [
    {
      "id": "audit-1",
      "rowIndex": 12,
      "field": "ivfStatus",
      "previousValue": "New",
      "newValue": "DONE B",
      "username": "admin@dco.test",
      "editedAt": "2026-05-27T18:30:00.000Z"
    }
  ]
}
```

Optional on `SheetRow` in `GET /api/sheet/rows`:

```json
"lastEdit": { "username": "admin@dco.test", "editedAt": "2026-05-27T18:31:00.000Z" }
```

Frontend: `src/types/sheet-audit.ts`, `src/services/audit/*`, history modal on `/verification`.

Laura API returns `{ entries: [{ id, createdAt, username, rowIndex, before, after }] }`; the UI maps that to per-field `events` client-side.

### Dentrix sync (UI for robot — Laura’s request)

```
POST /api/robot/run
Body: { startDate, days, patientLimit? }
Response: { runId, status, message? }
```

```
GET /api/robot/runs/{runId}
Response: { runId, status, processed, skippedMedicaid, errors, logs[] }
```

Human-in-the-loop steps (login, calendar position) remain **server-side**; the UI shows instructions and run status only.

## UI screens (Andrey — Sprint 2)

| Route (proposed) | Purpose |
|------------------|---------|
| `/verification` | IVF ops dashboard — `GET /api/sheet/rows` |
| `/sync` | Dentrix sync panel — `POST /api/robot/run` + poll (`DentrixSyncPage.tsx`) |
| `/login` | Auth gate (unchanged for now) |

## Confirmation checklist (Laura)

- [ ] Sheet name / tab name for service account
- [ ] `SheetRow` JSON shape matches `GET /api/sheet/rows`
- [ ] Allowed PATCH fields (E and/or J only?)
- [ ] Robot module path and `POST /api/robot/run` availability
- [ ] Whether sync is API-triggered or CLI-only for Sprint 2
