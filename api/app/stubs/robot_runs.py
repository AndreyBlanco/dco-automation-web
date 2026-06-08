"""In-memory Dentrix sync runs (Sprint 2 stub). Replace with api/app/robots/dentrix_scraper.py."""

from __future__ import annotations

import time
from datetime import datetime, timezone
from uuid import uuid4

from ..models import (
    DentrixSyncLogEntry,
    DentrixSyncRunDetail,
    DentrixSyncRunRequest,
    DentrixSyncRunSummary,
    LogLevel,
)

_RUNS: dict[str, dict] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log(level: LogLevel, message: str) -> DentrixSyncLogEntry:
    return DentrixSyncLogEntry(at=_now_iso(), level=level, message=message)


def start_run(body: DentrixSyncRunRequest) -> DentrixSyncRunSummary:
    run_id = f"run-{uuid4().hex[:12]}"
    now = _now_iso()
    summary = DentrixSyncRunSummary(
        run_id=run_id,
        status="awaiting_login",
        start_date=body.start_date,
        days=body.days,
        started_at=now,
        message="Waiting for operator to complete Dentrix login (stub).",
    )
    _RUNS[run_id] = {
        "summary": summary,
        "logs": [
            _log("info", "Run created. Open Dentrix Ascend in the server browser window."),
            _log("info", f"Date range: {body.start_date} for {body.days} day(s)."),
        ],
        "started_at_ms": time.time() * 1000,
    }
    return summary


def resume_run(run_id: str) -> DentrixSyncRunDetail:
    state = _RUNS.get(run_id)
    if not state:
        raise KeyError(run_id)
    summary = state["summary"]
    if summary.status != "awaiting_login":
        raise ValueError(f"Run {run_id} is not awaiting login (status={summary.status}).")
    state["summary"] = summary.model_copy(
        update={"status": "running", "message": "Processing (stub)…"},
    )
    state["started_at_ms"] = time.time() * 1000
    return get_run(run_id)


def get_run(run_id: str) -> DentrixSyncRunDetail:
    state = _RUNS.get(run_id)
    if not state:
        raise KeyError(run_id)

    elapsed_ms = time.time() * 1000 - state["started_at_ms"]
    summary: DentrixSyncRunSummary = state["summary"]
    logs: list[DentrixSyncLogEntry] = state["logs"]

    if elapsed_ms < 2500:
        return _detail(summary, logs)

    if elapsed_ms < 8000:
        processed = min(6, int((elapsed_ms - 2500) // 900) + 1)
        updated = summary.model_copy(
            update={
                "status": "running",
                "processed": processed,
                "skipped_medicaid": 1,
                "errors": 0,
                "message": "Processing visible schedule…",
            }
        )
        state["summary"] = updated
        if len(logs) < 4:
            logs.append(_log("info", f"Processed {processed} patient(s) so far."))
        return _detail(updated, logs)

    done = summary.model_copy(
        update={
            "status": "completed",
            "processed": 8,
            "skipped_medicaid": 2,
            "errors": 0,
            "completed_at": _now_iso(),
            "message": "Sync finished. Rows written to operational Sheet (stub).",
        }
    )
    state["summary"] = done
    if not any("finished" in entry.message for entry in logs):
        logs.append(_log("info", "Run completed successfully."))
        logs.append(_log("info", "Refresh IVF dashboard to review New / DONE B rows."))
    return _detail(done, logs)


def _detail(summary: DentrixSyncRunSummary, logs: list[DentrixSyncLogEntry]) -> DentrixSyncRunDetail:
    return DentrixSyncRunDetail(**summary.model_dump(by_alias=False), logs=list(logs))
