import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../App'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { session, userAccess, accessLoading } = useContext(AuthContext)
  const exchanged = useRef(false)

  // For PKCE flow: exchange the code in the URL for a session.
  // supabase-js with detectSessionInUrl:true does this automatically,
  // but we also do it explicitly here as a safety net.
  useEffect(() => {
    if (exchanged.current) return
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      exchanged.current = true
      supabase.auth.exchangeCodeForSession(code).catch(console.error)
    }
  }, [])

  // Navigate once session is resolved
  useEffect(() => {
    if (session === undefined) return  // still loading
    if (accessLoading) return          // still checking access

    if (session && userAccess) {
      navigate('/', { replace: true })
    } else if (session && !userAccess) {
      navigate('/login?error=no_access', { replace: true })
    } else {
      // No session yet — give supabase-js a moment to exchange the code
      // before giving up and redirecting to login
      const timer = setTimeout(() => navigate('/login', { replace: true }), 3000)
      return () => clearTimeout(timer)
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
