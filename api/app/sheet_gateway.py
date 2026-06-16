"""Route sheet operations to Google Sheets or in-memory stub."""

from __future__ import annotations

from .config import sheet_use_google
from .models import (
    IvfStatus,
    KindOfInsurance,
    SheetRowPatch,
    SheetRowPatchResponse,
    SheetRowsResponse,
)
from .stubs import sheet_store
from . import audit_store

_store_mode: str | None = None


def store_mode() -> str:
    global _store_mode
    if _store_mode is None:
        _store_mode = "google" if sheet_use_google() else "stub"
    return _store_mode


def list_rows(
    *,
    date: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    ivf_status: IvfStatus | None = None,
    kind_of_insurance: KindOfInsurance | None = None,
    q: str | None = None,
) -> SheetRowsResponse:
    if store_mode() == "google":
        from .sheets import live_store

        return live_store.list_rows(
            date=date,
            date_from=date_from,
            date_to=date_to,
            ivf_status=ivf_status,
            kind_of_insurance=kind_of_insurance,
            q=q,
        )

    return sheet_store.list_rows(
        date=date,
        date_from=date_from,
        date_to=date_to,
        ivf_status=ivf_status,
        kind_of_insurance=kind_of_insurance,
        q=q,
    )


def patch_row(body: SheetRowPatch, username: str = "system") -> SheetRowPatchResponse:
    before_rows = list_rows()
    before_row = next(
        (row for row in before_rows.rows if row.row_index == body.row_index),
        None,
    )

    if before_row is None:
        raise KeyError(f"Row {body.row_index} was not found.")

    if body.ivf_status is None and body.notes is None:
        raise ValueError("No editable fields were provided.")

    if body.notes is not None and len(body.notes) > 2000:
        raise ValueError("Notes are too long.")

    before_data = audit_store.sheet_row_to_audit_dict(before_row)

    if store_mode() == "google":
        from .sheets import live_store

        response = live_store.patch_row(body)
    else:
        response = sheet_store.patch_row(body)

    after_data = audit_store.sheet_row_to_audit_dict(response.row)

    audit_store.log_patch(
        username=username,
        row_index=body.row_index,
        before=before_data,
        after=after_data,
    )

    return response


def list_audit(
    *,
    row_index: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    return audit_store.list_audit(
        row_index=row_index,
        date_from=date_from,
        date_to=date_to,
    )