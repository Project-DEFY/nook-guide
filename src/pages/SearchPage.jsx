import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { searchContent, highlightMatch } from '../lib/searchIndex'

function Highlighted({ text, query }) {
  const parts = highlightMatch(text, query)
  return (
    <>
      {parts.map((part, i) =>
        typeof part === 'string'
          ? part
          : <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 not-italic">{part.text}</mark>
      )}
    </>
  )
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const navigate = useNavigate()

  const results = useMemo(() => searchContent(query), [query])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-navy mb-1">
              {query ? `"${query}"` : 'Search'}
            </h1>
            {query && (
              <p className="text-sm text-gray-400">
                {results.length} result{results.length !== 1 ? 's' : ''} across titles and content
              </p>
            )}
          </div>

          {/* Empty state */}
          {!query && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500">Enter a search term to find sections in the guide.</p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">😶</div>
              <p className="text-gray-700 font-medium mb-1">No results found for "{query}"</p>
              <p className="text-gray-400 text-sm mb-5">Try different keywords or browse the guide.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['SOPs', 'Fellow', 'Exhibition', 'M&E', 'Governance', 'Attendance', 'Budget'].map(s => (
                  <button
                    key={s}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200
                      hover:border-accent hover:text-accent transition-colors text-gray-500"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => navigate(`/section/${result.id}`)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100
                    hover:shadow-md hover:border-gray-200 transition-all p-4 group flex"
                >
                  <div
                    className="w-1 rounded-full flex-shrink-0 mr-4 self-stretch"
                    style={{ backgroundColor: result.part.color }}
                  />
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      {result.sopNum && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: result.part.color }}
                        >
                          SOP {result.sopNum}
                        </span>
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: result.part.color }}
                      >
                        {result.part.title}
                      </span>
                      {result.readTime && (
                        <span className="text-[10px] text-gray-400">{result.readTime}</span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold text-navy group-hover:text-accent
                      transition-colors leading-snug mb-1">
                      <Highlighted text={result.title} query={result.titleMatch ? query : ''} />
                    </p>

                    {/* Snippet */}
                    {result.snippet && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        <Highlighted text={result.snippet} query={query} />
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-accent flex-shrink-0 ml-3
                      self-center transition-colors"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
