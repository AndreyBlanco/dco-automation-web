import type {
  DentrixSyncLogEntry,
  DentrixSyncRunDetail,
  DentrixSyncRunRequest,
  DentrixSyncRunSummary,
  DentrixSyncService,
} from '../../types/dentrix-sync-api'

interface MockRunState {
  summary: DentrixSyncRunSummary
  logs: DentrixSyncLogEntry[]
  startedAtMs: number
}

const runs = new Map<string, MockRunState>()

let runCounter = 0

export class MockDentrixSyncService implements DentrixSyncService {
  async startRun(request: DentrixSyncRunRequest): Promise<DentrixSyncRunSummary> {
    await delay(400)
    const runId = `mock-run-${++runCounter}`
    const now = new Date().toISOString()
    const summary: DentrixSyncRunSummary = {
      runId,
      status: 'awaiting_login',
      startDate: request.startDate,
      days: request.days,
      startedAt: now,
      message: 'Waiting for operator to complete Dentrix login (simulated).',
    }
    runs.set(runId, {
      summary,
      logs: [
        log(now, 'info', 'Run created. Open Dentrix Ascend in the server browser window.'),
        log(now, 'info', `Date range: ${request.startDate} for ${request.days} day(s).`),
      ],
      startedAtMs: Date.now(),
    })
    return { ...summary }
  }

  async resumeRun(runId: string): Promise<DentrixSyncRunDetail> {
    await delay(200)
    const state = runs.get(runId)
    if (!state) {
      throw new Error(`Unknown run: ${runId}`)
    }
    state.summary = { ...state.summary, status: 'running', message: 'Processing (mock)…' }
    state.startedAtMs = Date.now()
    return this.getRun(runId)
  }

  async getRun(runId: string): Promise<DentrixSyncRunDetail> {
    await delay(200)
    const state = runs.get(runId)
    if (!state) {
      throw new Error(`Unknown run: ${runId}`)
    }

    const elapsed = Date.now() - state.startedAtMs
    const { summary, logs } = state

    if (elapsed < 2500) {
      return { ...summary, status: 'awaiting_login', logs: [...logs] }
    }

    if (elapsed < 8000) {
      const processed = Math.min(6, Math.floor((elapsed - 2500) / 900) + 1)
      const updated: DentrixSyncRunSummary = {
        ...summary,
        status: 'running',
        processed,
        skippedMedicaid: 1,
        errors: 0,
        message: 'Processing visible schedule…',
      }
      state.summary = updated
      if (logs.length < 4) {
        logs.push(log(new Date().toISOString(), 'info', `Processed ${processed} patient(s) so far.`))
      }
      return { ...updated, logs: [...logs] }
    }

    const done: DentrixSyncRunSummary = {
      ...summary,
      status: 'completed',
      processed: 8,
      skippedMedicaid: 2,
      errors: 0,
      completedAt: new Date().toISOString(),
      message: 'Sync finished. Rows written to operational Sheet (mock).',
    }
    state.summary = done
    if (!logs.some((l) => l.message.includes('finished'))) {
      logs.push(log(done.completedAt!, 'info', 'Run completed successfully.'))
      logs.push(log(done.completedAt!, 'info', 'Refresh IVF dashboard to review New / DONE B rows.'))
    }
    return { ...done, logs: [...logs] }
  }
}

function log(at: string, level: DentrixSyncLogEntry['level'], message: string): DentrixSyncLogEntry {
  return { at, level, message }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
