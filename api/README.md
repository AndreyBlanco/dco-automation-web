# DCO Automation — Verification API (Python)

FastAPI service for the insurance verification robot: **Excel catalog lookup → insurer portal → Excel write**.

Matches the frontend contract in `src/types/verification-api.ts`.

## Setup

```bash
cd api
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

## Run

```bash
cd api
uvicorn app.main:app --reload --port 8000
```

- Health: http://localhost:8000/health  
- OpenAPI: http://localhost:8000/docs  

On first start, creates `api/data/plan_catalog.xlsx` with seed plans (Aetna, SmileCare, etc.).

## Connect the React UI

In the repo root, create `.env.local`:

```env
VITE_VERIFICATION_API_URL=http://localhost:8000
```

Then:

```bash
npm run dev
```

Open a patient → **Verify insurance**. The UI uses `HttpInsuranceVerificationService` instead of the in-browser stub.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + Excel path |
| GET | `/api/verification/catalog/lookup?carrier=&plan=` | Plan catalog lookup |
| POST | `/api/verification/verify` | Full robot pipeline |

## Excel workbook

Sheets:

- **plan_catalog** — `carrier`, `plan_name`, `portal_url` (known plan types)
- **verification_log** — audit trail of each verification run

## Portal automation

`USE_PLAYWRIGHT=false` (default) uses a **deterministic stub**: member IDs ending in an **even digit** → verified.

Set `USE_PLAYWRIGHT=true` when Playwright is wired in `app/portal_scraper.py`.

## Environment

Copy `api/.env.example` to `api/.env` to customize `EXCEL_PATH`, `CORS_ORIGINS`, and `USE_PLAYWRIGHT`.
