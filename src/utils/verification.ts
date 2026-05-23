import type { Patient } from '../types/models'
import type { VerifyInsuranceRequest } from '../types/verification-api'

export function patientToVerifyRequest(patient: Patient): VerifyInsuranceRequest {
  return {
    patientId: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: patient.dob,
    insuranceCarrier: patient.insuranceCarrier,
    insurancePlan: patient.insurancePlan,
    groupNumber: patient.groupNumber,
    memberId: patient.memberId,
  }
}
