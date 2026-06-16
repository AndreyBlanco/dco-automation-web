import { useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncFeedback'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/Field'
import { dentrixSyncDataSourceLabel } from '../services/dentrix-sync/createDentrixSyncService'
import { useDentrixSync } from '../hooks/useDentrixSync'
import type { DentrixSyncRunStatus } from '../types/dentrix-sync-api'
import { defaultSyncStartDate } from '../utils/dateDefaults'
import { formatLogTime } from '../utils/formatLogTime'
import { markSyncCompleted } from '../utils/syncCompletionNotice'
import styles from './DentrixSyncPage.module.css'

const INSTRUCTIONS = [
  'Start sync here — the API runs the integrated Dentrix robot on the machine where uvicorn is running.',
  'A Chromium window opens on that PC. Log in to Dentrix Ascend if needed.',
  'Position the calendar on the first clinic day, then press “Dentrix is ready” below.',
  'The robot writes to your Google Sheet (columns A/C/D/E/F/I/J only — never G/H). Medicaid is skipped.',
  'When status is Completed, open IVF Verification — a refresh banner appears with the latest sheet rows.',
]

function statusPillClass(status: DentrixSyncRunStatus | 'idle'): string {
  switch (status) {
    case 'idle':
      return styles.pillIdle
    case 'awaiting_login':
    case 'pending':
      return styles.pillWait
    case 'running':
      return styles.pillRun
    case 'completed':
      return styles.pillOk
    case 'failed':
    case 'cancelled':
      return styles.pillBad
    default:
      return styles.pillIdle
  }
}

function statusLabel(status: DentrixSyncRunStatus | 'idle'): string {
  if (status === 'idle') return 'Not started'
  if (status === 'awaiting_login') return 'Awaiting operator'
  if (status === 'pending') return 'Starting'
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

export function DentrixSyncPage() {
  const [startDate, setStartDate] = useState(defaultSyncStartDate)
  const [days, setDays] = useState('1')
  const { phase, run, error, start, resume, reset, isBusy, refresh } = useDentrixSync()

  const dataSource = dentrixSyncDataSourceLabel()
  const displayStatus: DentrixSyncRunStatus | 'idle' = run?.status ?? 'idle'
  const awaitingOperator = run?.status === 'awaiting_login'
  const formLocked = isBusy && !awaitingOperator

  const logEntries = useMemo(() => {
    if (!run?.logs?.length) return []
    return [...run.logs].reverse()
  }, [run?.logs])

  const lastNotifiedRunId = useRef<string | null>(null)

  useEffect(() => {
    if (run?.status === 'completed' && run.runId && lastNotifiedRunId.current !== run.runId) {
      lastNotifiedRunId.current = run.runId
      markSyncCompleted()
    }
  }, [run?.runId, run?.status])

  function handleStart() {
    const n = Number.parseInt(days, 10)
    if (!startDate || Number.isNaN(n) || n < 1 || n > 31) {
      return
    }
    void start({ startDate, days: n })
  }

  const daysInvalid =
    days.trim() === '' || Number.isNaN(Number.parseInt(days, 10)) || Number.parseInt(days, 10) < 1

  return (
    <div className={styles.page}>
      <header>
        <h2 className={styles.pageTitle}>Dentrix sync</h2>
        <p className={styles.pageLead}>
          Human-in-the-loop: Dentrix Ascend → Google Sheet (<code>test_excel</code>). Playwright
          runs on the <strong>same PC as the API</strong> (not in your browser tab).
        </p>
      </header>

      <div
        className={`${styles.banner} ${dataSource === 'mock' ? styles.bannerWarn : ''}`}
        role="status"
      >
        Data source: <strong>{dataSource}</strong>
        {dataSource === 'mock' && (
          <> — simulated run timeline until <code>VITE_DENTRIX_SYNC_USE_API=true</code> is set.</>
        )}
      </div>

      {awaitingOperator && (
        <div className={styles.awaitingCallout} role="status">
          <p className={styles.awaitingTitle}>Action required</p>
          <p className={styles.awaitingText}>
            Log in to Dentrix on the API machine, open the schedule on <strong>{startDate}</strong>,
            then confirm below to start processing patients.
          </p>
          <Button variant="primary" size="lg" onClick={() => void resume()} disabled={phase === 'starting'}>
            Dentrix is ready — continue
          </Button>
        </div>
      )}

      <div className={styles.grid}>
        <Card noHover>
          <h3 style={{ marginTop: 0 }}>Run settings</h3>
          <div className={styles.formRow}>
            <TextField
              id="sync-start-date"
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={formLocked}
            />
            <TextField
              id="sync-days"
              label="Days"
              type="number"
              min={1}
              max={31}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              disabled={formLocked}
            />
          </div>
          <p className={styles.hint}>
            Matches the robot CLI: first clinic day plus consecutive days to process.
          </p>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              disabled={formLocked || daysInvalid || !startDate}
            >
              {phase === 'starting' ? 'Starting…' : phase === 'polling' ? 'Running…' : 'Start sync'}
            </Button>
            {(phase === 'done' || phase === 'error') && (
              <Button variant="secondary" onClick={reset}>
                New run
              </Button>
            )}
          </div>
          {error && phase === 'error' && !run && (
            <div className={styles.inlineError}>
              <ErrorState
                message={error}
                onRetry={handleStart}
                retryLabel="Try again"
              />
            </div>
          )}
        </Card>

        <Card noHover>
          <h3 style={{ marginTop: 0 }}>Operator steps</h3>
          <ol className={styles.instructions}>
            {INSTRUCTIONS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Card>
      </div>

      <Card noHover>
        <div className={styles.statusPanel}>
          <h3 style={{ margin: 0 }}>Run status</h3>

          {phase === 'starting' && (
            <LoadingState message="Starting robot on the API machine…" compact />
          )}

          {phase !== 'starting' && (
            <>
              <div className={styles.statusRow}>
                <span className={`${styles.pill} ${statusPillClass(displayStatus)}`}>
                  {statusLabel(displayStatus)}
                </span>
                {run?.runId && (
                  <span className={styles.hint} style={{ margin: 0 }}>
                    Run ID: <code>{run.runId}</code>
                  </span>
                )}
              </div>
              {run?.message && (
                <p className={styles.hint} style={{ margin: 0 }}>
                  {run.message}
                </p>
              )}

              {error && phase === 'error' && run && (
                <ErrorState
                  message={error}
                  onRetry={() => void refresh()}
                  retryLabel="Refresh status"
                />
              )}

              {run && (run.processed !== undefined || run.skippedMedicaid !== undefined) && (
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>{run.processed ?? '—'}</div>
                    <div className={styles.statLabel}>Processed</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>{run.skippedMedicaid ?? '—'}</div>
                    <div className={styles.statLabel}>Skipped Medicaid</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statValue}>{run.errors ?? 0}</div>
                    <div className={styles.statLabel}>Errors</div>
                  </div>
                </div>
              )}

              {logEntries.length > 0 && (
                <>
                  <h4 className={styles.logHeading}>Activity log</h4>
                  <ul className={styles.logList} aria-live="polite">
                    {logEntries.map((entry, i) => (
                      <li
                        key={`${entry.at}-${entry.message}-${i}`}
                        className={`${styles.logItem} ${
                          entry.level === 'warn'
                            ? styles.logWarn
                            : entry.level === 'error'
                              ? styles.logError
                              : entry.level === 'info'
                                ? styles.logInfo
                                : ''
                        }`}
                      >
                        <span className={styles.logMeta}>
                          <span className={styles.logLevel}>{entry.level}</span>
                          <span className={styles.logTime}>{formatLogTime(entry.at)}</span>
                        </span>
                        <span className={styles.logMessage}>{entry.message}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {phase === 'idle' && !run && (
                <EmptyState
                  title="No active run"
                  description="Set the start date and number of days, then press Start sync."
                />
              )}

              {phase === 'polling' && run && logEntries.length === 0 && (
                <LoadingState message="Waiting for robot activity…" compact />
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
