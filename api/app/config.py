import os
from pathlib import Path

API_ROOT = Path(__file__).resolve().parent.parent
REPO_ROOT = API_ROOT.parent


def cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]


def google_credentials_path() -> Path:
    raw = os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials/google_credentials.json")
    path = Path(raw)
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path


def google_sheet_name() -> str:
    return os.getenv("GOOGLE_SHEET_NAME", "test_excel")


def google_worksheet_name() -> str:
    return os.getenv("GOOGLE_WORKSHEET_NAME", "Sheet1")


def sheet_use_stub() -> bool:
    return os.getenv("SHEET_USE_STUB", "false").lower() in ("1", "true", "yes")


def sheet_use_google() -> bool:
    if sheet_use_stub():
        return False
    return google_credentials_path().is_file()


def robot_use_stub() -> bool:
    return os.getenv("ROBOT_USE_STUB", "false").lower() in ("1", "true", "yes")


def robot_runs_dir() -> Path:
    raw = os.getenv("ROBOT_RUNS_DIR", "runs")
    path = Path(raw)
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path


def robot_use_live() -> bool:
    return not robot_use_stub()


def dentrix_schedule_url() -> str:
    return os.getenv(
        "DENTRIX_SCHEDULE_URL",
        "https://live19.dentrixascend.com/pm#/schedule/calendar",
    )


def playwright_user_data_dir() -> Path:
    raw = os.getenv("PLAYWRIGHT_USER_DATA_DIR", "user_data")
    path = Path(raw)
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path


def robot_test_patient_limit() -> int | None:
    raw = os.getenv("ROBOT_TEST_PATIENT_LIMIT", "").strip()
    if not raw:
        return None
    return int(raw)
