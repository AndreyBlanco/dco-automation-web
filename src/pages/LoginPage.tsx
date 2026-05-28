import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/brand/LogoMark'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/Field'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (user) {
    return <Navigate to="/verification" replace />
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login(username)
    const dest =
      from && from !== '/login' && from !== '/' ? from : '/verification'
    navigate(dest, { replace: true })
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
          Sign in to open IVF Verification and Dentrix Sync (demo — any password works).
        </p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <TextField
            id="username"
            label="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. frontdesk1"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <Button type="submit" variant="primary" size="lg" fullWidth>
            Login
          </Button>
        </form>
        <p className={styles.hint}>
          Sheet and sync data are mock until <code>VITE_API_URL</code> and the API flags in{' '}
          <code>.env.example</code> are enabled.
        </p>
      </div>
    </div>
  )
}
