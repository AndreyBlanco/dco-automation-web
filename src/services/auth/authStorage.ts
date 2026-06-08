import type { AuthUser } from '../../types/auth-api'

const TOKEN_KEY = 'dco-auth-token'
const USER_KEY = 'dco-auth-user'

export function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    if (parsed?.username && (parsed.role === 'admin' || parsed.role === 'operator')) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function persistSession(accessToken: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
