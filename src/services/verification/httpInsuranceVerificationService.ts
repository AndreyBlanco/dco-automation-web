import type {
  CatalogLookupRequest,
  CatalogLookupResponse,
  InsuranceVerificationService,
  VerifyInsuranceRequest,
  VerifyInsuranceResponse,
} from '../../types/verification-api'

/**
 * Future Python backend client. Enabled when VITE_VERIFICATION_API_URL is set.
 * Endpoints (planned):
 *   POST {base}/api/verification/verify
 *   GET  {base}/api/verification/catalog/lookup?carrier=&plan=
 */
export class HttpInsuranceVerificationService implements InsuranceVerificationService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  async lookupPlanInCatalog(request: CatalogLookupRequest): Promise<CatalogLookupResponse> {
    const params = new URLSearchParams({
      carrier: request.insuranceCarrier,
      plan: request.insurancePlan,
    })
    const res = await fetch(`${this.url('/api/verification/catalog/lookup')}?${params}`)
    if (!res.ok) {
      throw new Error(`Catalog lookup failed (${res.status})`)
    }
    return res.json() as Promise<CatalogLookupResponse>
  }

  async verifyInsurance(request: VerifyInsuranceRequest): Promise<VerifyInsuranceResponse> {
    const res = await fetch(this.url('/api/verification/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!res.ok) {
      throw new Error(`Verification failed (${res.status})`)
    }
    return res.json() as Promise<VerifyInsuranceResponse>
  }
}
