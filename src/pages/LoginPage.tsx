import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/brand/LogoMark'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import { authDataSourceLabel } from '../services/auth/createAuthService'
import styles from './LoginPage.module.css'

type FieldErrors = {
  username?: string
  password?: string
}

function validateFields(username: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  const trimmed = username.trim()
  if (!trimmed) {
    errors.username = 'Username is required.'
  } else if (trimmed.length < 2) {
    errors.username = 'Username must be at least 2 characters.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  }
  return errors
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const authSource = authDataSourceLabel()

  if (user) {
    return <Navigate to="/verification" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const errors = validateFields(username, password)
    setFieldErrors(errors)
    setFormError(null)

    if (errors.username || errors.password) {
      return
    }

    setSubmitting(true)
    try {
      await login({ username: username.trim(), password })
      const dest =
        from && from !== '/login' && from !== '/' ? from : '/verification'
      navigate(dest, { replace: true })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    setFormError(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <LogoMark size={300} />
        </div>
        <div>
          <h1 className={styles.title}>DCO Automation</h1>
        </div>
        <p className={styles.subtitle}>
          Sign in to open IVF Verification and Dentrix Sync.
        </p>

        <p className={styles.sourceBadge} role="status">
          Auth: <strong>{authSource}</strong>
          {authSource === 'mock' ? (
            <> — local demo accounts below.</>
          ) : (
            <> — use the API demo emails below.</>
          )}
        </p>

        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
          <TextField
            id="username"
            label={authSource === 'API' ? 'Email' : 'Username'}
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              clearFieldError('username')
            }}
            placeholder={authSource === 'API' ? 'admin@dco.test' : 'admin'}
            disabled={submitting}
            error={fieldErrors.username}
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearFieldError('password')
            }}
            placeholder="••••••••"
            disabled={submitting}
            error={fieldErrors.password}
          />

          {formError && (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className={styles.demoBox}>
          <p className={styles.demoTitle}>
            Demo accounts ({authSource === 'API' ? 'API' : 'mock'})
          </p>
          <ul className={styles.demoList}>
            {authSource === 'API' ? (
              <>
                <li>
                  <code>admin@dco.test</code> / <code>admin123</code> — sync + dashboard
                </li>
                <li>
                  <code>operator@dco.test</code> / <code>operator123</code> — dashboard only
                </li>
              </>
            ) : (
              <>
                <li>
                  <code>admin</code> / <code>admin</code> — sync + dashboard
                </li>
                <li>
                  <code>operator</code> / <code>operator</code> — dashboard only
                </li>
              </>
            )}
          </ul>
        </div>

        <p className={styles.hint}>
          Operators do not see Dentrix Sync in the app. Admins can run sync from the sidebar or
          mobile tab bar.
        </p>
      </div>
    </div>
  )
}
