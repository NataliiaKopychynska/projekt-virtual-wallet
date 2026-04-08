import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage'
import RegisterPage from './pages/RegisterPage/RegisterPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import TransactionsPage from './pages/TransactionsPage/TransactionsPage'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage/AnalyticsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage/SettingsPage'))

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Navigate to="/home/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/analytics"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <AnalyticsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/home/settings"
        element={
          <ProtectedRoute>
            <Suspense fallback={null}>
              <SettingsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
