import { readStoredToken } from './authStorage'
import { notifySessionExpired } from './sessionEvents'

export function bearerHeaders(): HeadersInit {
  const token = readStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Fetch with Bearer token; notifies app to logout on 401. */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers)
  const auth = bearerHeaders()
  if (typeof auth === 'object' && auth !== null && 'Authorization' in auth) {
    headers.set('Authorization', String(auth.Authorization))
  }

  const res = await fetch(input, { ...init, headers })

  if (res.status === 401) {
    notifySessionExpired()
  }

  return res
}

export async function readApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; message?: string }
    if (typeof body.detail === 'string') return body.detail
    if (typeof body.message === 'string') return body.message
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Session expired. Please sign in again.'
  if (res.status === 403) return 'You do not have permission for this action.'
  return `${fallback} (${res.status})`
}
