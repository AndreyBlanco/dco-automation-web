import type { SheetRowsService } from '../../types/sheet-api'
import { HttpSheetRowsService } from './httpSheetRowsService'
import { MockSheetRowsService } from './mockSheetRowsService'

/**
 * Mock by default for Sprint 2. Set VITE_SHEET_USE_API=true and
 * VITE_API_URL when Laura ships GET /api/sheet/rows.
 */
export function createSheetRowsService(): SheetRowsService {
  const base = import.meta.env.VITE_API_URL?.trim()
  const useApi = import.meta.env.VITE_SHEET_USE_API === 'true' && Boolean(base)
  if (useApi && base) {
    return new HttpSheetRowsService(base)
  }
  return new MockSheetRowsService()
}

export function sheetRowsDataSourceLabel(): string {
  const useApi = import.meta.env.VITE_SHEET_USE_API === 'true'
  return useApi ? 'API' : 'mock'
}
