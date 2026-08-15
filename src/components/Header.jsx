import { useState, useRef, useEffect, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'
import SearchBar from './SearchBar'

export default function Header() {
  const { session, userAccess } = useContext(AuthContext)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

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
  const isCoAdmin = userAccess?.nook_role === 'co_admin'
  const showGrounding = userAccess && !['partner'].includes(userAccess.nook_role)
  const showCircles = userAccess && !['partner'].includes(userAccess.nook_role)
  const showRoadmap = userAccess && !['partner'].includes(userAccess.nook_role)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/defy_logo.png" alt="Project DEFY" className="h-8 w-auto" />
            <span className="text-xs font-semibold text-gray-400 border-l border-gray-200 pl-2.5 leading-none">
              Nook Guide
            </span>
          </Link>

          {/* Grounding nav link */}
          {showGrounding && (
            <Link
              to="/grounding"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-sm font-medium transition-colors flex-shrink-0 relative
                ${location.pathname === '/grounding'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728l.707.707M1 12h1m18 0h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              Grounding
              {userAccess?.nook_role === 'new_fellow' && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-teal-500 rounded-full" />
              )}
            </Link>
          )}

          {/* Circles nav link */}
          {showCircles && (
            <Link
              to="/circles"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-sm font-medium transition-colors flex-shrink-0
                ${location.pathname === '/circles'
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
              </svg>
              Circles
            </Link>
          )}

          {/* SOP Roadmap nav link */}
          {showRoadmap && (
            <Link
              to="/roadmap"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                text-sm font-medium transition-colors flex-shrink-0
                ${location.pathname === '/roadmap'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              SOP Roadmap
            </Link>
          )}

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
                        ${['admin','co_admin'].includes(userAccess.nook_role) ? 'bg-navy text-white' :
                          ['fellow','senior_fellow'].includes(userAccess.nook_role) ? 'bg-accent text-white' :
                          userAccess.nook_role === 'new_fellow' ? 'bg-teal-500 text-white' :
                          userAccess.nook_role === 'hopper' ? 'bg-purple-600 text-white' :
                          userAccess.nook_role === 'team_member' ? 'bg-emerald-600 text-white' :
                          'bg-amber text-white'}`}>
                        {{
                          admin: 'Admin', co_admin: 'Co-Admin',
                          fellow: 'Fellow', senior_fellow: 'Senior Fellow',
                          new_fellow: 'New Fellow', hopper: 'Hopper',
                          partner: 'Partner', team_member: 'Team Member'
                        }[userAccess.nook_role] ?? userAccess.nook_role}
                      </span>
                    )}
                  </div>
                  {showGrounding && (
                    <Link
                      to="/grounding"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Grounding
                      {userAccess?.nook_role === 'new_fellow' && (
                        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                      )}
                    </Link>
                  )}
                  {showCircles && (
                    <Link
                      to="/circles"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Circles
                    </Link>
                  )}
                  {showRoadmap && (
                    <Link
                      to="/roadmap"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      SOP Roadmap
                    </Link>
                  )}
                  {(isAdmin || isCoAdmin) && (
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
