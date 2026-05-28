import type { IvfStatus, KindOfInsurance, SheetRow, SheetRowPatch } from './sheet-row'

export type { SheetRowPatch } from './sheet-row'

/**
 * Proposed API contract — GET /api/sheet/rows (Laura / backend).
 * @see docs/ARCHITECTURE_IVF_WORKFLOW.md
 */

export interface SheetRowsQuery {
  /** Single day (YYYY-MM-DD). */
  date?: string
  /** Inclusive range. */
  dateFrom?: string
  dateTo?: string
  ivfStatus?: IvfStatus
  kindOfInsurance?: KindOfInsurance
  /** Search patient name or insurance (case-insensitive). */
  q?: string
}

export interface SheetRowsResponse {
  rows: SheetRow[]
  /** Echo filters applied (optional). */
  meta?: {
    dateFrom?: string
    dateTo?: string
    count: number
  }
}

export interface SheetRowPatchResponse {
  ok: boolean
  row: SheetRow
  message?: string
}

export interface SheetRowsService {
  listRows(query: SheetRowsQuery): Promise<SheetRowsResponse>
  patchRow(patch: SheetRowPatch): Promise<SheetRowPatchResponse>
}
