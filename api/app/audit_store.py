from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .models import SheetRow, SheetRowPatch


DB_PATH = Path(__file__).resolve().parent.parent / "audit.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sheet_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                username TEXT NOT NULL,
                row_index INTEGER NOT NULL,
                before_json TEXT NOT NULL,
                after_json TEXT NOT NULL
            )
            """
        )
        conn.commit()


def log_patch(
    *,
    username: str,
    row_index: int,
    before: dict[str, Any],
    after: dict[str, Any],
) -> None:
    init_db()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO sheet_audit (
                created_at,
                username,
                row_index,
                before_json,
                after_json
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                datetime.now(timezone.utc).isoformat(),
                username,
                row_index,
                json.dumps(before, ensure_ascii=False),
                json.dumps(after, ensure_ascii=False),
            ),
        )
        conn.commit()


def list_audit(
    *,
    row_index: int | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict[str, Any]]:
    init_db()
    query = "SELECT * FROM sheet_audit WHERE 1=1"
    params: list[Any] = []

    if row_index is not None:
        query += " AND row_index = ?"
        params.append(row_index)

    if date_from:
        query += " AND created_at >= ?"
        params.append(date_from)

    if date_to:
        query += " AND created_at <= ?"
        params.append(date_to)

    query += " ORDER BY created_at DESC"

    with _connect() as conn:
        rows = conn.execute(query, params).fetchall()

    return [
        {
            "id": row["id"],
            "createdAt": row["created_at"],
            "username": row["username"],
            "rowIndex": row["row_index"],
            "before": json.loads(row["before_json"]),
            "after": json.loads(row["after_json"]),
        }
        for row in rows
    ]


def sheet_row_to_audit_dict(row: SheetRow) -> dict[str, Any]:
    return {
        "rowIndex": row.row_index,
        "ivfStatus": row.ivf_status,
        "notes": row.notes,
    }


def patch_to_audit_dict(patch: SheetRowPatch) -> dict[str, Any]:
    data: dict[str, Any] = {
        "rowIndex": patch.row_index,
    }

    if patch.ivf_status is not None:
        data["ivfStatus"] = patch.ivf_status

    if patch.notes is not None:
        data["notes"] = patch.notes

    return data
