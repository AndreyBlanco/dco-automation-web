import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminRoute } from './components/auth/AdminRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DentrixSyncPage } from './pages/DentrixSyncPage'
import { IvfDashboardPage } from './pages/IvfDashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/verification" replace />} />
          <Route path="verification" element={<IvfDashboardPage />} />
          <Route
            path="sync"
            element={
              <AdminRoute>
                <DentrixSyncPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/verification" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
