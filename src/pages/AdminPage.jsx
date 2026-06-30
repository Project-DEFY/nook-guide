import { useState, useEffect, useContext } from 'react'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'

const ROLE_STYLES = {
  admin: 'bg-navy text-white',
  fellow: 'bg-accent text-white',
  partner: 'bg-amber text-white',
}

export default function AdminPage() {
  const { session } = useContext(AuthContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('nook_guide_access')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function handleRoleChange(userId, newRole) {
    setActionLoading(userId + '-role')
    await supabase
      .from('nook_guide_access')
      .update({ nook_role: newRole })
      .eq('id', userId)
    await fetchUsers()
    setActionLoading(null)
  }

  async function handleDelete(id) {
    if (!confirm('Remove this user\'s access? They will not be able to log in.')) return
    setActionLoading(id + '-delete')
    await supabase.from('nook_guide_access').delete().eq('id', id)
    await fetchUsers()
    setActionLoading(null)
  }

  const getInitials = (name, email) => {
    const src = name || email || '?'
    return src.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy">Admin Panel</h1>
              <p className="text-gray-500 text-sm mt-0.5">Manage access to the Nook Guide</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg
                text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              Invite User
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {['admin', 'fellow', 'partner'].map(role => (
              <div key={role} className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-2xl font-bold text-navy">
                  {users.filter(u => u.nook_role === role).length}
                </p>
                <p className="text-sm text-gray-500 capitalize">{role}s</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {loading ? (
              <LoadingSpinner text="Loading users..." />
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No users yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map(user => (
                  <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center
                      flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {getInitials(user.full_name, user.email)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name || '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.nook_location && (
                        <p className="text-xs text-gray-400">{user.nook_location}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize
                        ${ROLE_STYLES[user.nook_role] || 'bg-gray-100 text-gray-600'}`}>
                        {user.nook_role}
                      </span>
                      {!user.user_id && (
                        <span className="text-xs text-amber font-medium bg-amber/10
                          px-2 py-0.5 rounded-full">
                          Pending login
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <select
                        value={user.nook_role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={actionLoading === user.id + '-role'}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5
                          text-gray-600 focus:outline-none focus:ring-1 focus:ring-accent
                          disabled:opacity-50"
                      >
                        <option value="admin">admin</option>
                        <option value="fellow">fellow</option>
                        <option value="partner">partner</option>
                      </select>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={actionLoading === user.id + '-delete' ||
                          user.user_id === session?.user?.id}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300
                          hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Remove access"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onDone={fetchUsers} />
      )}
    </div>
  )
}

function InviteModal({ onClose, onDone }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('fellow')
  const [nookLocation, setNookLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleInvite(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Insert access row with email, no user_id yet
    const { error: insertError } = await supabase
      .from('nook_guide_access')
      .insert({
        email,
        full_name: fullName,
        nook_role: role,
        nook_location: nookLocation || null,
        user_id: null,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Send magic link (OTP)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (otpError) {
      setError(`Access row created but magic link failed: ${otpError.message}`)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-navy">Invite User</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-gray-900 mb-1">Invite sent!</p>
              <p className="text-sm text-gray-500">
                A magic link has been emailed to <strong>{email}</strong>.
                They'll be able to sign in once they click it.
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full bg-navy text-white py-2.5 rounded-lg text-sm
                  font-semibold hover:bg-navy/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="fellow@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Priya Sharma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="fellow">Fellow</option>
                  <option value="admin">Admin</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              {role === 'fellow' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nook location
                  </label>
                  <input
                    type="text"
                    value={nookLocation}
                    onChange={e => setNookLocation(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="e.g. Dharavi, Mumbai"
                  />
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-blue-700">
                  A magic sign-in link will be emailed to the user. They'll be granted access
                  the first time they log in.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-gray-200
                    text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-navy text-white py-2.5 rounded-lg text-sm font-semibold
                    hover:bg-navy/90 disabled:opacity-60 transition-colors flex items-center
                    justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent
                        rounded-full animate-spin" />
                      Inviting...
                    </>
                  ) : 'Send Invite'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
