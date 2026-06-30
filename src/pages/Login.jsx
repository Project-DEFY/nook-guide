import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [error, setError] = useState(null)

  async function handleGoogle() {
    setLoadingGoogle(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (authError) {
      setError(authError.message)
      setLoadingGoogle(false)
    }
    // On success, browser redirects to Google — no further action needed
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoadingEmail(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoadingEmail(false)
      return
    }

    // Check access table
    const { data: access } = await supabase
      .from('nook_guide_access')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (!access) {
      const { data: accessByEmail } = await supabase
        .from('nook_guide_access')
        .select('*')
        .eq('email', email)
        .single()

      if (!accessByEmail) {
        await supabase.auth.signOut()
        setError("You don't have access yet. Contact your DEFY administrator.")
        setLoadingEmail(false)
        return
      }
    }

    setLoadingEmail(false)
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

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={loadingGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                border border-gray-200 rounded-lg text-sm font-medium text-gray-700
                hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed
                transition-colors mb-6"
            >
              {loadingGoogle ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400">or sign in with email</span>
              </div>
            </div>

            {/* Email/password form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                disabled={loadingEmail}
                className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-semibold
                  hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors flex items-center justify-center gap-2"
              >
                {loadingEmail ? (
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
