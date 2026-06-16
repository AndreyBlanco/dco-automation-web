import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createAuditService } from '../services/audit/createAuditService'
import { latestEditsFromEvents } from '../services/audit/auditApiMappers'
import { readStoredUser } from '../services/auth/authStorage'
import {
  createSheetRowsService,
  sheetRowsDataSourceLabel,
} from '../services/sheet/createSheetRowsService'
import type { SheetRowPatch, SheetRowsQuery } from '../types/sheet-api'
import type { SheetRow } from '../types/sheet-row'
import { computeSheetRowStats } from '../types/sheet-row'

export type SheetRowsLoadState = 'idle' | 'loading' | 'success' | 'error'

async function enrichRowsWithLastEdit(
  rows: SheetRow[],
  query: SheetRowsQuery,
): Promise<SheetRow[]> {
  if (sheetRowsDataSourceLabel() !== 'API') return rows

  try {
    const auditRes = await createAuditService().listEvents({
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    })
    const edits = latestEditsFromEvents(auditRes.events)
    return rows.map((row) => {
      if (row.rowIndex == null) return row
      const lastEdit = edits.get(row.rowIndex)
      return lastEdit ? { ...row, lastEdit } : row
    })
  } catch {
    return rows
  }
}

export function useSheetRows(query: SheetRowsQuery) {
  const serviceRef = useRef(createSheetRowsService())
  const [loadState, setLoadState] = useState<SheetRowsLoadState>('idle')
  const [rows, setRows] = useState<SheetRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const { date, dateFrom, dateTo, ivfStatus, kindOfInsurance, q } = query

  const load = useCallback(async () => {
    setLoadState('loading')
    setError(null)
    const rowsQuery = { date, dateFrom, dateTo, ivfStatus, kindOfInsurance, q }
    try {
      const res = await serviceRef.current.listRows(rowsQuery)
      const enriched = await enrichRowsWithLastEdit(res.rows, rowsQuery)
      setRows(enriched)
      setLoadState('success')
    } catch (e) {
      setRows([])
      setError(e instanceof Error ? e.message : 'Could not load sheet rows.')
      setLoadState('error')
    }
  }, [date, dateFrom, dateTo, ivfStatus, kindOfInsurance, q])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => computeSheetRowStats(rows), [rows])

  const patchRow = useCallback(async (patch: SheetRowPatch) => {
    const res = await serviceRef.current.patchRow(patch)
    const user = readStoredUser()
    const lastEdit = user
      ? { username: user.username, editedAt: new Date().toISOString() }
      : undefined

    setRows((prev) =>
      prev.map((row) => {
        if (row.rowIndex !== res.row.rowIndex) return row
        return { ...res.row, lastEdit: lastEdit ?? row.lastEdit }
      }),
    )
    return res
  }, [])

  return { rows, stats, loadState, error, reload: load, patchRow }
}
