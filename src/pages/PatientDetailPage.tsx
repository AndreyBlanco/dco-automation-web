import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextAreaField } from '../components/ui/Field'
import { InsuranceBadge } from '../components/ui/InsuranceBadge'
import { usePatients } from '../context/PatientsContext'
import { useToast } from '../context/ToastContext'
import { useInsuranceVerification } from '../hooks/useInsuranceVerification'
import type { VerificationUiState } from '../types/models'
import { patientFullName } from '../utils/patient'
import styles from './PatientDetailPage.module.css'

function sessionUiState(
  isRunning: boolean,
  lastStatus: 'verified' | 'denied' | undefined,
): VerificationUiState {
  if (isRunning) return 'verifying'
  if (lastStatus === 'verified') return 'verified'
  if (lastStatus === 'denied') return 'denied'
  return 'idle'
}

export function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { getPatient, applyVerificationResult, refreshPlanCatalogFlags, updateNotes } =
    usePatients()
  const { verifyPatient, isRunning, steps, lastResult, reset } = useInsuranceVerification()

  const patient = id ? getPatient(id) : undefined
  const [notes, setNotes] = useState(patient?.notes ?? '')

  useEffect(() => {
    setNotes(patient?.notes ?? '')
    reset()
  }, [patient?.id, patient?.notes, reset])

  if (!patient) {
    return (
      <div>
        <p>Patient not found.</p>
        <Link to="/patients">Back to insurance verification</Link>
      </div>
    )
  }

  const activePatient = patient

  async function runVerification() {
    if (isRunning) return
    const outcome = await verifyPatient(activePatient)
    if ('error' in outcome) {
      pushToast(outcome.error, 'error')
      return
    }
    const { result } = outcome
    applyVerificationResult(activePatient.id, result)
    if (result.catalogRowAdded) refreshPlanCatalogFlags()
    pushToast(result.message, result.status === 'completed' ? 'success' : 'error')
  }

  const verifyState = sessionUiState(
    isRunning,
    lastResult?.insuranceStatus === 'pending' ? undefined : lastResult?.insuranceStatus,
  )

  const statusLabel =
    verifyState === 'idle'
      ? 'Not run in this session'
      : verifyState === 'verifying'
        ? 'Verifying…'
        : verifyState === 'verified'
          ? 'Verified'
          : 'Denied'

  const usingApi = Boolean(import.meta.env.VITE_VERIFICATION_API_URL?.trim())

  return (
    <div className={styles.layout}>
      <div className={styles.topRow}>
        <div>
          <button type="button" className={styles.back} onClick={() => navigate('/patients')}>
            ← Back to records
          </button>
          <h2 style={{ margin: '8px 0 0' }}>{patientFullName(patient)}</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-small)' }}>
            Group {patient.groupNumber} · Member {patient.memberId}
          </p>
        </div>
        <InsuranceBadge status={patient.insuranceStatus} />
      </div>

      <div className={styles.grid2}>
        <Card noHover>
          <h3 style={{ marginTop: 0 }}>Patient info</h3>
          <dl className={styles.dl}>
            <div>
              <dt className={styles.dt}>Date of birth</dt>
              <dd className={styles.dd}>{patient.dob}</dd>
            </div>
            <div>
              <dt className={styles.dt}>Patient ID</dt>
              <dd className={styles.dd}>{patient.id.toUpperCase()}</dd>
            </div>
          </dl>
        </Card>

        <Card noHover>
          <h3 style={{ marginTop: 0 }}>Insurance info</h3>
          <dl className={styles.dl}>
            <div>
              <dt className={styles.dt}>Carrier</dt>
              <dd className={styles.dd}>{patient.insuranceCarrier}</dd>
            </div>
            <div>
              <dt className={styles.dt}>Plan</dt>
              <dd className={styles.dd}>{patient.insurancePlan}</dd>
            </div>
            <div>
              <dt className={styles.dt}>Excel catalog</dt>
              <dd className={styles.dd}>
                {patient.planInExcelCatalog ? 'Known plan type' : 'Not in catalog yet'}
              </dd>
            </div>
            <div>
              <dt className={styles.dt}>On-file status</dt>
              <dd className={styles.dd}>
                <InsuranceBadge status={patient.insuranceStatus} />
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card noHover>
        <h3 style={{ marginTop: 0 }}>Run verification (robot)</h3>
        <div className={styles.verifyPanel}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-small)' }}>
            {usingApi ? (
              <>
                Backend: <code>{import.meta.env.VITE_VERIFICATION_API_URL}</code> — Excel lookup,
                portal scrape, and catalog write via API.
              </>
            ) : (
              <>
                Stub <code>InsuranceVerificationService</code>: Excel lookup → Playwright portal →
                Excel write. Set <code>VITE_VERIFICATION_API_URL</code> when the Python service is
                ready.
              </>
            )}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => void runVerification()}
            disabled={isRunning}
            style={{ alignSelf: 'flex-start' }}
          >
            {isRunning ? 'Verifying…' : 'Verify insurance'}
          </Button>
          <div className={styles.statusRow}>
            <span className={styles.dt}>Session result:</span>
            <span
              className={`${styles.pill} ${
                verifyState === 'verified'
                  ? styles.pillOk
                  : verifyState === 'denied'
                    ? styles.pillBad
                    : styles.pillWait
              }`}
            >
              {statusLabel}
            </span>
          </div>
          {steps.length > 0 && (
            <ol className={styles.stepLog}>
              {steps.map((step, index) => (
                <li
                  key={`${step.step}-${index}`}
                  className={`${styles.stepItem} ${styles[`step_${step.status}`] ?? ''}`}
                >
                  <span className={styles.stepName}>{step.step.replace(/_/g, ' ')}</span>
                  <span className={styles.stepMessage}>{step.message}</span>
                </li>
              ))}
            </ol>
          )}
          {lastResult?.jobId && (
            <p className={styles.jobMeta}>
              Job <code>{lastResult.jobId}</code>
              {lastResult.catalogRowAdded ? ' · catalog row added' : ''}
            </p>
          )}
        </div>
      </Card>

      <Card noHover>
        <h3 style={{ marginTop: 0 }}>Confirmation & notes</h3>
        <TextAreaField
          id="notes"
          label="Add notes"
          placeholder="Eligibility details, call reference, copay notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button
          variant="secondary"
          onClick={() => {
            updateNotes(patient.id, notes)
            pushToast('Notes saved.', 'success')
          }}
        >
          Save notes
        </Button>
      </Card>
    </div>
  )
}
