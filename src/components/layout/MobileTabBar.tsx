import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canRunDentrixSync } from '../../utils/authRoles'
import { AccountMenu } from './AccountMenu'
import styles from './MobileTabBar.module.css'

const tabs = [
  { path: '/verification', label: 'IVF', icon: ClipboardCheck, adminOnly: false },
  { path: '/sync', label: 'Sync', icon: RefreshCw, adminOnly: true },
] as const

export function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const showSync = canRunDentrixSync(user)
  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || showSync)

  return (
    <div className={styles.tabbar} role="navigation" aria-label="Mobile">
      <div className={styles.inner}>
        {visibleTabs.map(({ path, label, icon: Icon }) => {
          const active =
            location.pathname === path ||
            (path === '/verification' && location.pathname === '/')
          return (
            <button
              key={path}
              type="button"
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
              {label}
            </button>
          )
        })}
        <AccountMenu variant="mobile" />
      </div>
    </div>
  )
}
