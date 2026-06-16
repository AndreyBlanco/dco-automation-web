import { Button } from '../ui/Button'
import type { SheetReportSummary } from '../../utils/sheetReports'
import styles from './SheetReportsPanel.module.css'

interface SheetReportsPanelProps {
  summary: SheetReportSummary
  loading: boolean
  onExportRows: () => void
  onExportSummary: () => void
  rowsAvailable: boolean
}

export function SheetReportsPanel({
  summary,
  loading,
  onExportRows,
  onExportSummary,
  rowsAvailable,
}: SheetReportsPanelProps) {
  return (
    <section className={styles.root} aria-labelledby="reports-heading">
      <div className={styles.header}>
        <div>
          <h3 id="reports-heading" className={styles.title}>
            Productivity summary
          </h3>
          <p className={styles.lead}>
            Metrics for the current filtered view — New vs DONE B by insurance type and carrier.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportSummary}
            disabled={loading || summary.total === 0}
          >
            Export summary CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportRows}
            disabled={loading || !rowsAvailable}
          >
            Export rows CSV
          </Button>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Completion</span>
          <span className={styles.metricValue}>
            {loading ? '—' : `${summary.completionPct}%`}
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>New</span>
          <span className={styles.metricValue}>{loading ? '—' : summary.newCount}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>DONE B</span>
          <span className={styles.metricValue}>{loading ? '—' : summary.doneBCount}</span>
        </div>
      </div>

      <div className={styles.tables}>
        <div>
          <h4 className={styles.tableTitle}>By insurance type</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Total</th>
                <th>New</th>
                <th>DONE B</th>
              </tr>
            </thead>
            <tbody>
              {summary.byKindOfInsurance.map((row) => (
                <tr key={row.kind}>
                  <td>{row.kind}</td>
                  <td>{loading ? '—' : row.total}</td>
                  <td>{loading ? '—' : row.newCount}</td>
                  <td>{loading ? '—' : row.doneBCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className={styles.tableTitle}>Top carriers</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Total</th>
                <th>New</th>
                <th>DONE B</th>
              </tr>
            </thead>
            <tbody>
              {summary.topCarriers.length === 0 && (
                <tr>
                  <td colSpan={4} className={styles.emptyCell}>
                    {loading ? 'Loading…' : 'No carrier data in view'}
                  </td>
                </tr>
              )}
              {summary.topCarriers.map((row) => (
                <tr key={row.carrier}>
                  <td>{row.carrier}</td>
                  <td>{row.total}</td>
                  <td>{row.newCount}</td>
                  <td>{row.doneBCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
