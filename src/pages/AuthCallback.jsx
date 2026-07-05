import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../App'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { session, userAccess, accessLoading } = useContext(AuthContext)
  const fallback = useRef(null)

  useEffect(() => {
    if (session === undefined) return  // still loading initial session
    if (accessLoading) return          // still checking access table

    if (session && userAccess) {
      navigate('/', { replace: true })
    } else if (session && !userAccess) {
      navigate('/login?error=no_access', { replace: true })
    } else {
      // No session yet. With implicit flow, supabase-js detects the
      // #access_token hash automatically — onAuthStateChange will fire.
      // Only redirect to login if there's nothing auth-related in the URL.
      const hasAuth = window.location.hash.includes('access_token') ||
                      window.location.search.includes('code=')

      if (hasAuth) {
        // Give supabase-js up to 8 seconds to process the tokens
        fallback.current = setTimeout(
          () => navigate('/login?error=no_access', { replace: true }),
          8000
        )
      } else {
        navigate('/login', { replace: true })
      }
    }

    return () => clearTimeout(fallback.current)
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
