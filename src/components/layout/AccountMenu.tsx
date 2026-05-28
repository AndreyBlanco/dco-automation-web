import { User } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './AccountMenu.module.css'

type AccountMenuProps = {
  /** Sidebar chip at bottom vs compact icon for mobile tab bar */
  variant: 'sidebar' | 'mobile'
}

export function AccountMenu({ variant }: AccountMenuProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const menuId = useId()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const initial = user?.charAt(0).toUpperCase() ?? '?'
  const isSidebar = variant === 'sidebar'

  useEffect(() => {
    if (!menuOpen) return

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  function handleLogout() {
    logout()
    setMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div
      className={`${styles.root} ${isSidebar ? styles.rootSidebar : styles.rootMobile}`}
      ref={menuRef}
    >
      <button
        type="button"
        className={isSidebar ? styles.sidebarBtn : styles.mobileBtn}
        aria-label={`Account menu for ${user ?? 'user'}`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {isSidebar ? (
          <span className={styles.avatar} aria-hidden>
            {initial}
          </span>
        ) : (
          <User size={20} strokeWidth={menuOpen ? 2.4 : 2} aria-hidden />
        )}
        {isSidebar && (
          <span className={styles.sidebarLabel}>
            <span className={styles.userName}>{user ?? 'Signed in'}</span>
            <span className={styles.chevron} aria-hidden>
              {menuOpen ? '▴' : '▾'}
            </span>
          </span>
        )}
        {!isSidebar && <span className={styles.mobileLabel}>Account</span>}
      </button>

      {menuOpen && (
        <div
          id={menuId}
          className={`${styles.menu} ${isSidebar ? styles.menuSidebar : styles.menuMobile}`}
          role="menu"
        >
          <p className={styles.menuUser} role="presentation">
            Signed in as <strong>{user}</strong>
          </p>
          <button
            type="button"
            className={styles.menuLogout}
            role="menuitem"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
