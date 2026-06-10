import type {
  DentrixSyncRunDetail,
  DentrixSyncRunRequest,
  DentrixSyncRunSummary,
  DentrixSyncService,
} from '../../types/dentrix-sync-api'
import { authFetch, readApiErrorMessage } from '../auth/authFetch'

export class HttpDentrixSyncService implements DentrixSyncService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  async startRun(request: DentrixSyncRunRequest): Promise<DentrixSyncRunSummary> {
    const res = await authFetch(this.url('/api/robot/run'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to start Dentrix sync'))
    }

    return res.json() as Promise<DentrixSyncRunSummary>
  }

  async getRun(runId: string): Promise<DentrixSyncRunDetail> {
    const res = await authFetch(this.url(`/api/robot/runs/${encodeURIComponent(runId)}`))

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to load run status'))
    }

    return res.json() as Promise<DentrixSyncRunDetail>
  }

  async resumeRun(runId: string): Promise<DentrixSyncRunDetail> {
    const res = await authFetch(this.url(`/api/robot/runs/${encodeURIComponent(runId)}/resume`), {
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(await readApiErrorMessage(res, 'Failed to resume run'))
    }

    return res.json() as Promise<DentrixSyncRunDetail>
  }
}
