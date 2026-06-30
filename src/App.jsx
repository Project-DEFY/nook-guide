import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './lib/supabase'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import PartPage from './pages/PartPage'
import SectionPage from './pages/SectionPage'
import SearchPage from './pages/SearchPage'
import AdminPage from './pages/AdminPage'

export const AuthContext = createContext(null)

export default function App() {
  const [session, setSession] = useState(undefined)  // undefined = loading
  const [userAccess, setUserAccess] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadAccess(session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadAccess(session.user)
      else setUserAccess(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadAccess(user) {
    if (!user) { setUserAccess(null); return }

    // First try by user_id
    const { data: byId } = await supabase
      .from('nook_guide_access')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (byId) {
      setUserAccess(byId)
      return
    }

    // Try by email (first login — link user_id)
    const { data: byEmail } = await supabase
      .from('nook_guide_access')
      .select('*')
      .eq('email', user.email)
      .single()

    if (byEmail) {
      // Update user_id so future lookups find the row directly
      await supabase
        .from('nook_guide_access')
        .update({ user_id: user.id })
        .eq('id', byEmail.id)
      setUserAccess({ ...byEmail, user_id: user.id })
      return
    }

    // No access row found — sign them out
    await supabase.auth.signOut()
    setUserAccess(null)
    setSession(null)
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, userAccess, loadAccess: () => session && loadAccess(session.user) }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/part/:partId" element={<ProtectedRoute><PartPage /></ProtectedRoute>} />
          <Route path="/section/:sectionId" element={<ProtectedRoute><SectionPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
