import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createAuthService } from '../services/auth/createAuthService'
import { clearSession, persistSession, readStoredToken, readStoredUser } from '../services/auth/authStorage'
import type { AuthUser, LoginCredentials } from '../types/auth-api'

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef(createAuthService())
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredToken())

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await serviceRef.current.login(credentials)
    persistSession(result.accessToken, result.user)
    setAccessToken(result.accessToken)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setAccessToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      login,
      logout,
    }),
    [user, accessToken, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
