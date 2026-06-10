import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { LoadingState } from '../components/ui/AsyncFeedback'
import { authUsesApi, createAuthService } from '../services/auth/createAuthService'
import { clearSession, persistSession, readStoredToken, readStoredUser } from '../services/auth/authStorage'
import { setSessionExpiredHandler } from '../services/auth/sessionEvents'
import type { AuthUser, LoginCredentials } from '../types/auth-api'

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  bootstrapping: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const serviceRef = useRef(createAuthService())
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredToken())
  const [bootstrapping, setBootstrapping] = useState(() => authUsesApi() && Boolean(readStoredToken()))

  const logout = useCallback(() => {
    clearSession()
    setAccessToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      logout()
    })
    return () => setSessionExpiredHandler(null)
  }, [logout])

  useEffect(() => {
    if (!authUsesApi()) {
      setBootstrapping(false)
      return
    }

    const token = readStoredToken()
    if (!token) {
      setBootstrapping(false)
      return
    }

    const service = serviceRef.current
    if (!service.getMe) {
      setBootstrapping(false)
      return
    }

    let cancelled = false

    void service
      .getMe(token)
      .then((restored) => {
        if (cancelled) return
        persistSession(token, restored)
        setAccessToken(token)
        setUser(restored)
      })
      .catch(() => {
        if (cancelled) return
        logout()
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false)
      })

    return () => {
      cancelled = true
    }
  }, [logout])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await serviceRef.current.login(credentials)
    persistSession(result.accessToken, result.user)
    setAccessToken(result.accessToken)
    setUser(result.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      bootstrapping,
      login,
      logout,
    }),
    [user, accessToken, bootstrapping, login, logout],
  )

  if (bootstrapping) {
    return (
      <AuthContext.Provider value={value}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <LoadingState message="Restoring session…" />
        </div>
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
