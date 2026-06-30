import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check access table
    const { data: access } = await supabase
      .from('nook_guide_access')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (!access) {
      // Try by email (new user whose user_id hasn't been linked yet)
      const { data: accessByEmail } = await supabase
        .from('nook_guide_access')
        .select('*')
        .eq('email', email)
        .single()

      if (!accessByEmail) {
        await supabase.auth.signOut()
        setError("You don't have access yet. Contact your DEFY administrator.")
        setLoading(false)
        return
      }
    }

    setLoading(false)
    // App.jsx auth state change will handle redirect
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-navy text-sm font-black tracking-tight">D</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-widest">PROJECT DEFY</div>
            <div className="text-blue-300 text-xs font-medium">Nook Guide</div>
          </div>
        </div>

        <div className="space-y-6">
          <blockquote className="text-2xl font-light text-white leading-relaxed">
            "The SOPs you've been given are companions, not commands."
          </blockquote>
          <div className="w-12 h-1 bg-accent rounded" />
          <div>
            <p className="text-blue-200 font-semibold text-lg">Nook V2.1</p>
            <p className="text-blue-300 text-sm">The Complete Operating Guide</p>
          </div>
        </div>

        <div className="text-blue-400 text-xs">
          © 2026 Project DEFY. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">D</span>
            </div>
            <div>
              <div className="text-navy font-bold text-xs tracking-widest">PROJECT DEFY</div>
              <div className="text-gray-500 text-xs">Nook Guide</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-navy mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm mb-7">Access the Nook Guide</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                    placeholder-gray-400 text-gray-900"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                    placeholder-gray-400 text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-semibold
                  hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access is granted by DEFY administrators only.
          </p>
        </div>
      </div>
    </div>
  )
}
