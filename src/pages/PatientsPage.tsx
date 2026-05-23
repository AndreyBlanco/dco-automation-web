import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/Field'
import { usePatients } from '../context/PatientsContext'
import { useToast } from '../context/ToastContext'
import type { Patient, PatientDraft, StatusFilter } from '../types/models'
import {
  draftFromPatient,
  emptyPatientDraft,
  patientFullName,
} from '../utils/patient'
import styles from './PatientsPage.module.css'

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'verified', label: 'Verified' },
  { id: 'denied', label: 'Denied' },
]

export function PatientsPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const {
    patients,
    stats,
    addPatient,
    updatePatient,
    deletePatient,
    togglePendingVerified,
  } = usePatients()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [draft, setDraft] = useState<PatientDraft>(emptyPatientDraft)
  const [showValidation, setShowValidation] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return patients.filter((p) => {
      if (statusFilter !== 'all' && p.insuranceStatus !== statusFilter) return false
      if (!q) return true
      const hay = `${patientFullName(p)} ${p.insuranceCarrier} ${p.insurancePlan} ${p.groupNumber} ${p.memberId}`.toLowerCase()
      return hay.includes(q)
    })
  }, [patients, query, statusFilter])

  function clearForm() {
    setDraft(emptyPatientDraft())
    setShowValidation(false)
    setIsEditing(false)
    setEditingId(null)
  }

  function handleField<K extends keyof PatientDraft>(key: K, value: PatientDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    setShowValidation(true)
    const result = isEditing && editingId
      ? updatePatient(editingId, draft)
      : addPatient(draft)

    if (!result.ok) {
      pushToast(result.error, 'error')
      return
    }

    pushToast(
      isEditing ? 'Insurance record updated.' : 'Insurance record added.',
      'success',
    )
    clearForm()
  }

  function startEdit(p: Patient) {
    setIsEditing(true)
    setEditingId(p.id)
    setDraft(draftFromPatient(p))
    setShowValidation(false)
  }

  function handleDelete(p: Patient) {
    if (editingId === p.id) clearForm()
    deletePatient(p.id)
    pushToast('Record removed.', 'info')
  }

  function statusToggleClass(p: Patient) {
    if (p.insuranceStatus === 'verified') return styles.statusToggleVerified
    if (p.insuranceStatus === 'denied') return styles.statusToggleDenied
    return styles.statusTogglePending
  }

  return (
    <div className={styles.page}>
      <header>
        <h2 className={styles.pageTitle}>Insurance verification</h2>
        <p className={styles.pageLead}>
          Register patient insurance records for the office workflow. The automation robot will
          check the Excel plan catalog, then insurer portals when needed (backend coming in a later
          phase).
        </p>
      </header>

      <div className={styles.metrics}>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Total records</span>
            <span className={styles.metricValue}>{stats.total}</span>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Verified</span>
            <span className={styles.metricValue} style={{ color: 'var(--color-status-verified)' }}>
              {stats.verified}
            </span>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Pending</span>
            <span className={styles.metricValue} style={{ color: 'var(--color-status-pending)' }}>
              {stats.pending}
            </span>
          </div>
        </Card>
      </div>

      <div className={styles.topGrid}>
        <Card noHover>
          <div className={styles.sectionHead}>
            <div>
              <h3>{isEditing ? 'Edit insurance record' : 'Add insurance record'}</h3>
              <p>
                {isEditing
                  ? 'Update patient and plan details before running the robot.'
                  : 'Enter patient and insurance data — same fields Laura used in the dental demo.'}
              </p>
            </div>
            <span className={styles.miniBadge}>DCO · CSE499</span>
          </div>

          <div className={styles.formGrid}>
            <TextField
              id="patient-first"
              label="First name"
              value={draft.firstName}
              onChange={(e) => handleField('firstName', e.target.value)}
              placeholder="Maria"
            />
            <TextField
              id="patient-last"
              label="Last name"
              value={draft.lastName}
              onChange={(e) => handleField('lastName', e.target.value)}
              placeholder="Lopez"
            />
            <TextField
              id="patient-dob"
              label="Date of birth"
              type="date"
              value={draft.dob}
              onChange={(e) => handleField('dob', e.target.value)}
            />
            <TextField
              id="patient-carrier"
              label="Insurance carrier"
              value={draft.insuranceCarrier}
              onChange={(e) => handleField('insuranceCarrier', e.target.value)}
              placeholder="Aetna"
            />
            <TextField
              id="patient-plan"
              label="Plan name"
              value={draft.insurancePlan}
              onChange={(e) => handleField('insurancePlan', e.target.value)}
              placeholder="PPO / HMO product"
            />
            <TextField
              id="patient-group"
              label="Group number"
              value={draft.groupNumber}
              onChange={(e) => handleField('groupNumber', e.target.value)}
              placeholder="AET-2049"
            />
            <div className={styles.formGridWide}>
              <TextField
                id="patient-member"
                label="Member ID (optional)"
                value={draft.memberId}
                onChange={(e) => handleField('memberId', e.target.value)}
                placeholder="Defaults to group number if empty"
              />
            </div>
          </div>

          {showValidation &&
            (!draft.firstName.trim() ||
              !draft.lastName.trim() ||
              !draft.insuranceCarrier.trim() ||
              !draft.groupNumber.trim()) && (
              <div className={styles.validationBox}>
                Complete first name, last name, insurance carrier, and group number.
              </div>
            )}

          <div className={styles.buttonRow}>
            {isEditing ? (
              <>
                <Button variant="primary" size="lg" onClick={handleSubmit}>
                  Save changes
                </Button>
                <Button variant="secondary" size="lg" onClick={clearForm}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="primary" size="lg" onClick={handleSubmit}>
                Add record
              </Button>
            )}
          </div>
        </Card>

        <Card noHover>
          <div className={styles.sectionHead}>
            <div>
              <h3>Automation flow</h3>
              <p>How DCO will verify coverage once the Python service is connected.</p>
            </div>
          </div>
          <div className={styles.workflowList}>
            <div className={styles.workflowItem}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h4>Staff enters patient</h4>
                <p>You capture name, carrier, group, and member ID in this screen.</p>
              </div>
            </div>
            <div className={styles.workflowItem}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h4>Excel catalog lookup</h4>
                <p>Robot checks whether this plan type already exists in the spreadsheet.</p>
              </div>
            </div>
            <div className={styles.workflowItem}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h4>Portal scrape if needed</h4>
                <p>If missing, Playwright opens the insurer site and writes results back to Excel.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card noHover>
        <div className={styles.sectionHead}>
          <div>
            <h3>Insurance records</h3>
            <p>Filter, toggle status, or open a patient to run verification.</p>
          </div>
        </div>

        <div className={styles.recordsToolbar}>
          <div className={styles.filterGroup}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterBtn} ${statusFilter === f.id ? styles.filterBtnActive : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className={styles.searchWrap}>
            <TextField
              id="patient-search"
              label="Search"
              placeholder="Name, carrier, group, member ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className={styles.tableWrap}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No records match this filter or search.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Patient</th>
                  <th className={styles.th}>Carrier / plan</th>
                  <th className={styles.th}>Group</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className={`${styles.row} ${p.insuranceStatus === 'verified' ? styles.rowVerified : ''}`}
                  >
                    <td className={styles.td}>
                      <button
                        type="button"
                        className={`${styles.statusToggle} ${statusToggleClass(p)}`}
                        onClick={() =>
                          p.insuranceStatus !== 'denied' && togglePendingVerified(p.id)
                        }
                        disabled={p.insuranceStatus === 'denied'}
                        title={
                          p.insuranceStatus === 'denied'
                            ? 'Denied — change via robot or detail page'
                            : 'Toggle pending / verified'
                        }
                      >
                        {p.insuranceStatus === 'verified'
                          ? 'Verified'
                          : p.insuranceStatus === 'denied'
                            ? 'Denied'
                            : 'Pending'}
                      </button>
                    </td>
                    <td className={styles.td}>
                      <strong>{patientFullName(p)}</strong>
                      <div className={styles.muted}>DOB {p.dob}</div>
                    </td>
                    <td className={styles.td}>
                      <strong>{p.insuranceCarrier}</strong>
                      <div className={styles.muted}>{p.insurancePlan}</div>
                    </td>
                    <td className={styles.td}>{p.groupNumber}</td>
                    <td className={styles.td}>
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => navigate(`/patients/${p.id}`)}
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${styles.linkBtn} ${styles.dangerBtn}`}
                          onClick={() => handleDelete(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
