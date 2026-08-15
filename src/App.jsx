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
import GroundingPage from './pages/GroundingPage'
import CirclesPage from './pages/CirclesPage'
import SOPRoadmapPage from './pages/SOPRoadmapPage'

export const AuthContext = createContext(null)

export default function App() {
  const [session, setSession] = useState(undefined)  // undefined = loading
  const [userAccess, setUserAccess] = useState(null)
  const [accessLoading, setAccessLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadAccess(session.user)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadAccess(session.user)
      else { setUserAccess(null); setAccessLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadAccess(user) {
    if (!user) { setUserAccess(null); setAccessLoading(false); return }

    setAccessLoading(true)
    const { data, error } = await supabase.rpc('get_my_nook_access')

    if (error) {
      console.error('Access check error:', error.message)
      setAccessLoading(false)
      return
    }

    const row = data?.[0] ?? null

    if (row) {
      if (!row.user_id || row.user_id !== user.id) {
        await supabase.rpc('link_nook_access_by_email')
      }
      setUserAccess(row)
      setAccessLoading(false)
      return
    }

    // Confirmed: no access row exists — sign them out
    await supabase.auth.signOut()
    setUserAccess(null)
    setSession(null)
    setAccessLoading(false)
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session, userAccess, accessLoading, loadAccess: () => session && loadAccess(session.user) }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/part/:partId" element={<ProtectedRoute><PartPage /></ProtectedRoute>} />
          <Route path="/section/:sectionId" element={<ProtectedRoute><SectionPage /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="/grounding" element={<ProtectedRoute><GroundingPage /></ProtectedRoute>} />
          <Route path="/circles" element={<ProtectedRoute><CirclesPage /></ProtectedRoute>} />
          <Route path="/roadmap" element={<ProtectedRoute><SOPRoadmapPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
