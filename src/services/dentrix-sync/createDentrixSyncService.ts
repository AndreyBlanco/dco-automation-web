import type { DentrixSyncService } from '../../types/dentrix-sync-api'
import { HttpDentrixSyncService } from './httpDentrixSyncService'
import { MockDentrixSyncService } from './mockDentrixSyncService'

/** Mock by default. Set VITE_DENTRIX_SYNC_USE_API=true when POST /api/robot/run exists. */
export function createDentrixSyncService(): DentrixSyncService {
  const base = import.meta.env.VITE_API_URL?.trim()
  const useApi = import.meta.env.VITE_DENTRIX_SYNC_USE_API === 'true' && Boolean(base)
  if (useApi && base) {
    return new HttpDentrixSyncService(base)
  }
  return new MockDentrixSyncService()
}

export function dentrixSyncDataSourceLabel(): string {
  return import.meta.env.VITE_DENTRIX_SYNC_USE_API === 'true' ? 'API' : 'mock'
}
