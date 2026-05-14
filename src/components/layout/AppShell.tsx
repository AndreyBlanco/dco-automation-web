import { Outlet } from 'react-router-dom'
import { MobileTabBar } from './MobileTabBar'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import shell from './AppShell.module.css'

export function AppShell() {
  return (
    <div className={shell.shell}>
      <aside className={shell.sidebar}>
        <Sidebar />
      </aside>
      <div className={shell.main}>
        <TopNav />
        <main className={shell.content}>
          <Outlet />
        </main>
      </div>
      <MobileTabBar />
    </div>
  )
}
