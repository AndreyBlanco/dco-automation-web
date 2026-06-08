import { ClipboardCheck, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AccountMenu } from './AccountMenu'
import styles from './MobileTabBar.module.css'

const tabs = [
  { path: '/verification', label: 'IVF', icon: ClipboardCheck },
  { path: '/sync', label: 'Sync', icon: RefreshCw },
]

export function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className={styles.tabbar} role="navigation" aria-label="Mobile">
      <div className={styles.inner}>
        {tabs.map(({ path, label, icon: Icon }) => {
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
