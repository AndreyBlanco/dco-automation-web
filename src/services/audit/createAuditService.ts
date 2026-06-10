import type { SheetAuditService } from '../../types/sheet-audit'
import { HttpAuditService } from './httpAuditService'
import { MockAuditService } from './mockAuditService'

/** API when sheet uses API and endpoint exists; mock otherwise. */
export function createAuditService(): SheetAuditService {
  const base = import.meta.env.VITE_API_URL?.trim()
  const useApi = import.meta.env.VITE_SHEET_USE_API === 'true' && Boolean(base)
  if (useApi && base) {
    return new HttpAuditService(base)
  }
  return new MockAuditService()
}

export function auditDataSourceLabel(): 'API' | 'mock' {
  const useApi = import.meta.env.VITE_SHEET_USE_API === 'true'
  return useApi ? 'API' : 'mock'
}
