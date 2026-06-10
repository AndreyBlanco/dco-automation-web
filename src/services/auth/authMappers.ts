import type { AuthUser, UserRole } from '../../types/auth-api'

type ApiUserPayload = {
  username?: string
  email?: string
  role?: string
}

export function normalizeAuthUser(raw: ApiUserPayload): AuthUser {
  const username = (raw.username ?? raw.email ?? '').trim()
  const role = raw.role as UserRole | undefined

  if (!username) {
    throw new Error('Invalid user payload from API.')
  }
  if (role !== 'admin' && role !== 'operator') {
    throw new Error('Invalid user role from API.')
  }

  return { username, role }
}
