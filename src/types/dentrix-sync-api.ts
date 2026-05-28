/**
 * Proposed API contract — Dentrix → Sheet robot (Laura / backend).
 * UI triggers runs and polls status; Playwright stays server-side.
 *
 * @see docs/ARCHITECTURE_IVF_WORKFLOW.md
 */

export type DentrixSyncRunStatus =
  | 'pending'
  | 'awaiting_login'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface DentrixSyncRunRequest {
  /** First clinic day to process (YYYY-MM-DD). */
  startDate: string
  /** Consecutive days (matches robot CLI). */
  days: number
  /** Optional cap for test mode. */
  patientLimit?: number
}

export interface DentrixSyncRunSummary {
  runId: string
  status: DentrixSyncRunStatus
  startDate: string
  days: number
  startedAt?: string
  completedAt?: string
  processed?: number
  skippedMedicaid?: number
  errors?: number
  message?: string
}

/** Short log line for Sync UI (no PHI in messages if possible). */
export interface DentrixSyncLogEntry {
  at: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface DentrixSyncRunDetail extends DentrixSyncRunSummary {
  logs?: DentrixSyncLogEntry[]
}

export interface DentrixSyncService {
  startRun(request: DentrixSyncRunRequest): Promise<DentrixSyncRunSummary>
  getRun(runId: string): Promise<DentrixSyncRunDetail>
  /** After Dentrix login + calendar are ready (human-in-the-loop). */
  resumeRun(runId: string): Promise<DentrixSyncRunDetail>
}
