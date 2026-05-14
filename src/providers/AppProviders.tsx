import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
