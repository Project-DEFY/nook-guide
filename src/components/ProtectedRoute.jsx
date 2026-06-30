import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../App'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { session, userAccess } = useContext(AuthContext)

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Still loading userAccess
  if (userAccess === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Checking access..." />
      </div>
    )
  }

  if (adminOnly && userAccess?.nook_role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
