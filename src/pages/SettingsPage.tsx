import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className={styles.stack}>
      <h2 style={{ margin: 0 }}>Settings</h2>
      <p className={styles.muted}>
        Placeholder screen for environment configuration. Hook these toggles to the Python backend when the team is
        ready.
      </p>

      <Card noHover>
        <h3 style={{ marginTop: 0 }}>Account</h3>
        <dl className={styles.kv}>
          <div>
            <dt className={styles.k}>Signed in as</dt>
            <dd className={styles.v} style={{ margin: 0 }}>
              {user}
            </dd>
          </div>
        </dl>
        <div style={{ marginTop: 16 }}>
          <Button
            variant="secondary"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            Log out
          </Button>
        </div>
      </Card>

      <Card noHover>
        <h3 style={{ marginTop: 0 }}>Integrations (coming soon)</h3>
        <ul className={styles.muted} style={{ paddingLeft: 18, margin: 0 }}>
          <li>Insurance portal profiles</li>
          <li>Export directory & file naming</li>
          <li>Optional API keys (non-sensitive)</li>
        </ul>
      </Card>
    </div>
  )
}
