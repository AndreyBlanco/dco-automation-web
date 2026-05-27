"""Robot pipeline: Excel catalog lookup → portal scrape → Excel write."""

from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from .excel_catalog import add_plan, append_verification_log, lookup_plan
from .models import (
    CatalogLookupResponse,
    VerificationStepLog,
    VerifyInsuranceRequest,
    VerifyInsuranceResponse,
)
from .portal_scraper import scrape_insurer_portal


def _job_id() -> str:
    return f"job-{uuid.uuid4().hex[:12]}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def catalog_lookup(carrier: str, plan_name: str) -> CatalogLookupResponse:
    hit = lookup_plan(carrier, plan_name)
    if not hit:
        return CatalogLookupResponse(
            found=False,
            carrier=carrier,
            plan_name=plan_name,
        )
    return CatalogLookupResponse(
        found=True,
        carrier=hit.carrier,
        plan_name=hit.plan_name,
        portal_url=hit.portal_url,
    )


def verify_patient(request: VerifyInsuranceRequest) -> VerifyInsuranceResponse:
    job_id = _job_id()
    steps: list[VerificationStepLog] = []
    t0 = time.perf_counter()

    steps.append(
        VerificationStepLog(
            step="excel_lookup",
            status="running",
            message="Searching plan catalog spreadsheet…",
        )
    )

    catalog_hit = lookup_plan(request.insurance_carrier, request.insurance_plan)
    lookup_ms = int((time.perf_counter() - t0) * 1000)

    if catalog_hit:
        steps[0] = VerificationStepLog(
            step="excel_lookup",
            status="ok",
            message=f"Plan found: {catalog_hit.carrier} · {catalog_hit.plan_name}",
            duration_ms=lookup_ms,
        )
        steps.append(
            VerificationStepLog(
                step="portal_scrape",
                status="skipped",
                message="Portal not required — plan type already in Excel.",
            )
        )
        steps.append(
            VerificationStepLog(
                step="excel_write",
                status="skipped",
                message="No new plan row needed.",
            )
        )

        # Catalog hit: member parity rule (same as portal stub) for consistency.
        last = request.member_id.strip()[-1:] if request.member_id.strip() else "0"
        try:
            verified = int(last) % 2 == 0
        except ValueError:
            verified = len(request.member_id) % 2 == 0

        insurance_status = "verified" if verified else "denied"
        steps.append(
            VerificationStepLog(
                step="complete",
                status="ok",
                message=(
                    "Eligibility confirmed from catalog."
                    if verified
                    else "Coverage denied per catalog rules."
                ),
            )
        )

        response = VerifyInsuranceResponse(
            job_id=job_id,
            status="completed",
            insurance_status=insurance_status,
            verification_source="excel",
            plan_in_excel_catalog=True,
            catalog_row_added=False,
            message="Verified using Excel catalog.",
            steps=steps,
            completed_at=_now_iso(),
        )
        _log_run(request, response)
        return response

    steps[0] = VerificationStepLog(
        step="excel_lookup",
        status="ok",
        message="Plan type not in catalog — portal check required.",
        duration_ms=lookup_ms,
    )

    portal_t0 = time.perf_counter()
    steps.append(
        VerificationStepLog(
            step="portal_scrape",
            status="running",
            message=f"Opening insurer portal for {request.insurance_carrier}…",
        )
    )

    portal = scrape_insurer_portal(
        carrier=request.insurance_carrier,
        plan_name=request.insurance_plan,
        member_id=request.member_id,
        portal_url=None,
    )
    portal_ms = int((time.perf_counter() - portal_t0) * 1000)

    steps[1] = VerificationStepLog(
        step="portal_scrape",
        status="ok" if portal.success else "error",
        message=portal.message,
        duration_ms=portal_ms,
    )

    if not portal.success:
        steps.append(
            VerificationStepLog(
                step="excel_write",
                status="skipped",
                message="Catalog not updated — portal check failed.",
            )
        )
        steps.append(
            VerificationStepLog(
                step="complete",
                status="error",
                message="Verification failed.",
            )
        )
        response = VerifyInsuranceResponse(
            job_id=job_id,
            status="failed",
            insurance_status="denied",
            verification_source="portal",
            plan_in_excel_catalog=False,
            catalog_row_added=False,
            message="Insurer portal returned no coverage.",
            steps=steps,
            completed_at=_now_iso(),
        )
        _log_run(request, response)
        return response

    write_t0 = time.perf_counter()
    write_idx = len(steps)
    steps.append(
        VerificationStepLog(
            step="excel_write",
            status="running",
            message="Appending plan type to Excel catalog…",
        )
    )
    add_plan(request.insurance_carrier, request.insurance_plan)
    write_ms = int((time.perf_counter() - write_t0) * 1000)

    steps[write_idx] = VerificationStepLog(
        step="excel_write",
        status="ok",
        message="New plan row saved to catalog spreadsheet.",
        duration_ms=write_ms,
    )
    steps.append(
        VerificationStepLog(
            step="complete",
            status="ok",
            message="Verification complete — catalog updated for future patients.",
        )
    )

    response = VerifyInsuranceResponse(
        job_id=job_id,
        status="completed",
        insurance_status=portal.insurance_status,
        verification_source="portal",
        plan_in_excel_catalog=True,
        catalog_row_added=True,
        message="Verified via portal; plan added to Excel catalog.",
        steps=steps,
        completed_at=_now_iso(),
    )
    _log_run(request, response)
    return response


def _log_run(request: VerifyInsuranceRequest, response: VerifyInsuranceResponse) -> None:
    append_verification_log(
        job_id=response.job_id,
        patient_id=request.patient_id,
        member_id=request.member_id,
        carrier=request.insurance_carrier,
        plan_name=request.insurance_plan,
        status=response.insurance_status,
        source=response.verification_source,
        first_name=request.first_name,
        last_name=request.last_name,
    )
