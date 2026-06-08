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


def patch_row(body: SheetRowPatch) -> SheetRowPatchResponse:
    if store_mode() == "google":
        from .sheets import live_store

        return live_store.patch_row(body)
    return sheet_store.patch_row(body)
