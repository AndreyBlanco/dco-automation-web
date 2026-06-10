const STORAGE_KEY = 'dco-sync-completed-at'

export function markSyncCompleted(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, new Date().toISOString())
  } catch {
    /* ignore */
  }
}

export function readSyncCompletedAt(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearSyncCompletedNotice(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
