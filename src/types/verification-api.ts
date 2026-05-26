import type { InsuranceStatus, VerificationSource } from './models'

/** Payload the UI sends when starting a robot job (mirrors future POST /api/verification). */
export interface VerifyInsuranceRequest {
  patientId: string
  firstName: string
  lastName: string
  dob: string
  insuranceCarrier: string
  insurancePlan: string
  groupNumber: string
  memberId: string
}

export type VerificationStepId = 'excel_lookup' | 'portal_scrape' | 'excel_write' | 'complete'

export type VerificationStepStatus = 'pending' | 'running' | 'ok' | 'skipped' | 'error'

export interface VerificationStepLog {
  step: VerificationStepId
  status: VerificationStepStatus
  message: string
  durationMs?: number
}

/** Result of a completed verification job (mirrors future API response body). */
export interface VerifyInsuranceResponse {
  jobId: string
  status: 'completed' | 'failed'
  insuranceStatus: InsuranceStatus
  verificationSource: VerificationSource
  planInExcelCatalog: boolean
  catalogRowAdded: boolean
  message: string
  steps: VerificationStepLog[]
  completedAt: string
}

export interface CatalogLookupRequest {
  insuranceCarrier: string
  insurancePlan: string
}

export interface CatalogLookupResponse {
  found: boolean
  carrier: string
  planName: string
  portalUrl?: string
}

export interface InsuranceVerificationService {
  verifyInsurance(request: VerifyInsuranceRequest): Promise<VerifyInsuranceResponse>
  lookupPlanInCatalog(request: CatalogLookupRequest): Promise<CatalogLookupResponse>
}
