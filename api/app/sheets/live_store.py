"""Read/write operational rows from Google Sheets (service account)."""

from __future__ import annotations

import gspread
from google.oauth2.service_account import Credentials

from ..config import (
    google_credentials_path,
    google_sheet_name,
    google_worksheet_name,
)
from ..models import (
    IvfStatus,
    KindOfInsurance,
    SheetRow,
    SheetRowPatch,
    SheetRowPatchResponse,
    SheetRowsMeta,
    SheetRowsResponse,
)
from .parse import COL_NOTES, COL_STATUS, parse_all_patient_rows

_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

_worksheet: gspread.Worksheet | None = None


def _get_worksheet() -> gspread.Worksheet:
    global _worksheet
    if _worksheet is not None:
        return _worksheet

    creds_path = google_credentials_path()
    if not creds_path.is_file():
        raise FileNotFoundError(f"Google credentials not found: {creds_path}")

    creds = Credentials.from_service_account_file(str(creds_path), scopes=_SCOPES)
    client = gspread.authorize(creds)
    _worksheet = client.open(google_sheet_name()).worksheet(google_worksheet_name())
    return _worksheet


def _invalidate_cache() -> None:
    global _worksheet
    _worksheet = None


def _load_rows() -> list[SheetRow]:
    ws = _get_worksheet()
    return parse_all_patient_rows(ws.get_all_values())


def _matches(
    row: SheetRow,
    *,
    date: str | None,
    date_from: str | None,
    date_to: str | None,
    ivf_status: IvfStatus | None,
    kind_of_insurance: KindOfInsurance | None,
    q: str | None,
) -> bool:
    if date and row.date != date:
        return False
    if date_from and row.date < date_from:
        return False
    if date_to and row.date > date_to:
        return False
    if ivf_status and row.ivf_status != ivf_status:
        return False
    if kind_of_insurance and row.kind_of_insurance != kind_of_insurance:
        return False
    if q:
        needle = q.strip().lower()
        hay = f"{row.patient_name} {row.insurance} {row.notes}".lower()
        if needle not in hay:
            return False
    return True


def list_rows(
    *,
    date: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    ivf_status: IvfStatus | None = None,
    kind_of_insurance: KindOfInsurance | None = None,
    q: str | None = None,
) -> SheetRowsResponse:
    all_rows = _load_rows()
    filtered = [
        row
        for row in all_rows
        if _matches(
            row,
            date=date,
            date_from=date_from,
            date_to=date_to,
            ivf_status=ivf_status,
            kind_of_insurance=kind_of_insurance,
            q=q,
        )
    ]
    return SheetRowsResponse(
        rows=filtered,
        meta=SheetRowsMeta(date_from=date_from, date_to=date_to, count=len(filtered)),
    )


def patch_row(body: SheetRowPatch) -> SheetRowPatchResponse:
    if body.ivf_status is None and body.notes is None:
        raise ValueError("At least one of ivfStatus or notes is required.")

    ws = _get_worksheet()
    row_index = body.row_index

    if body.ivf_status is not None:
        ws.update_cell(row_index, COL_STATUS + 1, body.ivf_status)
    if body.notes is not None:
        ws.update_cell(row_index, COL_NOTES + 1, body.notes)

    _invalidate_cache()
    all_rows = _load_rows()
    updated = next((r for r in all_rows if r.row_index == row_index), None)
    if updated is None:
        raise KeyError(f"No patient row at rowIndex={row_index}")

    return SheetRowPatchResponse(
        ok=True,
        row=updated,
        message="Row updated in Google Sheet (columns E/J only).",
    )
