import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canRunDentrixSync } from '../../utils/authRoles'

/** Blocks /sync for non-admin roles (operator dashboard-only). */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (!canRunDentrixSync(user)) {
    return <Navigate to="/verification" replace />
  }

  return children
}
