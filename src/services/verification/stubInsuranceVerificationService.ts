import type {
  CatalogLookupRequest,
  CatalogLookupResponse,
  InsuranceVerificationService,
  VerificationStepLog,
  VerifyInsuranceRequest,
  VerifyInsuranceResponse,
} from '../../types/verification-api'
import { addPlanToCatalog, lookupPlan } from './planCatalogStore'

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Stub robot pipeline: Excel lookup → (optional) Playwright portal → Excel write.
 * Replace with HTTP client pointing at the Python service when ready.
 */
export class StubInsuranceVerificationService implements InsuranceVerificationService {
  async lookupPlanInCatalog(request: CatalogLookupRequest): Promise<CatalogLookupResponse> {
    await delay(120)
    return lookupPlan(request.insuranceCarrier, request.insurancePlan)
  }

  async verifyInsurance(request: VerifyInsuranceRequest): Promise<VerifyInsuranceResponse> {
    const jobId = createJobId()
    const steps: VerificationStepLog[] = []
    const started = performance.now()

    steps.push({
      step: 'excel_lookup',
      status: 'running',
      message: 'Searching plan catalog spreadsheet…',
    })
    await delay(500)

    const catalogHit = lookupPlan(request.insuranceCarrier, request.insurancePlan)
    const lookupMs = Math.round(performance.now() - started)

    if (catalogHit.found) {
      steps[0] = {
        step: 'excel_lookup',
        status: 'ok',
        message: `Plan found: ${catalogHit.carrier} · ${catalogHit.planName}`,
        durationMs: lookupMs,
      }
      steps.push({
        step: 'portal_scrape',
        status: 'skipped',
        message: 'Portal not required — plan type already in Excel.',
      })
      steps.push({
        step: 'excel_write',
        status: 'skipped',
        message: 'No new plan row needed.',
      })

      const verified = Math.random() < 0.9
      const insuranceStatus = verified ? 'verified' : 'denied'

      steps.push({
        step: 'complete',
        status: 'ok',
        message: verified ? 'Eligibility confirmed from catalog.' : 'Coverage denied per catalog rules.',
      })

      return {
        jobId,
        status: 'completed',
        insuranceStatus,
        verificationSource: 'excel',
        planInExcelCatalog: true,
        catalogRowAdded: false,
        message: verified
          ? 'Verified using Excel catalog (stub).'
          : 'Denied using Excel catalog rules (stub).',
        steps,
        completedAt: new Date().toISOString(),
      }
    }

    steps[0] = {
      step: 'excel_lookup',
      status: 'ok',
      message: 'Plan type not in catalog — portal check required.',
      durationMs: lookupMs,
    }

    steps.push({
      step: 'portal_scrape',
      status: 'running',
      message: `Opening insurer portal for ${request.insuranceCarrier}…`,
    })
    await delay(1100)

    const portalOk = Math.random() < 0.74
    steps[1] = {
      step: 'portal_scrape',
      status: portalOk ? 'ok' : 'error',
      message: portalOk
        ? `Member ${request.memberId}: eligibility retrieved (Playwright stub).`
        : `Portal could not confirm member ${request.memberId}.`,
      durationMs: 1100,
    }

    if (!portalOk) {
      steps.push({
        step: 'excel_write',
        status: 'skipped',
        message: 'Catalog not updated — portal check failed.',
      })
      steps.push({
        step: 'complete',
        status: 'error',
        message: 'Verification failed.',
      })
      return {
        jobId,
        status: 'failed',
        insuranceStatus: 'denied',
        verificationSource: 'portal',
        planInExcelCatalog: false,
        catalogRowAdded: false,
        message: 'Insurer portal returned no coverage (stub).',
        steps,
        completedAt: new Date().toISOString(),
      }
    }

    steps.push({
      step: 'excel_write',
      status: 'running',
      message: 'Appending plan type to Excel catalog…',
    })
    await delay(400)

    addPlanToCatalog(
      request.insuranceCarrier,
      request.insurancePlan,
      `https://portal.${request.insuranceCarrier.toLowerCase().replace(/\s+/g, '')}.example`,
    )

    steps[2] = {
      step: 'excel_write',
      status: 'ok',
      message: 'New plan row saved to catalog spreadsheet.',
      durationMs: 400,
    }
    steps.push({
      step: 'complete',
      status: 'ok',
      message: 'Verification complete — catalog updated for future patients.',
    })

    return {
      jobId,
      status: 'completed',
      insuranceStatus: 'verified',
      verificationSource: 'portal',
      planInExcelCatalog: true,
      catalogRowAdded: true,
      message: 'Verified via portal; plan added to Excel catalog (stub).',
      steps,
      completedAt: new Date().toISOString(),
    }
  }
}
