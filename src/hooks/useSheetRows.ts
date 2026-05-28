import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createSheetRowsService } from '../services/sheet/createSheetRowsService'
import type { SheetRowPatch, SheetRowsQuery } from '../types/sheet-api'
import type { SheetRow } from '../types/sheet-row'
import { computeSheetRowStats } from '../types/sheet-row'

export type SheetRowsLoadState = 'idle' | 'loading' | 'success' | 'error'

export function useSheetRows(query: SheetRowsQuery) {
  const serviceRef = useRef(createSheetRowsService())
  const [loadState, setLoadState] = useState<SheetRowsLoadState>('idle')
  const [rows, setRows] = useState<SheetRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const queryKey = JSON.stringify(query)

  const load = useCallback(async () => {
    setLoadState('loading')
    setError(null)
    try {
      const res = await serviceRef.current.listRows(query)
      setRows(res.rows)
      setLoadState('success')
    } catch (e) {
      setRows([])
      setError(e instanceof Error ? e.message : 'Could not load sheet rows.')
      setLoadState('error')
    }
  }, [queryKey, query])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => computeSheetRowStats(rows), [rows])

  const patchRow = useCallback(
    async (patch: SheetRowPatch) => {
      const res = await serviceRef.current.patchRow(patch)
      setRows((prev) =>
        prev.map((row) => (row.rowIndex === res.row.rowIndex ? res.row : row)),
      )
      return res
    },
    [],
  )

  return { rows, stats, loadState, error, reload: load, patchRow }
}
