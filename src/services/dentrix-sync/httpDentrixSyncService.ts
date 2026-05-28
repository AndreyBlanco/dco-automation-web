import type {
  DentrixSyncRunDetail,
  DentrixSyncRunRequest,
  DentrixSyncRunSummary,
  DentrixSyncService,
} from '../../types/dentrix-sync-api'

export class HttpDentrixSyncService implements DentrixSyncService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`
  }

  async startRun(request: DentrixSyncRunRequest): Promise<DentrixSyncRunSummary> {
    const res = await fetch(this.url('/api/robot/run'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (!res.ok) {
      throw new Error(`Failed to start Dentrix sync (${res.status})`)
    }
    return res.json() as Promise<DentrixSyncRunSummary>
  }

  async getRun(runId: string): Promise<DentrixSyncRunDetail> {
    const res = await fetch(this.url(`/api/robot/runs/${encodeURIComponent(runId)}`))
    if (!res.ok) {
      throw new Error(`Failed to load run status (${res.status})`)
    }
    return res.json() as Promise<DentrixSyncRunDetail>
  }

  async resumeRun(runId: string): Promise<DentrixSyncRunDetail> {
    const res = await fetch(this.url(`/api/robot/runs/${encodeURIComponent(runId)}/resume`), {
      method: 'POST',
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Failed to resume run (${res.status})`)
    }
    return res.json() as Promise<DentrixSyncRunDetail>
  }
}
