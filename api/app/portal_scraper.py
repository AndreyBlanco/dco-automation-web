"""Insurer portal check — stub today, Playwright hook for a later phase."""

from __future__ import annotations

from dataclasses import dataclass

from .config import use_playwright


@dataclass(frozen=True)
class PortalScrapeResult:
    success: bool
    insurance_status: str  # verified | denied
    message: str


def scrape_insurer_portal(
    *,
    carrier: str,
    plan_name: str,
    member_id: str,
    portal_url: str | None,
) -> PortalScrapeResult:
    """
    When USE_PLAYWRIGHT=true, this module should launch Playwright against portal_url.
    For CSE499 step 3 we use a deterministic stub so demos are stable without browsers.
    """
    if use_playwright():
        # Placeholder for Laura / team: wire Playwright login + eligibility scrape here.
        return _stub_scrape(carrier, member_id)

    return _stub_scrape(carrier, member_id)


def _stub_scrape(carrier: str, member_id: str) -> PortalScrapeResult:
    # Deterministic: member IDs ending in even digit → verified (stable demos).
    last = member_id.strip()[-1:] if member_id.strip() else "0"
    try:
        even = int(last) % 2 == 0
    except ValueError:
        even = len(member_id) % 2 == 0

    if even:
        return PortalScrapeResult(
            success=True,
            insurance_status="verified",
            message=f"Member {member_id}: active coverage on {carrier} (portal stub).",
        )
    return PortalScrapeResult(
        success=False,
        insurance_status="denied",
        message=f"Member {member_id}: no active coverage returned (portal stub).",
    )
