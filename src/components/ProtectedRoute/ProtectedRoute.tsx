import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { ReactNode } from 'react'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default ProtectedRoute
