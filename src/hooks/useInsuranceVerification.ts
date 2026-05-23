import { useCallback, useRef, useState } from 'react'
import { createInsuranceVerificationService } from '../services/verification'
import type { Patient } from '../types/models'
import type { VerificationStepLog, VerifyInsuranceResponse } from '../types/verification-api'
import { patientToVerifyRequest } from '../utils/verification'

export type VerificationRunState = 'idle' | 'running' | 'completed' | 'failed'

export function useInsuranceVerification() {
  const serviceRef = useRef(createInsuranceVerificationService())
  const abortRef = useRef(false)

  const [runState, setRunState] = useState<VerificationRunState>('idle')
  const [steps, setSteps] = useState<VerificationStepLog[]>([])
  const [lastResult, setLastResult] = useState<VerifyInsuranceResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    abortRef.current = true
    setRunState('idle')
    setSteps([])
    setLastResult(null)
    setError(null)
  }, [])

  const verifyPatient = useCallback(
    async (
      patient: Patient,
    ): Promise<{ result: VerifyInsuranceResponse } | { error: string }> => {
      abortRef.current = false
      setRunState('running')
      setSteps([])
      setLastResult(null)
      setError(null)

      try {
        const result = await serviceRef.current.verifyInsurance(patientToVerifyRequest(patient))
        if (abortRef.current) return { error: 'Verification cancelled.' }
        setSteps(result.steps)
        setLastResult(result)
        setRunState(result.status === 'completed' ? 'completed' : 'failed')
        return { result }
      } catch (e) {
        if (abortRef.current) return { error: 'Verification cancelled.' }
        const message = e instanceof Error ? e.message : 'Verification request failed.'
        setError(message)
        setRunState('failed')
        return { error: message }
      }
    },
    [],
  )

  return {
    runState,
    steps,
    lastResult,
    error,
    verifyPatient,
    reset,
    isRunning: runState === 'running',
  }
}
