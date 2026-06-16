import { useEffect } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../ui/AsyncFeedback'
import { Button } from '../ui/Button'
import { useSheetAudit } from '../../hooks/useSheetAudit'
import type { SheetRow } from '../../types/sheet-row'
import { formatLogTime } from '../../utils/formatLogTime'
import styles from './SheetRowHistoryPanel.module.css'

interface SheetRowHistoryPanelProps {
  row: SheetRow
  onClose: () => void
}

export function SheetRowHistoryPanel({ row, onClose }: SheetRowHistoryPanelProps) {
  const rowIndex = row.rowIndex
  const { events, loadState, error, reload } = useSheetAudit(
    { rowIndex: rowIndex ?? undefined },
    rowIndex != null,
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (rowIndex == null) {
    return null
  }

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-labelledby="history-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <h3 id="history-title" className={styles.title}>
              Edit history
            </h3>
            <p className={styles.subtitle}>
              Row {rowIndex} · {row.patientName} · columns E/J only
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        {loadState === 'loading' && <LoadingState message="Loading history…" compact />}
        {loadState === 'error' && error && (
          <ErrorState message={error} onRetry={() => void reload()} retryLabel="Retry" />
        )}
        {loadState === 'success' && events.length === 0 && (
          <EmptyState
            title="No edits recorded"
            description="Manual changes to status (E) or notes (J) will appear here once logged."
          />
        )}
        {loadState === 'success' && events.length > 0 && (
          <ul className={styles.list}>
            {events.map((event) => (
              <li key={event.id} className={styles.item}>
                <div className={styles.meta}>
                  <strong>{event.username}</strong>
                  <span>{formatLogTime(event.editedAt)}</span>
                  <span className={styles.fieldBadge}>{event.field}</span>
                </div>
                <div className={styles.diff}>
                  <div>
                    <span className={styles.diffLabel}>Before</span>
                    <pre>{event.previousValue || '—'}</pre>
                  </div>
                  <div>
                    <span className={styles.diffLabel}>After</span>
                    <pre>{event.newValue || '—'}</pre>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
