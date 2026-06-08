"""JSON run state on disk — shared between FastAPI and the Dentrix robot thread."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..models import DentrixSyncLogEntry, DentrixSyncRunDetail, DentrixSyncRunSummary, LogLevel


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise FileNotFoundError(str(path))
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def init_run(path: Path, *, run_id: str, start_date: str, days: int, patient_limit: int | None) -> dict[str, Any]:
    data: dict[str, Any] = {
        "runId": run_id,
        "status": "pending",
        "startDate": start_date,
        "days": days,
        "patientLimit": patient_limit,
        "startedAt": _now_iso(),
        "completedAt": None,
        "processed": 0,
        "skippedMedicaid": 0,
        "errors": 0,
        "message": "Starting Dentrix robot…",
        "logs": [],
        "resume_requested": False,
    }
    save(path, data)
    return data


def append_log(data: dict[str, Any], level: LogLevel, message: str) -> None:
    logs: list[dict[str, str]] = data.setdefault("logs", [])
    logs.append({"at": _now_iso(), "level": level, "message": message})
    if len(logs) > 200:
        del logs[:-200]


def to_summary(data: dict[str, Any]) -> DentrixSyncRunSummary:
    return DentrixSyncRunSummary(
        run_id=data["runId"],
        status=data["status"],
        start_date=data["startDate"],
        days=data["days"],
        started_at=data.get("startedAt"),
        completed_at=data.get("completedAt"),
        processed=data.get("processed"),
        skipped_medicaid=data.get("skippedMedicaid"),
        errors=data.get("errors"),
        message=data.get("message"),
    )


def to_detail(data: dict[str, Any]) -> DentrixSyncRunDetail:
    return DentrixSyncRunDetail(**to_detail_fields(data))


def to_detail_fields(data: dict[str, Any]) -> dict[str, Any]:
    logs_raw = data.get("logs") or []
    logs = [DentrixSyncLogEntry(**entry) for entry in logs_raw]
    return {
        "run_id": data["runId"],
        "status": data["status"],
        "start_date": data["startDate"],
        "days": data["days"],
        "started_at": data.get("startedAt"),
        "completed_at": data.get("completedAt"),
        "processed": data.get("processed"),
        "skipped_medicaid": data.get("skippedMedicaid"),
        "errors": data.get("errors"),
        "message": data.get("message"),
        "logs": logs,
    }
