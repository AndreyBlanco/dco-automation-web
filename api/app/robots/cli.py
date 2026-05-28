"""CLI for the Dentrix robot — `python -m app.robots.cli` from the api/ directory."""

from __future__ import annotations

import argparse
from pathlib import Path

from .dentrix_scraper import mark_run_failed, run_sync


def main() -> None:
    parser = argparse.ArgumentParser(description="Dentrix Ascend to Google Sheet (IVF)")
    parser.add_argument("--start-date", help="First clinic day YYYY-MM-DD")
    parser.add_argument("--days", type=int, help="Consecutive days to process")
    parser.add_argument("--status-file", help="JSON run state for API/UI integration")
    parser.add_argument("--patient-limit", type=int, help="Max patients per day (test mode)")
    args = parser.parse_args()

    if args.status_file:
        if not args.start_date or args.days is None:
            raise SystemExit("--start-date and --days are required with --status-file")
        try:
            run_sync(
                args.start_date,
                args.days,
                status_path=args.status_file,
                patient_limit=args.patient_limit,
            )
        except Exception as exc:
            mark_run_failed(args.status_file, exc)
            raise
        return

    start_date_text = args.start_date or input("Fecha clínica inicial (YYYY-MM-DD): ").strip()
    days_count = (
        args.days
        if args.days is not None
        else int(input("Cuántos días seguidos quieres sacar?: ").strip())
    )
    run_sync(
        start_date_text,
        days_count,
        status_path=None,
        patient_limit=args.patient_limit,
    )


if __name__ == "__main__":
    main()
