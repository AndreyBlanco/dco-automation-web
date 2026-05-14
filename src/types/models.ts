export type InsuranceStatus = 'verified' | 'pending' | 'denied'

export type VerificationUiState = 'idle' | 'verifying' | 'verified' | 'denied'

export interface Patient {
  id: string
  firstName: string
  lastName: string
  dob: string
  insurancePlan: string
  insuranceStatus: InsuranceStatus
  memberId: string
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
