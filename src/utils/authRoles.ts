import type { AuthUser, UserRole } from '../types/auth-api'

/** Admin may start and resume Dentrix sync; operator may not. */
export function canRunDentrixSync(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === 'admin'
}
