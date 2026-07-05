import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [searchParams] = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingLink, setLoadingLink] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [error, setError] = useState(
    errorParam === 'no_access' ? "Your account doesn't have access yet. Contact your DEFY administrator." : null
  )

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
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoadingLink(true)
    setError(null)

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // only allow existing invited users
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (otpError) {
      // If user doesn't exist in auth yet, try with shouldCreateUser true
      // (they were invited but haven't logged in before)
      const { error: retryError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (retryError) {
        setError("Couldn't send a login link. Check your email or contact your DEFY administrator.")
        setLoadingLink(false)
        return
      }
    }

    setLinkSent(true)
    setLoadingLink(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <img src="/defy_logo.png" alt="Project DEFY" className="h-8 w-auto" />
          <div className="border-l border-white/20 pl-3">
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
            <img src="/defy_logo.png" alt="Project DEFY" className="h-7 w-auto" />
            <div className="border-l border-gray-200 pl-2.5">
              <div className="text-gray-500 text-xs">Nook Guide</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {linkSent ? (
              /* ── Magic link sent state ── */
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-navy mb-1">Check your inbox</h2>
                <p className="text-sm text-gray-500 mb-1">
                  We sent a login link to
                </p>
                <p className="text-sm font-semibold text-gray-700 mb-4">{email}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Click the link in the email to sign in. It expires in 1 hour.
                </p>
                <button
                  onClick={() => { setLinkSent(false); setEmail('') }}
                  className="mt-5 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-navy mb-1">Sign in</h1>
                <p className="text-gray-500 text-sm mb-7">Access the Nook Guide</p>

                {/* Google button — for @projectdefy.org accounts */}
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
                <p className="text-xs text-gray-400 text-center -mt-4 mb-6">
                  For @projectdefy.org accounts
                </p>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-gray-400">or get a login link</span>
                  </div>
                </div>

                {/* Magic link form — for all email addresses */}
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
                      placeholder-gray-400 text-gray-900"
                    placeholder="your@email.com"
                  />

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingLink || !email.trim()}
                    className="w-full bg-navy text-white py-2.5 rounded-lg text-sm font-semibold
                      hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed
                      transition-colors flex items-center justify-center gap-2"
                  >
                    {loadingLink ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send login link
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Access is granted by DEFY administrators only.
          </p>
        </div>
      </div>
    </div>
  )
}
