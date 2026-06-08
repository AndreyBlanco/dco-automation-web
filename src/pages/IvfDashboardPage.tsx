import { useCallback, useMemo, useState } from 'react'
import { SheetRowEditActions } from '../components/sheet/SheetRowEditActions'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncFeedback'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/Field'
import { IvfStatusBadge } from '../components/ui/IvfStatusBadge'
import { useToast } from '../context/ToastContext'
import { sheetRowsDataSourceLabel } from '../services/sheet/createSheetRowsService'
import { useSheetRows } from '../hooks/useSheetRows'
import { defaultSheetDateFrom, defaultSheetDateTo } from '../utils/dateDefaults'
import type { IvfStatusFilter, KindOfInsuranceFilter } from '../types/sheet-row'
import type { SheetRowsQuery } from '../types/sheet-api'
import styles from './IvfDashboardPage.module.css'

const IVF_FILTERS: { id: IvfStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'New', label: 'New' },
  { id: 'DONE B', label: 'DONE B' },
]

const KIND_FILTERS: { id: KindOfInsuranceFilter; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'PPO', label: 'PPO' },
  { id: 'Medicaid', label: 'Medicaid' },
  { id: 'No info', label: 'No info' },
]

export function IvfDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<IvfStatusFilter>('all')
  const [kindFilter, setKindFilter] = useState<KindOfInsuranceFilter>('all')
  const [dateFrom, setDateFrom] = useState(defaultSheetDateFrom)
  const [dateTo, setDateTo] = useState(defaultSheetDateTo)
  const [query, setQuery] = useState('')

  const apiQuery: SheetRowsQuery = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      ivfStatus: statusFilter === 'all' ? undefined : statusFilter,
      kindOfInsurance: kindFilter === 'all' ? undefined : kindFilter,
      q: query.trim() || undefined,
    }),
    [dateFrom, dateTo, statusFilter, kindFilter, query],
  )

  const { rows, stats, loadState, error, reload, patchRow } = useSheetRows(apiQuery)
  const { pushToast } = useToast()
  const canEditRows = sheetRowsDataSourceLabel() === 'API'

  const handleSaveRow = useCallback(
    async (patch: { rowIndex: number; ivfStatus: 'New' | 'DONE B'; notes: string }) => {
      try {
        await patchRow({
          rowIndex: patch.rowIndex,
          ivfStatus: patch.ivfStatus,
          notes: patch.notes,
        })
        pushToast('Row saved to Google Sheet (columns E and J).', 'success')
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not save row.'
        pushToast(msg, 'error')
        throw e
      }
    },
    [patchRow, pushToast],
  )

  const metricsLoading = loadState === 'loading' || loadState === 'idle'

  return (
    <div className={styles.page}>
      <header>
        <h2 className={styles.pageTitle}>IVF verification — operations</h2>
        <p className={styles.pageLead}>
          Operational dashboard for the Google Sheet workflow: Dentrix Document Manager
          check (IVF 2026) → status <strong>New</strong> or <strong>DONE B</strong>.
          You can edit <strong>status</strong> (column E) and <strong>notes</strong> (column J) per row.
          Columns G/H are never written by the app.
        </p>
      </header>

      <div className={styles.metrics}>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Rows in view</span>
            <span className={styles.metricValue}>
              {metricsLoading ? '—' : stats.total}
            </span>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>New</span>
            <span className={styles.metricValue}>
              {metricsLoading ? '—' : stats.newCount}
            </span>
          </div>
        </Card>
        <Card>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>DONE B</span>
            <span className={styles.metricValue}>
              {metricsLoading ? '—' : stats.doneBCount}
            </span>
          </div>
        </Card>
      </div>

      <Card noHover>
        <div className={styles.toolbar}>
          <div className={styles.filterGroup}>
            {IVF_FILTERS.map((f) => (
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
          <div className={styles.filterGroup}>
            {KIND_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`${styles.filterBtn} ${kindFilter === f.id ? styles.filterBtnActive : ''}`}
                onClick={() => setKindFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`${styles.toolbar} ${styles.dateFields}`}>
          <div className={styles.dateField}>
            <label htmlFor="date-from">From</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className={styles.dateField}>
            <label htmlFor="date-to">To</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className={styles.searchWrap}>
            <TextField
              id="sheet-search"
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Patient or insurance…"
            />
          </div>
          <Button variant="secondary" onClick={() => void reload()} disabled={loadState === 'loading'}>
            Refresh
          </Button>
        </div>

        {loadState === 'loading' && (
          <LoadingState message="Loading sheet rows…" />
        )}

        {loadState === 'error' && error && (
          <ErrorState message={error} onRetry={() => void reload()} />
        )}

        {loadState === 'success' && rows.length === 0 && (
          <EmptyState
            title="No rows in this date range"
            description={
              canEditRows
                ? 'Widen the From/To dates or clear filters. Patient rows must fall within the selected range.'
                : 'Enable VITE_SHEET_USE_API=true and connect the API to load live Sheet data, or widen the date range for mock rows.'
            }
            action={
              <Button variant="secondary" onClick={() => void reload()}>
                Refresh
              </Button>
            }
          />
        )}

        {loadState === 'success' && rows.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Patient</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Age</th>
                  <th className={styles.th}>Insurance</th>
                  <th className={styles.th}>Notes</th>
                  <th className={styles.th}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${styles.row} ${row.ivfStatus === 'DONE B' ? styles.rowDone : ''}`}
                  >
                    <td className={styles.td}>{row.date}</td>
                    <td className={styles.td}>
                      <strong>{row.patientName}</strong>
                      {row.appointmentTime && (
                        <div className={styles.notesCell}>{row.appointmentTime}</div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.kindTag}>{row.kindOfInsurance}</span>
                    </td>
                    <td className={styles.td}>
                      <IvfStatusBadge status={row.ivfStatus} />
                    </td>
                    <td className={styles.td}>{row.ageType || '—'}</td>
                    <td className={styles.td}>{row.insurance || '—'}</td>
                    <td className={styles.td}>
                      <div className={styles.notesCell} title={row.notes}>
                        {row.notes || '—'}
                      </div>
                    </td>
                    <td className={`${styles.td} ${styles.tdEdit}`}>
                      <SheetRowEditActions
                        row={row}
                        canEdit={canEditRows}
                        onSave={handleSaveRow}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
