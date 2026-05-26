import type { InsuranceVerificationService } from '../../types/verification-api'
import { HttpInsuranceVerificationService } from './httpInsuranceVerificationService'
import { StubInsuranceVerificationService } from './stubInsuranceVerificationService'

let singleton: InsuranceVerificationService | null = null

export function createInsuranceVerificationService(): InsuranceVerificationService {
  if (singleton) return singleton

  const apiBase = import.meta.env.VITE_VERIFICATION_API_URL?.trim()
  if (apiBase) {
    singleton = new HttpInsuranceVerificationService(apiBase)
  } else {
    singleton = new StubInsuranceVerificationService()
  }
  return singleton
}

/** @internal tests */
export function resetInsuranceVerificationService(): void {
  singleton = null
}
