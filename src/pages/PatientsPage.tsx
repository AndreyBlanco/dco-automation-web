import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField } from '../components/ui/Field'
import { InsuranceBadge } from '../components/ui/InsuranceBadge'
import { mockPatients } from '../data/mockPatients'
import styles from './PatientsPage.module.css'

export function PatientsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return mockPatients
    return mockPatients.filter((p) => {
      const hay = `${p.firstName} ${p.lastName} ${p.memberId} ${p.insurancePlan}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query])

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Patients</h2>
      <div className={styles.toolbar}>
        <div style={{ flex: '1 1 240px', maxWidth: 400 }}>
          <TextField
            id="patient-search"
            label="Search"
            placeholder="Name, member ID, or plan"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        {rows.length === 0 ? (
          <div className={styles.empty}>No patients match this search.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>DOB</th>
                <th className={styles.th}>Insurance plan</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={styles.row}>
                  <td className={styles.td}>
                    <strong>
                      {p.firstName} {p.lastName}
                    </strong>
                  </td>
                  <td className={styles.td}>{p.dob}</td>
                  <td className={styles.td}>{p.insurancePlan}</td>
                  <td className={styles.td}>
                    <InsuranceBadge status={p.insuranceStatus} />
                  </td>
                  <td className={styles.td}>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => navigate(`/patients/${p.id}`)}
                    >
                      Open details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}