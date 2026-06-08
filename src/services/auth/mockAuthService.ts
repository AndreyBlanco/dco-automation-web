import type { AuthService, LoginCredentials, LoginResponse, UserRole } from '../../types/auth-api'

const MOCK_DELAY_MS = 400

/** Demo accounts until Laura ships POST /auth/login */
const DEMO_ACCOUNTS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'admin', role: 'admin' },
  operator: { password: 'operator', role: 'operator' },
}

function resolveRole(username: string): UserRole {
  const key = username.trim().toLowerCase()
  return DEMO_ACCOUNTS[key]?.role ?? 'operator'
}

export class MockAuthService implements AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await delay(MOCK_DELAY_MS)

    const username = credentials.username.trim()
    const password = credentials.password

    if (!username) {
      throw new Error('Username is required.')
    }
    if (!password) {
      throw new Error('Password is required.')
    }

    const account = DEMO_ACCOUNTS[username.toLowerCase()]
    if (account && account.password !== password) {
      throw new Error('Invalid username or password.')
    }

    const role = account?.role ?? resolveRole(username)

    return {
      accessToken: `mock-token-${username}-${Date.now()}`,
      user: { username, role },
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
