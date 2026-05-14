import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextAreaField } from '../components/ui/Field'
import { InsuranceBadge } from '../components/ui/InsuranceBadge'
import { mockPatients } from '../data/mockPatients'
import { useToast } from '../context/ToastContext'
import type { VerificationUiState } from '../types/models'
import styles from './PatientDetailPage.module.css'

export function PatientDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()

  const patient = useMemo(() => mockPatients.find((p) => p.id === id), [id])

  const [verifyState, setVerifyState] = useState<VerificationUiState>('idle')
  const timerRef = useRef<number | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  if (!patient) {
    return (
      <div>
        <p>Patient not found.</p>
        <Link to="/patients">Back to patients</Link>
      </div>
    )
  }

  function runVerification() {
    if (verifyState === 'verifying') return
    setVerifyState('verifying')
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      const ok = Math.random() < 0.78
      setVerifyState(ok ? 'verified' : 'denied')
      pushToast(
        ok ? 'Verification completed (demo).' : 'Verification returned denied (demo).',
        ok ? 'success' : 'error',
      )
    }, 1800)
  }

  const statusLabel =
    verifyState === 'idle'
      ? 'Not run in this session'
      : verifyState === 'verifying'
        ? 'Verifying…'
        : verifyState === 'verified'
          ? 'Verified'
          : 'Denied'

  return (
    <div className={styles.layout}>
      <div className={styles.topRow}>
        <div>
          <button type="button" className={styles.back} onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2 style={{ margin: '8px 0 0' }}>
            {patient.firstName} {patient.lastName}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-small)' }}>
            Member ID {patient.memberId}
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
              <dt className={styles.dt}>Plan</dt>
              <dd className={styles.dd}>{patient.insurancePlan}</dd>
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
        <h3 style={{ marginTop: 0 }}>Verify insurance</h3>
        <div className={styles.verifyPanel}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-small)' }}>
            Demo action: simulates a portal check. Wire <code>InsuranceVerificationService</code> to Python +
            Playwright when available.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={runVerification}
            disabled={verifyState === 'verifying'}
            style={{ alignSelf: 'flex-start' }}
          >
            {verifyState === 'verifying' ? 'Verifying…' : 'Verify insurance'}
          </Button>
          <div className={styles.statusRow}>
            <span className={styles.dt}>Session result:</span>
            <span
              className={`${styles.pill} ${
                verifyState === 'verified'
                  ? styles.pillOk
                  : verifyState === 'denied'
                    ? styles.pillBad
                    : verifyState === 'verifying'
                      ? styles.pillWait
                      : styles.pillWait
              }`}
            >
              {statusLabel}
            </span>
          </div>
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
          onClick={() => pushToast('Notes saved locally (demo).', 'success')}
        >
          Save notes
        </Button>
      </Card>
    </div>
  )
}
