"""Smoke tests for verification API — run with server on port 8000."""
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


def main() -> int:
    print("=== 1. GET /health ===")
    health = get("/health")
    print(json.dumps(health, indent=2))
    assert health.get("status") == "ok", health

    print("\n=== 2. GET catalog lookup (Aetna — in seed) ===")
    q = urllib.parse.urlencode({"carrier": "Aetna", "plan": "Aetna Dental PPO"})
    lookup_hit = get(f"/api/verification/catalog/lookup?{q}")
    print(json.dumps(lookup_hit, indent=2))
    assert lookup_hit.get("found") is True, lookup_hit
    assert lookup_hit.get("planName") == "Aetna Dental PPO", lookup_hit

    print("\n=== 3. GET catalog lookup (Cigna — may exist after prior run) ===")
    q2 = urllib.parse.urlencode({"carrier": "Cigna", "plan": "Cigna Dental"})
    lookup_cigna = get(f"/api/verification/catalog/lookup?{q2}")
    print(json.dumps(lookup_cigna, indent=2))

    print("\n=== 4. POST verify (John Smith / Cigna — portal path) ===")
    verify = post(
        "/api/verification/verify",
        {
            "patientId": "p-laura-2",
            "firstName": "John",
            "lastName": "Smith",
            "dob": "1972-09-03",
            "insuranceCarrier": "Cigna",
            "insurancePlan": "Cigna Dental",
            "groupNumber": "CGN-3318",
            "memberId": "CGN-3318",
        },
    )
    print(json.dumps(verify, indent=2))
    assert "jobId" in verify, verify
    assert verify.get("insuranceStatus") in ("verified", "denied"), verify
    assert len(verify.get("steps", [])) >= 3, verify

    print("\n=== 5. POST verify (Maria Lopez / Aetna — excel path) ===")
    verify2 = post(
        "/api/verification/verify",
        {
            "patientId": "p-laura-1",
            "firstName": "Maria",
            "lastName": "Lopez",
            "dob": "1985-04-12",
            "insuranceCarrier": "Aetna",
            "insurancePlan": "Aetna Dental PPO",
            "groupNumber": "AET-2049",
            "memberId": "AET-2049",
        },
    )
    print(json.dumps(verify2, indent=2))
    assert verify2.get("verificationSource") == "excel", verify2
    assert verify2.get("planInExcelCatalog") is True, verify2

    print("\nAll API smoke tests passed.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.URLError as e:
        print(f"ERROR: Could not reach API at {BASE}: {e}", file=sys.stderr)
        raise SystemExit(1)
