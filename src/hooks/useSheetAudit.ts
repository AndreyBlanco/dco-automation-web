import { useCallback, useEffect, useRef, useState } from 'react'
import { createAuditService } from '../services/audit/createAuditService'
import type { SheetAuditEvent, SheetAuditQuery } from '../types/sheet-audit'

export type SheetAuditLoadState = 'idle' | 'loading' | 'success' | 'error'

export function useSheetAudit(query: SheetAuditQuery, enabled = true) {
  const serviceRef = useRef(createAuditService())
  const [loadState, setLoadState] = useState<SheetAuditLoadState>('idle')
  const [events, setEvents] = useState<SheetAuditEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  const { rowIndex, dateFrom, dateTo } = query

  const load = useCallback(async () => {
    if (!enabled) return
    setLoadState('loading')
    setError(null)
    try {
      const res = await serviceRef.current.listEvents({ rowIndex, dateFrom, dateTo })
      setEvents(res.events)
      setLoadState('success')
    } catch (e) {
      setEvents([])
      setError(e instanceof Error ? e.message : 'Could not load audit history.')
      setLoadState('error')
    }
  }, [enabled, rowIndex, dateFrom, dateTo])

  useEffect(() => {
    void load()
  }, [load])

  return { events, loadState, error, reload: load }
}
