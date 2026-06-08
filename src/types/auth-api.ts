export type UserRole = 'admin' | 'operator'

export interface AuthUser {
  username: string
  role: UserRole
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<LoginResponse>
  /** Reserved for D2 session restore via GET /auth/me */
  getMe?(accessToken: string): Promise<AuthUser>
}
