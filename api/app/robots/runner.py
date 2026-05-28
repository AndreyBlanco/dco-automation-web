"""Run the Dentrix robot in-process (background thread) for the FastAPI app."""

from __future__ import annotations

import threading
from pathlib import Path
from uuid import uuid4

from ..models import DentrixSyncRunDetail, DentrixSyncRunRequest, DentrixSyncRunSummary
from . import run_state
from ..config import robot_runs_dir

_active_run_id: str | None = None
_worker: threading.Thread | None = None


def _state_path(run_id: str) -> Path:
    return robot_runs_dir() / f"{run_id}.json"


def _is_worker_alive() -> bool:
    return _worker is not None and _worker.is_alive()


def _read_detail(run_id: str) -> DentrixSyncRunDetail:
    path = _state_path(run_id)
    data = run_state.load(path)
    if _active_run_id == run_id and not _is_worker_alive():
        terminal = ("completed", "failed", "cancelled")
        if data.get("status") not in terminal:
            data["status"] = "failed"
            data["message"] = "Robot thread stopped unexpectedly."
            data["completedAt"] = run_state._now_iso()
            run_state.append_log(data, "error", data["message"])
            run_state.save(path, data)
    return run_state.to_detail(data)


def _worker_target(
    path: Path,
    start_date: str,
    days: int,
    patient_limit: int | None,
    run_id: str,
) -> None:
    global _active_run_id, _worker
    try:
        from .dentrix_scraper import run_sync

        run_sync(
            start_date,
            days,
            status_path=str(path),
            patient_limit=patient_limit,
        )
    except Exception as exc:
        from .dentrix_scraper import mark_run_failed

        mark_run_failed(path, exc)
    finally:
        if _active_run_id == run_id:
            _active_run_id = None
        _worker = None


def start_run(body: DentrixSyncRunRequest) -> DentrixSyncRunSummary:
    global _active_run_id, _worker

    if _is_worker_alive():
        raise RuntimeError(
            f"A robot run is already active ({_active_run_id}). Wait for it to finish."
        )

    run_id = f"run-{uuid4().hex[:12]}"
    path = _state_path(run_id)
    run_state.init_run(
        path,
        run_id=run_id,
        start_date=body.start_date,
        days=body.days,
        patient_limit=body.patient_limit,
    )

    data = run_state.load(path)
    data["message"] = "Starting Dentrix robot (in-process)…"
    run_state.save(path, data)

    _active_run_id = run_id
    _worker = threading.Thread(
        target=_worker_target,
        args=(path, body.start_date, body.days, body.patient_limit, run_id),
        name=f"dentrix-{run_id}",
        daemon=True,
    )
    _worker.start()

    data = run_state.load(path)
    run_state.append_log(
        data,
        "info",
        "Chromium will open on this machine. Log in to Dentrix, position the calendar, then confirm in the app.",
    )
    data["status"] = "awaiting_login"
    data["message"] = "Waiting for operator to confirm Dentrix is ready."
    run_state.save(path, data)

    return run_state.to_summary(data)


def resume_run(run_id: str) -> DentrixSyncRunDetail:
    path = _state_path(run_id)
    data = run_state.load(path)
    if data.get("status") != "awaiting_login":
        raise ValueError(f"Run {run_id} is not awaiting login (status={data.get('status')}).")
    data["resume_requested"] = True
    data["message"] = "Resume acknowledged — robot will start processing."
    run_state.append_log(data, "info", "Operator confirmed Dentrix is ready.")
    run_state.save(path, data)
    return run_state.to_detail(data)


def get_run(run_id: str) -> DentrixSyncRunDetail:
    return _read_detail(run_id)
