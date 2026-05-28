import { useCallback, useEffect, useRef, useState } from 'react'
import { createDentrixSyncService } from '../services/dentrix-sync/createDentrixSyncService'
import type {
  DentrixSyncRunDetail,
  DentrixSyncRunRequest,
  DentrixSyncRunStatus,
} from '../types/dentrix-sync-api'

export type DentrixSyncUiPhase = 'idle' | 'starting' | 'polling' | 'done' | 'error'

const TERMINAL: DentrixSyncRunStatus[] = ['completed', 'failed', 'cancelled']

const POLL_MS = 1500

export function useDentrixSync() {
  const serviceRef = useRef(createDentrixSyncService())
  const [phase, setPhase] = useState<DentrixSyncUiPhase>('idle')
  const [run, setRun] = useState<DentrixSyncRunDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runIdRef = useRef<string | null>(null)

  const poll = useCallback(async () => {
    const id = runIdRef.current
    if (!id) return
    try {
      const detail = await serviceRef.current.getRun(id)
      setRun(detail)
      if (TERMINAL.includes(detail.status)) {
        setPhase(detail.status === 'completed' ? 'done' : 'error')
        if (detail.status === 'failed') {
          setError(detail.message ?? 'Sync run failed.')
        }
        runIdRef.current = null
        return
      }
      setPhase('polling')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load run status.')
      setPhase('error')
      runIdRef.current = null
    }
  }, [])

  useEffect(() => {
    if (phase !== 'polling') return
    const id = window.setInterval(() => {
      void poll()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [phase, poll])

  const start = useCallback(async (request: DentrixSyncRunRequest) => {
    setPhase('starting')
    setError(null)
    setRun(null)
    runIdRef.current = null
    try {
      const summary = await serviceRef.current.startRun(request)
      runIdRef.current = summary.runId
      const detail = await serviceRef.current.getRun(summary.runId)
      setRun(detail)
      if (TERMINAL.includes(detail.status)) {
        setPhase(detail.status === 'completed' ? 'done' : 'error')
        return
      }
      setPhase('polling')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start sync.')
      setPhase('error')
    }
  }, [])

  const resume = useCallback(async () => {
    const id = runIdRef.current
    if (!id) return
    setError(null)
    try {
      const detail = await serviceRef.current.resumeRun(id)
      setRun(detail)
      setPhase('polling')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not resume sync.')
      setPhase('error')
    }
  }, [])

  const reset = useCallback(() => {
    runIdRef.current = null
    setPhase('idle')
    setRun(null)
    setError(null)
  }, [])

  const isBusy = phase === 'starting' || phase === 'polling'

  return { phase, run, error, start, resume, reset, isBusy, refresh: poll }
}
