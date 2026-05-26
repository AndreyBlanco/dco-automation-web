import os
from pathlib import Path

API_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXCEL = API_ROOT / "data" / "plan_catalog.xlsx"


def get_excel_path() -> Path:
    raw = os.getenv("EXCEL_PATH", str(DEFAULT_EXCEL))
    path = Path(raw)
    if not path.is_absolute():
        path = API_ROOT / path
    return path


def use_playwright() -> bool:
    return os.getenv("USE_PLAYWRIGHT", "false").lower() in ("1", "true", "yes")


def cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [o.strip() for o in raw.split(",") if o.strip()]
