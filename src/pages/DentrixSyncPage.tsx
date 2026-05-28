import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { TextField } from '../components/ui/Field'
import { dentrixSyncDataSourceLabel } from '../services/dentrix-sync/createDentrixSyncService'
import { useDentrixSync } from '../hooks/useDentrixSync'
import type { DentrixSyncRunStatus } from '../types/dentrix-sync-api'
import styles from './DentrixSyncPage.module.css'

const INSTRUCTIONS = [
  'Start sync here — the API runs the integrated Dentrix robot on the machine where uvicorn is running.',
  'A Chromium window opens on that PC. Log in to Dentrix Ascend if needed.',
  'Position the calendar on the first clinic day, then press “Dentrix is ready” in this app.',
  'The robot writes to your Google Sheet (columns A/C/D/E/F/I/J only — never G/H). Medicaid is skipped.',
  'When status is Completed, go to IVF Verification (sidebar or tab bar) and refresh to see test_excel updates.',
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
  if (status === 'awaiting_login') return 'Awaiting login'
  return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
}

export function DentrixSyncPage() {
  const [startDate, setStartDate] = useState('2026-06-01')
  const [days, setDays] = useState('1')
  const { phase, run, error, start, resume, reset, isBusy } = useDentrixSync()

  const dataSource = dentrixSyncDataSourceLabel()
  const displayStatus: DentrixSyncRunStatus | 'idle' = run?.status ?? 'idle'

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
          <> — simulated run timeline until <code>POST /api/robot/run</code> is available.</>
        )}
      </div>

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
              disabled={isBusy}
            />
            <TextField
              id="sync-days"
              label="Days"
              type="number"
              min={1}
              max={31}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              disabled={isBusy}
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
              disabled={isBusy || daysInvalid || !startDate}
            >
              {phase === 'starting' ? 'Starting…' : phase === 'polling' ? 'Running…' : 'Start sync'}
            </Button>
            {(phase === 'done' || phase === 'error') && (
              <Button variant="secondary" onClick={reset}>
                New run
              </Button>
            )}
          </div>
          {run?.status === 'awaiting_login' && (
            <Button variant="primary" size="lg" onClick={() => void resume()}>
              Dentrix is ready — continue
            </Button>
          )}
          {error && <p className={styles.errorText}>{error}</p>}
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

          {run?.logs && run.logs.length > 0 && (
            <>
              <h4 style={{ margin: '8px 0 0', fontSize: 'var(--font-size-body)' }}>Activity log</h4>
              <ul className={styles.logList} aria-live="polite">
                {run.logs.map((entry, i) => (
                  <li
                    key={`${entry.at}-${i}`}
                    className={`${styles.logItem} ${
                      entry.level === 'warn'
                        ? styles.logWarn
                        : entry.level === 'error'
                          ? styles.logError
                          : ''
                    }`}
                  >
                    <span className={styles.logTime}>{entry.at}</span>
                    {entry.message}
                  </li>
                ))}
              </ul>
            </>
          )}

          {phase === 'idle' && !run && (
            <p className={styles.hint}>No active run. Configure dates and press Start sync.</p>
          )}
        </div>
      </Card>
    </div>
  )
}
