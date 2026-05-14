import { useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/Field'
import { mockReports } from '../data/mockReports'
import { useToast } from '../context/ToastContext'
import styles from './ReportsPage.module.css'

export function ReportsPage() {
  const { pushToast } = useToast()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | 'weekly' | 'custom'>('all')

  const rows = useMemo(() => {
    return mockReports.filter((r) => {
      if (type !== 'all' && r.type !== type) return false
      const q = query.trim().toLowerCase()
      if (!q) return true
      return r.title.toLowerCase().includes(q)
    })
  }, [query, type])

  return (
    <div>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Reports</h2>

      <Card noHover>
        <div className={styles.toolbar}>
          <div style={{ flex: '1 1 220px', maxWidth: 360 }}>
            <TextField
              id="report-search"
              label="Search"
              placeholder="Title contains…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div>
            <label className="visually-hidden" htmlFor="report-type">
              Report type
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                }}
              >
                Type
              </span>
              <select
                id="report-type"
                value={type}
                onChange={(e) => setType(e.target.value as typeof type)}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontFamily: 'inherit',
                  minWidth: 180,
                }}
              >
                <option value="all">All</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }} className={styles.exportRow}>
          <Button variant="primary" onClick={() => pushToast('Excel export queued (demo).', 'info')}>
            Export to Excel
          </Button>
          <Button variant="secondary" onClick={() => pushToast('PDF export queued (demo).', 'info')}>
            Export to PDF
          </Button>
        </div>

        <div className={styles.list}>
          {rows.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No reports match your filters.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className={styles.row}>
                <div>
                  <div className={styles.rowTitle}>{r.title}</div>
                  <div className={styles.rowMeta}>
                    {new Date(r.generatedAt).toLocaleString()} · {r.type}
                  </div>
                </div>
                <div className={styles.exportRow}>
                  <Button variant="ghost" size="sm" onClick={() => pushToast('Opened report (demo).', 'info')}>
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
