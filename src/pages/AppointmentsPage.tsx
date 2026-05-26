import { type FormEvent, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextAreaField, TextField } from '../components/ui/Field'
import { mockAppointments } from '../data/mockAppointments'
import { usePatients } from '../context/PatientsContext'
import { useToast } from '../context/ToastContext'
import { patientFullName } from '../utils/patient'
import type { Appointment } from '../types/models'
import styles from './AppointmentsPage.module.css'

let idCounter = 100

export function AppointmentsPage() {
  const { pushToast } = useToast()
  const { patients } = usePatients()
  const [rows, setRows] = useState<Appointment[]>(() => [...mockAppointments])

  const [date, setDate] = useState('2026-05-20')
  const [time, setTime] = useState('10:00')
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '')
  const [procedure, setProcedure] = useState('Prophylaxis (D1110)')
  const [notes, setNotes] = useState('')

  const patientNameById = useMemo(() => {
    const m = new Map<string, string>()
    patients.forEach((p) => m.set(p.id, patientFullName(p)))
    return m
  }, [patients])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const patientName = patientNameById.get(patientId) ?? 'Unknown patient'
    const id = `local-${idCounter++}`
    setRows((prev) => [
      {
        id,
        patientId,
        patientName,
        date,
        time,
        procedure,
        notes: notes.trim() || undefined,
      },
      ...prev,
    ])
    pushToast('Appointment saved to in-memory demo list.', 'success')
    setNotes('')
  }

  function handleCancel() {
    setDate('2026-05-20')
    setTime('10:00')
    setPatientId(patients[0]?.id ?? '')
    setProcedure('Prophylaxis (D1110)')
    setNotes('')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Appointments</h2>

      <Card noHover>
        <h3 style={{ marginTop: 0 }}>New appointment</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <TextField id="appt-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <TextField id="appt-time" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="visually-hidden" htmlFor="appt-patient">
                Patient
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Patient
                </span>
                <select
                  id="appt-patient"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontFamily: 'inherit',
                  }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {patientFullName(p)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <TextField
                id="appt-procedure"
                label="Procedure type"
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <TextAreaField id="appt-notes" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>
        </form>
      </Card>

      <h3 style={{ margin: 'var(--spacing-lg) 0 var(--spacing-md)' }}>Schedule (demo data)</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Patient</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Time</th>
              <th className={styles.th}>Procedure</th>
              <th className={styles.th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className={styles.td}>{a.patientName}</td>
                <td className={styles.td}>{a.date}</td>
                <td className={styles.td}>{a.time}</td>
                <td className={styles.td}>{a.procedure}</td>
                <td className={styles.td}>{a.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
