"""
Backward-compatible entry point for Laura's Dentrix robot.

The robot lives inside the app package:
  api/app/robots/dentrix_scraper.py

Run from repo root:
  python scraper.py --start-date 2026-06-01 --days 1

Or from api/:
  python -m app.robots.cli --start-date 2026-06-01 --days 1
"""
from __future__ import annotations

import sys
from pathlib import Path

_API_DIR = Path(__file__).resolve().parent / "api"
if str(_API_DIR) not in sys.path:
    sys.path.insert(0, str(_API_DIR))

from app.robots.cli import main

if __name__ == "__main__":
    main()
