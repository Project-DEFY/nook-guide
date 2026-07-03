import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../App'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, userAccess, accessLoading } = useContext(AuthContext)

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Checking access..." />
      </div>
    )
  }

  if (!userAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Access not found.</p>
          <p className="text-sm text-gray-400">Contact your DEFY administrator.</p>
        </div>
      </div>
    )
  }

  if (adminOnly && !['admin', 'co_admin'].includes(userAccess.nook_role)) {
    return <Navigate to="/" replace />
  }

  return children
}
