type SessionExpiredHandler = () => void

let handler: SessionExpiredHandler | null = null

export function setSessionExpiredHandler(fn: SessionExpiredHandler | null): void {
  handler = fn
}

export function notifySessionExpired(): void {
  handler?.()
}
