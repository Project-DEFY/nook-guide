import { useState, useRef, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'
import SearchBar from './SearchBar'

export default function Header() {
  const { session, userAccess } = useContext(AuthContext)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const email = session?.user?.email || ''
  const displayName = userAccess?.full_name || email
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || email[0]?.toUpperCase() || '?'

  const isAdmin = userAccess?.nook_role === 'admin'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-navy rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">D</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold text-navy tracking-widest">DEFY</span>
              <span className="text-xs text-gray-500 font-medium">Nook Guide</span>
            </div>
          </Link>

          {/* Desktop search */}
          <div className="hidden sm:flex flex-1 justify-center px-4">
            <SearchBar />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearchOpen(v => !v)}
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 bg-navy rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-semibold">{initials}</span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {displayName}
                </span>
                <svg className="hidden sm:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200
                  rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                    {userAccess?.nook_role && (
                      <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium
                        ${userAccess.nook_role === 'admin' ? 'bg-navy text-white' :
                          userAccess.nook_role === 'fellow' ? 'bg-accent text-white' :
                          userAccess.nook_role === 'team_member' ? 'bg-emerald-600 text-white' :
                          'bg-amber text-white'}`}>
                        {{ admin: 'Admin', fellow: 'Fellow', partner: 'Partner', team_member: 'Team Member' }[userAccess.nook_role] ?? userAccess.nook_role}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600
                      hover:bg-red-50 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="sm:hidden pb-3">
            <SearchBar />
          </div>
        )}
      </div>
    </header>
  )
}
