
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import cors_origins
from .models import (
    DentrixSyncRunDetail,
    DentrixSyncRunRequest,
    DentrixSyncRunSummary,
    IvfStatus,
    KindOfInsurance,
    SheetRowPatch,
    SheetRowPatchResponse,
    SheetRowsResponse,
)
from . import sheet_gateway
from . import robot_gateway
from .auth.service import (
    LoginRequest,
    LoginResponse,
    UserPublic,
    authenticate,
    get_current_user,
    require_admin,
)
app = FastAPI(
    title="DCO Automation — IVF API Gateway",
    description=(
        "Google Sheet gateway + Dentrix robot control for the IVF operational workflow. "
        "Sheet + Dentrix robot integrated in this API process (see /health)."
    ),
    version="0.2.0",
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
        "service": "DCO Automation — IVF API Gateway",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "sheetRows": "GET /api/sheet/rows",
            "sheetPatch": "PATCH /api/sheet/row",
            "robotRun": "POST /api/robot/run",
            "robotStatus": "GET /api/robot/runs/{runId}",
        },
        "note": "Legacy /api/verification/* removed. UI: npm run dev (http://localhost:5173).",
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "sheet": sheet_gateway.store_mode(),
        "robot": robot_gateway.store_mode(),
    }

@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest) -> LoginResponse:
    return authenticate(body.email, body.password)


@app.get("/auth/me", response_model=UserPublic)
def me(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return user


@app.get("/api/sheet/rows", response_model=SheetRowsResponse)
def get_sheet_rows(
    date: str | None = Query(default=None),
    dateFrom: str | None = Query(default=None),
    dateTo: str | None = Query(default=None),
    ivfStatus: IvfStatus | None = Query(default=None),
    kindOfInsurance: KindOfInsurance | None = Query(default=None),
    q: str | None = Query(default=None),
    user: UserPublic = Depends(get_current_user),
) -> SheetRowsResponse:
    try:
        return sheet_gateway.list_rows(
            date=date,
            date_from=dateFrom,
            date_to=dateTo,
            ivf_status=ivfStatus,
            kind_of_insurance=kindOfInsurance,
            q=q,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sheet read failed: {exc}") from exc


@app.patch("/api/sheet/row", response_model=SheetRowPatchResponse)

def patch_sheet_row(
    body: SheetRowPatch,
    user: UserPublic = Depends(get_current_user),
) -> SheetRowPatchResponse: 
   
    try:
        return sheet_gateway.patch_row(body)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/robot/run", response_model=DentrixSyncRunSummary)

def start_robot_run(
    body: DentrixSyncRunRequest,
    user: UserPublic = Depends(require_admin),
) -> DentrixSyncRunSummary:
    
    try:
        return robot_gateway.start_run(body)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/robot/runs/{run_id}/resume", response_model=DentrixSyncRunDetail)
def resume_robot_run(
    run_id: str,
    user: UserPublic = Depends(require_admin),
) -> DentrixSyncRunDetail:
   
    try:
        return robot_gateway.resume_run(run_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown run: {run_id}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/robot/runs/{run_id}", response_model=DentrixSyncRunDetail)
def get_robot_run(
    run_id: str,
    user: UserPublic = Depends(get_current_user),
) -> DentrixSyncRunDetail: 
    
    
    try:
        return robot_gateway.get_run(run_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"Unknown run: {run_id}") from exc
