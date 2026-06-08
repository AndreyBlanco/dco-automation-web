import type { AuthService, AuthUser, LoginCredentials, LoginResponse } from '../../types/auth-api'

export class HttpAuthService implements AuthService {
  private readonly baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username.trim(),
          password: credentials.password,
        }),
      })
    } catch {
      throw new Error(
        'Cannot reach the API. Start uvicorn from api/, or disable VITE_AUTH_USE_API for mock login.',
      )
    }

    if (!res.ok) {
      const message = await readErrorMessage(res)
      throw new Error(message)
    }

    const data = (await res.json()) as LoginResponse
    if (!data.accessToken || !data.user?.username) {
      throw new Error('Invalid login response from API.')
    }
    return data
  }

  async getMe(accessToken: string): Promise<AuthUser> {
    const res = await fetch(`${this.baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      throw new Error('Session expired. Please sign in again.')
    }

    return (await res.json()) as AuthUser
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: string; message?: string }
    if (typeof body.detail === 'string') return body.detail
    if (typeof body.message === 'string') return body.message
  } catch {
    /* ignore */
  }
  if (res.status === 401) return 'Invalid username or password.'
  return `Login failed (${res.status}).`
}
