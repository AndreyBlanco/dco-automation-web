import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { seedPatients } from '../data/mockPatients'
import { lookupPlan } from '../services/verification/planCatalogStore'
import type {
  InsuranceStatus,
  Patient,
  PatientDraft,
  PatientStats,
  VerificationSource,
} from '../types/models'
import type { VerifyInsuranceResponse } from '../types/verification-api'
import {
  computePatientStats,
  createPatientId,
  patientFromDraft,
  validatePatientDraft,
} from '../utils/patient'

interface PatientsContextValue {
  patients: Patient[]
  stats: PatientStats
  addPatient: (draft: PatientDraft) => { ok: true; patient: Patient } | { ok: false; error: string }
  updatePatient: (
    id: string,
    draft: PatientDraft,
  ) => { ok: true } | { ok: false; error: string }
  deletePatient: (id: string) => void
  getPatient: (id: string) => Patient | undefined
  togglePendingVerified: (id: string) => void
  setInsuranceStatus: (id: string, status: InsuranceStatus, source?: VerificationSource) => void
  applyVerificationResult: (id: string, result: VerifyInsuranceResponse) => void
  refreshPlanCatalogFlags: () => void
  updateNotes: (id: string, notes: string) => void
}

function withCatalogFlag(patient: Patient): Patient {
  const inCatalog = lookupPlan(patient.insuranceCarrier, patient.insurancePlan).found
  return { ...patient, planInExcelCatalog: inCatalog }
}

const PatientsContext = createContext<PatientsContextValue | null>(null)

export function PatientsProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() =>
    seedPatients.map((p) => withCatalogFlag({ ...p })),
  )

  const stats = useMemo(() => computePatientStats(patients), [patients])

  const getPatient = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  )

  const addPatient = useCallback((draft: PatientDraft) => {
    const error = validatePatientDraft(draft)
    if (error) return { ok: false as const, error }
    const patient = withCatalogFlag(patientFromDraft(draft, createPatientId()))
    setPatients((prev) => [patient, ...prev])
    return { ok: true as const, patient }
  }, [])

  const updatePatient = useCallback((id: string, draft: PatientDraft) => {
    const error = validatePatientDraft(draft)
    if (error) return { ok: false as const, error }
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next = patientFromDraft(draft, id)
        return {
          ...next,
          insuranceStatus: p.insuranceStatus,
          notes: p.notes,
          lastVerifiedAt: p.lastVerifiedAt,
          verificationSource: p.verificationSource,
          planInExcelCatalog: p.planInExcelCatalog,
        }
      }),
    )
    return { ok: true as const }
  }, [])

  const deletePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const togglePendingVerified = useCallback((id: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nextStatus: InsuranceStatus =
          p.insuranceStatus === 'verified' ? 'pending' : 'verified'
        return {
          ...p,
          insuranceStatus: nextStatus,
          verificationSource: 'manual',
        }
      }),
    )
  }, [])

  const setInsuranceStatus = useCallback(
    (id: string, status: InsuranceStatus, source: VerificationSource = 'simulated') => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                insuranceStatus: status,
                verificationSource: source,
                lastVerifiedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
    },
    [],
  )

  const applyVerificationResult = useCallback((id: string, result: VerifyInsuranceResponse) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              insuranceStatus: result.insuranceStatus,
              verificationSource: result.verificationSource,
              planInExcelCatalog: result.planInExcelCatalog,
              lastVerifiedAt: result.completedAt,
            }
          : p,
      ),
    )
  }, [])

  const refreshPlanCatalogFlags = useCallback(() => {
    setPatients((prev) => prev.map((p) => withCatalogFlag(p)))
  }, [])

  const updateNotes = useCallback((id: string, notes: string) => {
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)))
  }, [])

  const value = useMemo(
    () => ({
      patients,
      stats,
      addPatient,
      updatePatient,
      deletePatient,
      getPatient,
      togglePendingVerified,
      setInsuranceStatus,
      applyVerificationResult,
      refreshPlanCatalogFlags,
      updateNotes,
    }),
    [
      patients,
      stats,
      addPatient,
      updatePatient,
      deletePatient,
      getPatient,
      togglePendingVerified,
      setInsuranceStatus,
      applyVerificationResult,
      refreshPlanCatalogFlags,
      updateNotes,
    ],
  )

  return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>
}

export function usePatients() {
  const ctx = useContext(PatientsContext)
  if (!ctx) throw new Error('usePatients must be used within PatientsProvider')
  return ctx
}
