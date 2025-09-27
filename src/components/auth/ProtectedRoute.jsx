import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const ProtectedRoute = ({ children, requireRole = null }) => {
  const { user, loading, userRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login page with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (requireRole && userRole !== requireRole) {
    // Redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute
