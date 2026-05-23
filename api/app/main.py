from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import cors_origins
from .excel_catalog import ensure_workbook
from .models import CatalogLookupResponse, VerifyInsuranceRequest, VerifyInsuranceResponse
from .verification_service import catalog_lookup, verify_patient


@asynccontextmanager
async def lifespan(_app: FastAPI):
    ensure_workbook()
    yield


app = FastAPI(
    title="DCO Automation — Verification API",
    description="Excel catalog lookup, portal verification (stub/Playwright), and catalog writes.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {
        "service": "DCO Automation — Verification API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "catalogLookup": "GET /api/verification/catalog/lookup?carrier=&plan=",
            "verify": "POST /api/verification/verify",
        },
        "note": "This is the backend for the React app. Open the UI with npm run dev (usually http://localhost:5173).",
    }


@app.get("/health")
def health() -> dict[str, str]:
    path = ensure_workbook()
    return {"status": "ok", "excel": str(path)}


@app.get("/api/verification/catalog/lookup", response_model=CatalogLookupResponse)
def lookup_catalog(
    carrier: str = Query(..., min_length=1),
    plan: str = Query(..., min_length=1),
) -> CatalogLookupResponse:
    return catalog_lookup(carrier, plan)


@app.post("/api/verification/verify", response_model=VerifyInsuranceResponse)
def verify_insurance(body: VerifyInsuranceRequest) -> VerifyInsuranceResponse:
    return verify_patient(body)
