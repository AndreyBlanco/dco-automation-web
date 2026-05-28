"""Route robot operations to in-process runner or in-memory stub."""

from __future__ import annotations

from .config import robot_use_live
from .models import DentrixSyncRunDetail, DentrixSyncRunRequest, DentrixSyncRunSummary
from .stubs import robot_runs

_mode: str | None = None


def store_mode() -> str:
    global _mode
    if _mode is None:
        _mode = "live" if robot_use_live() else "stub"
    return _mode


def start_run(body: DentrixSyncRunRequest) -> DentrixSyncRunSummary:
    if store_mode() == "live":
        from .robots import runner

        return runner.start_run(body)
    return robot_runs.start_run(body)


def resume_run(run_id: str) -> DentrixSyncRunDetail:
    if store_mode() == "live":
        from .robots import runner

        return runner.resume_run(run_id)
    return robot_runs.resume_run(run_id)


def get_run(run_id: str) -> DentrixSyncRunDetail:
    if store_mode() == "live":
        from .robots import runner

        return runner.get_run(run_id)
    return robot_runs.get_run(run_id)
