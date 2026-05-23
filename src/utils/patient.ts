import type { Patient, PatientDraft, PatientStats } from '../types/models'

let idCounter = 0

export function createPatientId(): string {
  idCounter += 1
  return `p${Date.now()}-${idCounter}`
}

export function patientFullName(p: Pick<Patient, 'firstName' | 'lastName'>): string {
  return `${p.firstName} ${p.lastName}`.trim()
}

export function emptyPatientDraft(): PatientDraft {
  return {
    firstName: '',
    lastName: '',
    dob: '',
    insuranceCarrier: '',
    insurancePlan: '',
    groupNumber: '',
    memberId: '',
  }
}

export function validatePatientDraft(draft: PatientDraft): string | null {
  if (!draft.firstName.trim() || !draft.lastName.trim()) {
    return 'First and last name are required.'
  }
  if (!draft.insuranceCarrier.trim()) {
    return 'Insurance carrier is required.'
  }
  if (!draft.groupNumber.trim()) {
    return 'Group number is required.'
  }
  return null
}

export function computePatientStats(patients: Patient[]): PatientStats {
  return {
    total: patients.length,
    verified: patients.filter((p) => p.insuranceStatus === 'verified').length,
    pending: patients.filter((p) => p.insuranceStatus === 'pending').length,
    denied: patients.filter((p) => p.insuranceStatus === 'denied').length,
  }
}

export function draftFromPatient(p: Patient): PatientDraft {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    dob: p.dob,
    insuranceCarrier: p.insuranceCarrier,
    insurancePlan: p.insurancePlan,
    groupNumber: p.groupNumber,
    memberId: p.memberId,
  }
}

export function patientFromDraft(draft: PatientDraft, id: string): Patient {
  const carrier = draft.insuranceCarrier.trim()
  const plan = draft.insurancePlan.trim() || carrier
  const group = draft.groupNumber.trim()
  return {
    id,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    dob: draft.dob.trim() || '—',
    insuranceCarrier: carrier,
    insurancePlan: plan,
    groupNumber: group,
    memberId: draft.memberId.trim() || group,
    insuranceStatus: 'pending',
    verificationSource: 'manual',
    planInExcelCatalog: false,
  }
}
