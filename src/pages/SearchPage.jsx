import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import { allSections } from '../lib/guideStructure'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const navigate = useNavigate()

  const [localResults, setLocalResults] = useState([])
  const [notionResults, setNotionResults] = useState([])
  const [loadingNotion, setLoadingNotion] = useState(false)

  // Client-side search over guide structure
  useEffect(() => {
    if (!query.trim()) {
      setLocalResults([])
      return
    }
    const lower = query.toLowerCase()
    const sections = allSections()
    const results = sections.filter(s =>
      s.title.toLowerCase().includes(lower) ||
      s.part.title.toLowerCase().includes(lower)
    )
    setLocalResults(results)
  }, [query])

  // Notion API search
  useEffect(() => {
    if (!query.trim()) {
      setNotionResults([])
      return
    }
    setLoadingNotion(true)
    fetch(`/api/notion-search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        setNotionResults(data.results || [])
      })
      .catch(() => setNotionResults([]))
      .finally(() => setLoadingNotion(false))
  }, [query])

  const hasResults = localResults.length > 0 || notionResults.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy mb-1">
              {query ? `Search results for "${query}"` : 'Search'}
            </h1>
            {query && (
              <p className="text-sm text-gray-500">
                {localResults.length} guide structure match{localResults.length !== 1 ? 'es' : ''}
                {loadingNotion ? ' · searching Notion content...' : ''}
              </p>
            )}
          </div>

          {!query && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500">Enter a search term to find sections in the guide.</p>
            </div>
          )}

          {query && !hasResults && !loadingNotion && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <div className="text-4xl mb-3">😶</div>
              <p className="text-gray-700 font-medium mb-1">No results found</p>
              <p className="text-gray-400 text-sm mb-4">Try different keywords or browse the guide.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['SOPs', 'Fellow', 'Exhibition', 'M&E', 'Governance'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(suggestion)}`)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200
                      hover:border-accent hover:text-accent transition-colors text-gray-500"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guide structure matches */}
          {localResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Matches in Guide Structure
              </h2>
              <div className="space-y-2">
                {localResults.map(section => (
                  <SearchResultCard
                    key={section.id}
                    title={section.title}
                    partTitle={section.part.title}
                    partColor={section.part.color}
                    readTime={section.readTime}
                    sopNum={section.sopNum}
                    isNew={section.isNew}
                    query={query}
                    onClick={() => navigate(`/section/${section.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Notion content matches */}
          {loadingNotion && (
            <div className="mt-4">
              <LoadingSpinner text="Searching Notion content..." />
            </div>
          )}

          {!loadingNotion && notionResults.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                Content Matches from Notion
              </h2>
              <div className="space-y-2">
                {notionResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => navigate(`/section/${result.id}`)}
                    className="w-full text-left bg-white rounded-xl border border-gray-100
                      hover:shadow-md hover:border-gray-200 transition-all p-4 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-navy group-hover:text-accent
                        transition-colors line-clamp-2">
                        {result.title}
                      </p>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-accent
                        flex-shrink-0 mt-0.5 transition-colors"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

function SearchResultCard({ title, partTitle, partColor, readTime, sopNum, isNew, query, onClick }) {
  // Highlight matching text
  const highlight = (text) => {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    )
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100
        hover:shadow-md hover:border-gray-200 transition-all p-4 group flex"
    >
      <div
        className="w-1 rounded-full flex-shrink-0 mr-4"
        style={{ backgroundColor: partColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {sopNum && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: partColor }}
            >
              SOP {sopNum}
            </span>
          )}
          {isNew && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full
              bg-amber/20 text-amber border border-amber/30">
              NEW
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-navy group-hover:text-accent transition-colors">
          {highlight(title)}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: partColor }}
          >
            {highlight(partTitle)}
          </span>
          {readTime && <span className="text-xs text-gray-400">{readTime}</span>}
        </div>
      </div>
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-accent flex-shrink-0 ml-2 self-center
          transition-colors"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
