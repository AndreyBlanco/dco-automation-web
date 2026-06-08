import { mockSheetRows } from '../../data/mockSheetRows'
import type {
  SheetRowPatch,
  SheetRowPatchResponse,
  SheetRowsQuery,
  SheetRowsResponse,
  SheetRowsService,
} from '../../types/sheet-api'
import type { SheetRow } from '../../types/sheet-row'

/** Mutable copy for local PATCH demos when the API is not used. */
let rowsStore: SheetRow[] = mockSheetRows.map((row) => ({ ...row }))

function matchesQuery(row: SheetRow, query: SheetRowsQuery): boolean {
  if (query.date && row.date !== query.date) return false
  if (query.dateFrom && row.date < query.dateFrom) return false
  if (query.dateTo && row.date > query.dateTo) return false
  if (query.ivfStatus && row.ivfStatus !== query.ivfStatus) return false
  if (query.kindOfInsurance && row.kindOfInsurance !== query.kindOfInsurance) return false
  if (query.q) {
    const q = query.q.trim().toLowerCase()
    const hay = `${row.patientName} ${row.insurance} ${row.notes}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

export class MockSheetRowsService implements SheetRowsService {
  async listRows(query: SheetRowsQuery): Promise<SheetRowsResponse> {
    await delay(280)
    const rows = rowsStore.filter((r) => matchesQuery(r, query))
    return {
      rows,
      meta: {
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        count: rows.length,
      },
    }
  }

  async patchRow(patch: SheetRowPatch): Promise<SheetRowPatchResponse> {
    await delay(200)
    const idx = rowsStore.findIndex((r) => r.rowIndex === patch.rowIndex)
    if (idx < 0) {
      throw new Error(`No row with rowIndex=${patch.rowIndex}`)
    }
    const current = rowsStore[idx]
    const updated: SheetRow = {
      ...current,
      ivfStatus: patch.ivfStatus ?? current.ivfStatus,
      notes: patch.notes ?? current.notes,
    }
    rowsStore[idx] = updated
    return { ok: true, row: updated, message: 'Row updated (mock).' }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
