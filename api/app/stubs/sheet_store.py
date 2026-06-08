"""In-memory operational sheet rows (Sprint 2 stub). Replace with Google Sheets gateway."""

from __future__ import annotations

from copy import deepcopy

from ..models import (
    IvfStatus,
    KindOfInsurance,
    SheetRow,
    SheetRowPatch,
    SheetRowPatchResponse,
    SheetRowsMeta,
    SheetRowsResponse,
)

_SEED: list[dict] = [
    {
        "id": "row-12",
        "row_index": 12,
        "date": "2026-05-27",
        "patient_name": "Maria Lopez",
        "kind_of_insurance": "PPO",
        "ivf_status": "DONE B",
        "age_type": "Adult",
        "insurance": "AETNA",
        "notes": "CHART: 1042\nPID: 19000011174867\nSUB ID: 8821044\nIVF 2026 FOUND",
        "appointment_time": "9:00AM",
    },
    {
        "id": "row-13",
        "row_index": 13,
        "date": "2026-05-27",
        "patient_name": "James Carter",
        "kind_of_insurance": "PPO",
        "ivf_status": "New",
        "age_type": "Adult",
        "insurance": "DDIL",
        "notes": "CHART: 2201\nPID: 19000011174890\nNO IVF 2026",
        "appointment_time": "10:30AM",
    },
    {
        "id": "row-14",
        "row_index": 14,
        "date": "2026-05-27",
        "patient_name": "Sofia Nguyen",
        "kind_of_insurance": "No info",
        "ivf_status": "New",
        "age_type": "TEENAGER",
        "insurance": "",
        "notes": "CHART: 3310\nPID: 19000011174901\nNO IVF 2026",
        "appointment_time": "11:00AM",
    },
    {
        "id": "row-15",
        "row_index": 15,
        "date": "2026-05-28",
        "patient_name": "Robert Kim",
        "kind_of_insurance": "PPO",
        "ivf_status": "DONE B",
        "age_type": "Adult",
        "insurance": "BCBSIL",
        "notes": "CHART: 1188\nIVF 2026 FOUND",
        "appointment_time": "8:00AM",
    },
    {
        "id": "row-16",
        "row_index": 16,
        "date": "2026-05-28",
        "patient_name": "Emily Davis",
        "kind_of_insurance": "PPO",
        "ivf_status": "New",
        "age_type": "CHILD",
        "insurance": "GUARDIAN",
        "notes": "CHART: 5520\nNO IVF 2026",
        "appointment_time": "2:00PM",
    },
    {
        "id": "row-17",
        "row_index": 17,
        "date": "2026-05-28",
        "patient_name": "Michael Brown",
        "kind_of_insurance": "PPO",
        "ivf_status": "DONE B",
        "age_type": "Adult",
        "insurance": "UHC",
        "notes": "CHART: 9012\nSUB ID: 4410299\nIVF 2026 FOUND",
    },
    {
        "id": "row-18",
        "row_index": 18,
        "date": "2026-05-29",
        "patient_name": "Ana Martinez",
        "kind_of_insurance": "No info",
        "ivf_status": "New",
        "age_type": "Adult",
        "insurance": "METLIFE",
        "notes": "CHART: 7744\nNO IVF 2026",
    },
    {
        "id": "row-19",
        "row_index": 19,
        "date": "2026-05-29",
        "patient_name": "David Wilson",
        "kind_of_insurance": "PPO",
        "ivf_status": "New",
        "age_type": "Adult",
        "insurance": "ANTHEM",
        "notes": "CHART: 6601\nPID: 19000011175022",
    },
]

_rows: list[SheetRow] = [SheetRow.model_validate(deepcopy(r)) for r in _SEED]


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
    filtered = [
        row
        for row in _rows
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

    for idx, row in enumerate(_rows):
        if row.row_index != body.row_index:
            continue
        updated = row.model_copy(
            update={
                "ivf_status": body.ivf_status if body.ivf_status is not None else row.ivf_status,
                "notes": body.notes if body.notes is not None else row.notes,
            }
        )
        _rows[idx] = updated
        return SheetRowPatchResponse(ok=True, row=updated, message="Row updated (in-memory stub).")

    raise KeyError(f"No row with rowIndex={body.row_index}")
