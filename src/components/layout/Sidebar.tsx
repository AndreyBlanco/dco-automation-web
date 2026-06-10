import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { LogoMark } from '../brand/LogoMark'
import { useAuth } from '../../context/AuthContext'
import { canRunDentrixSync } from '../../utils/authRoles'
import { AccountMenu } from './AccountMenu'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/verification', label: 'IVF Verification', icon: ClipboardCheck, adminOnly: false },
  { to: '/sync', label: 'Dentrix Sync', icon: RefreshCw, adminOnly: true },
] as const

export function Sidebar() {
  const { user } = useAuth()
  const showSync = canRunDentrixSync(user)
  const items = NAV.filter((item) => !item.adminOnly || showSync)

  return (
    <div className={styles.root}>
      <div className={styles.sidebarBrand}>
        <LogoMark size={200} />
      </div>

      <nav className={styles.nav} aria-label="Main">
        {items.map(({ to, label, icon: Icon }) => (
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
