import { AlertTriangle, BarChart3, Calendar, MoreHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { mockAppointments } from '../data/mockAppointments'
import { weeklyAppointmentCounts } from '../data/weeklyChart'
import { usePatients } from '../context/PatientsContext'
import { useToast } from '../context/ToastContext'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { pushToast } = useToast()
  const { patients, stats } = usePatients()
  const [exportChoice, setExportChoice] = useState('')

  const pendingVerifications = stats.pending
  const upcomingAppointments = 15
  const reportsThisWeek = 3

  const recent = useMemo(() => mockAppointments.slice(0, 5), [])

  function handleExportChange(value: string) {
    setExportChoice(value)
    if (!value) return
    pushToast(`Export "${value}" queued (demo — connect backend to download files).`, 'info')
    window.setTimeout(() => setExportChoice(''), 800)
  }

  return (
    <div className={styles.grid}>
      <div>
        <h2 className={styles.pageTitle}>Dashboard</h2>

        <div className={styles.metrics}>
          <Card>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Pending insurance verifications</span>
              <div className={styles.metricValue}>
                {pendingVerifications}
                <AlertTriangle color="var(--color-status-pending)" size={26} aria-hidden />
              </div>
            </div>
          </Card>
          <Card>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Upcoming appointments</span>
              <div className={styles.metricValue}>
                {upcomingAppointments}
                <Calendar color="var(--color-primary)" size={26} aria-hidden />
              </div>
            </div>
          </Card>
          <Card>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Reports generated this week</span>
              <div className={styles.metricValue}>
                {reportsThisWeek}
                <BarChart3 color="var(--color-primary)" size={26} aria-hidden />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.mid}>
        <Card noHover>
          <h3 style={{ marginBottom: 12 }}>Weekly appointments overview</h3>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyAppointmentCounts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e6e6" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} domain={[0, 50]} />
                <Tooltip />
                <Bar dataKey="count" fill="#9ec5ea" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className={styles.promo}>
          <h3 style={{ margin: 0, color: '#fff' }}>Did you know?</h3>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            You can bill up to <strong>$350</strong> on a routine recare visit for a dental patient
            when plan benefits align — always confirm eligibility first.
          </p>
        </div>
      </div>

      <Card noHover>
        <div className={styles.sectionHead}>
          <h3 style={{ margin: 0 }}>Recent appointments</h3>
          <label className="visually-hidden" htmlFor="export-recent">
            Export recent appointments
          </label>
          <select
            id="export-recent"
            className={styles.exportSelect}
            value={exportChoice}
            onChange={(e) => handleExportChange(e.target.value)}
          >
            <option value="">Export…</option>
            <option value="CSV">CSV</option>
            <option value="Excel">Excel</option>
            <option value="PDF">PDF</option>
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Insurance</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {recent.map((a) => {
                const patient = patients.find((p) => p.id === a.patientId)
                const ok = patient?.insuranceStatus === 'verified'
                const initials = a.patientName
                  .split(' ')
                  .map((s) => s[0])
                  .join('')
                  .slice(0, 2)
                return (
                  <tr key={a.id} className={styles.row}>
                    <td className={styles.td}>
                      <div className={styles.patientCell}>
                        <span className={styles.avatar}>{initials}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.patientName}</div>
                          <div className={styles.muted}>
                            {a.date} · {a.time}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>{ok ? '✓' : patient?.insuranceStatus === 'pending' ? '…' : '✕'}</td>
                    <td className={styles.td}>{a.procedure}</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <button type="button" className={styles.iconBtn} aria-label="Row actions">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
