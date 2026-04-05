import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { accessToken } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}