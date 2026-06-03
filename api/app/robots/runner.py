"""Run the Dentrix robot as a separate Python process for the FastAPI app."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from uuid import uuid4

from ..models import DentrixSyncRunDetail, DentrixSyncRunRequest, DentrixSyncRunSummary
from . import run_state
from ..config import robot_runs_dir

_active_run_id: str | None = None
_process: subprocess.Popen | None = None


def _state_path(run_id: str) -> Path:
    return robot_runs_dir() / f"{run_id}.json"


def _is_process_alive() -> bool:
    return _process is not None and _process.poll() is None


def _read_detail(run_id: str) -> DentrixSyncRunDetail:
    global _active_run_id, _process

    path = _state_path(run_id)
    data = run_state.load(path)

    terminal = ("completed", "failed", "cancelled")

    if _active_run_id == run_id and not _is_process_alive():
        if data.get("status") not in terminal:
            data["status"] = "failed"
            data["message"] = "Robot process stopped unexpectedly."
            data["completedAt"] = run_state._now_iso()
            run_state.append_log(data, "error", data["message"])
            run_state.save(path, data)

        _active_run_id = None
        _process = None

    return run_state.to_detail(data)


def start_run(body: DentrixSyncRunRequest) -> DentrixSyncRunSummary:
    global _active_run_id, _process

    if _is_process_alive():
        raise RuntimeError(
            f"A robot run is already active ({_active_run_id}). Wait for it to finish."
        )

    run_id = f"run-{uuid4().hex[:12]}"
    path = _state_path(run_id)

    data = run_state.init_run(
        path,
        run_id=run_id,
        start_date=body.start_date,
        days=body.days,
        patient_limit=body.patient_limit,
    )

    data["status"] = "pending"
    data["message"] = "Starting Dentrix robot process..."
    run_state.append_log(data, "info", "Starting Dentrix robot process.")
    run_state.save(path, data)

    api_dir = Path(__file__).resolve().parents[2]

    cmd = [
        sys.executable,
        "-m",
        "app.robots.cli",
        "--start-date",
        body.start_date,
        "--days",
        str(body.days),
        "--status-file",
        str(path),
    ]

    if body.patient_limit is not None:
        cmd.extend(["--patient-limit", str(body.patient_limit)])

    _process = subprocess.Popen(
        cmd,
        cwd=str(api_dir),
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0,
    )

    _active_run_id = run_id

    data = run_state.load(path)
    data["status"] = "pending"
    data["message"] = "Robot process started. Chromium should open soon."
    run_state.append_log(
        data,
        "info",
        "Robot process started. Wait for Chromium/Dentrix to open.",
    )
    run_state.save(path, data)

    return run_state.to_summary(data)


def resume_run(run_id: str) -> DentrixSyncRunDetail:
    path = _state_path(run_id)
    data = run_state.load(path)

    if data.get("status") not in ("awaiting_login", "pending"):
        raise ValueError(
            f"Run {run_id} is not awaiting login (status={data.get('status')})."
        )

    data["resume_requested"] = True
    data["message"] = "Resume acknowledged — robot will start processing."
    run_state.append_log(data, "info", "Operator confirmed Dentrix is ready.")
    run_state.save(path, data)

    return run_state.to_detail(data)


def get_run(run_id: str) -> DentrixSyncRunDetail:
    return _read_detail(run_id)