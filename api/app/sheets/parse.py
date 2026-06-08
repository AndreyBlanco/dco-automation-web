"""Parse Laura's operational sheet layout (header row, day markers, patient rows)."""

from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..models import IvfStatus, KindOfInsurance, SheetRow

# 0-based indices (columns A/C/D/E/F/I/J)
COL_DATE = 0
COL_PATIENT = 2
COL_KIND_INS = 3
COL_STATUS = 4
COL_AGE_TYPE = 5
COL_INSURANCE = 8
COL_NOTES = 9

_HEADER_PATIENT = "patient"
_HEADER_STATUS = "status"
_VALID_IVF: set[str] = {"New", "DONE B"}
_VALID_KIND: set[str] = {"PPO", "Medicaid", "No info"}
_VALID_AGE: set[str] = {"CHILD", "TEENAGER", "Adult", ""}


def clean_text(value: object) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", str(value)).strip()


def clean_name(value: object) -> str:
    return clean_text(value).replace("\n", " ").strip()


def _cell(row: list[str], index: int) -> str:
    if index >= len(row):
        return ""
    return clean_text(row[index])


def _is_day_marker(value_a: str) -> bool:
    cleaned = clean_text(value_a).replace(".0", "")
    if not cleaned.isdigit():
        return False
    num = int(cleaned)
    return 1 <= num <= 31


def _parse_date(value_a: str) -> str | None:
    cleaned = clean_text(value_a).replace(".0", "")
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", cleaned):
        return cleaned
    return None


def _parse_ivf_status(value: str) -> IvfStatus | None:
    if value in _VALID_IVF:
        return value  # type: ignore[return-value]
    return None


def _parse_kind(value: str) -> KindOfInsurance | None:
    if value in _VALID_KIND:
        return value  # type: ignore[return-value]
    return None


def row_to_sheet_row(row_index: int, raw: list[str]) -> SheetRow | None:
    from ..models import SheetRow

    patient = clean_name(_cell(raw, COL_PATIENT))
    if not patient:
        return None
    if patient.lower() == _HEADER_PATIENT:
        return None

    status_raw = _cell(raw, COL_STATUS)
    if status_raw.lower() == _HEADER_STATUS:
        return None

    ivf_status = _parse_ivf_status(status_raw)
    if ivf_status is None:
        return None

    date = _parse_date(_cell(raw, COL_DATE))
    if date is None:
        return None

    kind_raw = _cell(raw, COL_KIND_INS)
    kind = _parse_kind(kind_raw) if kind_raw else "No info"

    age_raw = _cell(raw, COL_AGE_TYPE)
    age_type = age_raw if age_raw in _VALID_AGE else ""

    return SheetRow(
        id=f"row-{row_index}",
        row_index=row_index,
        date=date,
        patient_name=patient,
        kind_of_insurance=kind,
        ivf_status=ivf_status,
        age_type=age_type,  # type: ignore[arg-type]
        insurance=_cell(raw, COL_INSURANCE),
        notes=_cell(raw, COL_NOTES),
    )


def parse_all_patient_rows(all_values: list[list[str]]) -> list[SheetRow]:
    from ..models import SheetRow

    rows: list[SheetRow] = []
    for row_index, raw in enumerate(all_values, start=1):
        parsed = row_to_sheet_row(row_index, raw)
        if parsed is not None:
            rows.append(parsed)
    return rows
