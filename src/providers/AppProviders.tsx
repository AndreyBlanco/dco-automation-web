import type { ReactNode } from 'react'
import { AuthProvider } from '../context/AuthContext'
import { PatientsProvider } from '../context/PatientsContext'
import { ToastProvider } from '../context/ToastContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PatientsProvider>
        <ToastProvider>{children}</ToastProvider>
      </PatientsProvider>
    </AuthProvider>
  )
}
