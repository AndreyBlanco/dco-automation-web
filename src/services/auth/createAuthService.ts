import type { AuthService } from '../../types/auth-api'
import { HttpAuthService } from './httpAuthService'
import { MockAuthService } from './mockAuthService'

/**
 * Mock by default (D1). Set VITE_AUTH_USE_API=true when Laura ships POST /auth/login.
 */
export function createAuthService(): AuthService {
  const base = import.meta.env.VITE_API_URL?.trim()
  const useApi = import.meta.env.VITE_AUTH_USE_API === 'true' && Boolean(base)
  if (useApi && base) {
    return new HttpAuthService(base)
  }
  return new MockAuthService()
}

export function authDataSourceLabel(): 'API' | 'mock' {
  const useApi = import.meta.env.VITE_AUTH_USE_API === 'true'
  return useApi ? 'API' : 'mock'
}
