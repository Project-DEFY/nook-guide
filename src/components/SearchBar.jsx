import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { allSections } from '../lib/guideStructure'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  const sections = allSections()

  const search = useCallback((q) => {
    if (!q.trim()) {
      setResults([])
      setOpen(false)
      return
    }

    const lower = q.toLowerCase()
    // Client-side search over guide structure
    const localResults = sections
      .filter(s => s.title.toLowerCase().includes(lower))
      .slice(0, 8)
      .map(s => ({
        id: s.id,
        title: s.title,
        partTitle: s.part.title,
        partColor: s.part.color,
        readTime: s.readTime,
      }))

    setResults(localResults)
    setOpen(localResults.length > 0)
    setActiveIndex(-1)
  }, [sections])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      search(query)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && results[activeIndex]) {
        navigate(`/section/${results[activeIndex].id}`)
        setOpen(false)
        setQuery('')
      } else if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query)}`)
        setOpen(false)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
            placeholder="Search the guide..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              placeholder-gray-400 text-gray-700"
          />
        </div>
      </form>

      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200
            rounded-xl shadow-lg z-50 overflow-hidden"
        >
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => {
                navigate(`/section/${r.id}`)
                setOpen(false)
                setQuery('')
              }}
              className={`w-full text-left px-4 py-3 flex flex-col gap-0.5 hover:bg-gray-50
                border-b border-gray-100 last:border-0 transition-colors
                ${activeIndex === i ? 'bg-blue-50' : ''}`}
            >
              <span className="text-sm font-medium text-gray-900 line-clamp-1">{r.title}</span>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: r.partColor }}
                >
                  {r.partTitle}
                </span>
                {r.readTime && (
                  <span className="text-xs text-gray-400">{r.readTime}</span>
                )}
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(query)}`)
              setOpen(false)
            }}
            className="w-full text-left px-4 py-2.5 text-xs text-accent font-medium
              bg-gray-50 hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search all content for "{query}"
          </button>
        </div>
      )}
    </div>
  )
}
