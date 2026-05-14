import {
  CalendarDays,
  FileBarChart2,
  Home,
  Settings,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import styles from './MobileTabBar.module.css'

const tabs = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appts', icon: CalendarDays },
  { path: '/reports', label: 'Reports', icon: FileBarChart2 },
  { path: '/settings', label: 'More', icon: Settings },
]

export function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className={styles.tabbar} role="navigation" aria-label="Mobile">
      <div className={styles.inner}>
        {tabs.map(({ path, label, icon: Icon }) => {
          const active =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path)
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
      </div>
    </div>
  )
}
