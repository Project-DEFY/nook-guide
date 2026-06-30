import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../App'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { session, userAccess, accessLoading } = useContext(AuthContext)

  useEffect(() => {
    // Wait until App.jsx has finished determining session and access
    if (session === undefined) return   // still loading session
    if (accessLoading) return           // still checking access table

    if (session && userAccess) {
      navigate('/', { replace: true })
    } else if (session && !userAccess) {
      // Session exists but no access row — show error, don't loop
      navigate('/login?error=no_access', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [session, userAccess, accessLoading, navigate])

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-300 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
