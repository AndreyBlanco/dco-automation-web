import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './TopNav.module.css'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/patients', label: 'Patients' },
  { to: '/appointments', label: 'Appointments' },
  { to: '/reports', label: 'Reports' },
  { to: '/settings', label: 'Settings' },
]

export function TopNav() {
  const { user } = useAuth()
  const initial = user?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className={styles.bar}>
      <nav className={styles.nav} aria-label="Primary">
        {links.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className={styles.user} title={user ?? 'Signed out'} aria-label="Account">
        {initial}
      </div>
    </header>
  )
}
