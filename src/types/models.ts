/** On-file verification status (staff view + robot outcome). */
export type InsuranceStatus = 'verified' | 'pending' | 'denied'

/** UI state while a verification job runs on the detail screen. */
export type VerificationUiState = 'idle' | 'verifying' | 'verified' | 'denied'

/** How the latest status was determined (robot pipeline). */
export type VerificationSource = 'manual' | 'excel' | 'portal' | 'simulated'

export type StatusFilter = 'all' | InsuranceStatus

export interface Patient {
  id: string
  firstName: string
  lastName: string
  dob: string
  /** Carrier / payer (e.g. Aetna, Cigna). */
  insuranceCarrier: string
  /** Plan or product name shown to staff. */
  insurancePlan: string
  /** Group or policy group number (Laura: Group Number). */
  groupNumber: string
  /** Member / subscriber ID for portal lookup. */
  memberId: string
  insuranceStatus: InsuranceStatus
  notes?: string
  lastVerifiedAt?: string | null
  verificationSource?: VerificationSource | null
  /** True when plan type was found in the Excel catalog (robot step 1). */
  planInExcelCatalog?: boolean
}

/** Payload for create/update forms. */
export interface PatientDraft {
  firstName: string
  lastName: string
  dob: string
  insuranceCarrier: string
  insurancePlan: string
  groupNumber: string
  memberId: string
}

export interface PatientStats {
  total: number
  verified: number
  pending: number
  denied: number
}

/** Future: one robot run per patient (Excel lookup → portal scrape). */
export interface VerificationRun {
  id: string
  patientId: string
  startedAt: string
  completedAt?: string
  outcome: InsuranceStatus | 'error'
  source: VerificationSource
  message?: string
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  procedure: string
  notes?: string
}

export interface ReportRow {
  id: string
  title: string
  generatedAt: string
  type: 'weekly' | 'custom'
}

/** Row in the Excel plan catalog (robot checks this before opening a portal). */
export interface InsurancePlanCatalogEntry {
  id: string
  carrier: string
  planName: string
  portalUrl?: string
}
