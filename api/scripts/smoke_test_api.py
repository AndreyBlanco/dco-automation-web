"""Smoke tests for IVF API gateway — run with server on port 8000."""
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

BASE = "http://127.0.0.1:8000"


def get(path: str) -> dict:
    with urllib.request.urlopen(f"{BASE}{path}") as r:
        return json.loads(r.read().decode())


def post(path: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def patch(path: str, body: dict) -> dict:
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="PATCH",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())


def main() -> int:
    print("=== 1. GET /health ===")
    health = get("/health")
    print(json.dumps(health, indent=2))
    assert health.get("status") == "ok", health
    assert health.get("sheet") in ("google", "stub"), health
    print(f"Sheet backend: {health.get('sheet')}")

    print("\n=== 2. GET /api/sheet/rows (date filter) ===")
    q = urllib.parse.urlencode({"date": "2026-05-27"})
    sheet = get(f"/api/sheet/rows?{q}")
    print(json.dumps(sheet, indent=2))
    rows = sheet.get("rows", [])
    assert len(rows) >= 2, sheet
    assert all(r.get("date") == "2026-05-27" for r in rows), sheet

    print("\n=== 3. PATCH /api/sheet/row ===")
    patched = patch(
        "/api/sheet/row",
        {"rowIndex": 13, "ivfStatus": "DONE B"},
    )
    print(json.dumps(patched, indent=2))
    assert patched.get("ok") is True, patched
    assert patched["row"]["ivfStatus"] == "DONE B", patched

    print("\n=== 4. POST /api/robot/run ===")
    run = post(
        "/api/robot/run",
        {"startDate": "2026-05-27", "days": 2},
    )
    print(json.dumps(run, indent=2))
    run_id = run.get("runId")
    assert run_id, run
    assert run.get("status") == "awaiting_login", run

    print("\n=== 5. GET /api/robot/runs/{runId} ===")
    detail = get(f"/api/robot/runs/{run_id}")
    print(json.dumps(detail, indent=2))
    assert detail.get("runId") == run_id, detail
    assert detail.get("status") in ("awaiting_login", "running", "completed"), detail

    print("\nAll IVF API smoke tests passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as e:
        print(f"ERROR: Could not reach API at {BASE}: {e}", file=sys.stderr)
        raise SystemExit(1)
