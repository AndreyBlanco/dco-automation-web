import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { AccountMenu } from './AccountMenu'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/verification', label: 'IVF Verification', icon: ClipboardCheck },
  { to: '/sync', label: 'Dentrix Sync', icon: RefreshCw },
]

export function Sidebar() {
  return (
    <div className={styles.root}>
      <div className={styles.sidebarBrand}>
        <LogoMark size={200} />
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <Icon size={18} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <AccountMenu variant="sidebar" />
    </div>
  )
}
