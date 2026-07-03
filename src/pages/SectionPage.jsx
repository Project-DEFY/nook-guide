import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Header from '../components/Header'
import NotionRenderer from '../components/NotionRenderer'
import DiscussionBoard from '../components/DiscussionBoard'
import SOPScenarios from '../components/SOPScenarios'
import SOPResources from '../components/SOPResources'
import { findSection, GUIDE_STRUCTURE } from '../lib/guideStructure'

export default function SectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [toc, setToc] = useState([])
  const [lastEdited, setLastEdited] = useState(null)
  const contentRef = useRef(null)

  const found = findSection(sectionId)

  // Scroll progress
  useEffect(() => {
    function handleScroll() {
      const doc = document.documentElement
      const scrollTop = doc.scrollTop || document.body.scrollTop
      const scrollHeight = doc.scrollHeight - doc.clientHeight
      setScrollProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Extract TOC from rendered content
  useEffect(() => {
    if (!contentRef.current) return
    const timer = setTimeout(() => {
      const headings = contentRef.current?.querySelectorAll('h2, h3') || []
      const items = Array.from(headings).map((h, i) => {
        const id = `heading-${i}`
        h.id = id
        return { id, text: h.textContent, level: h.tagName }
      })
      setToc(items)
    }, 500)
    return () => clearTimeout(timer)
  }, [sectionId])

  const getAdjacentSections = () => {
    if (!found) return { prev: null, next: null }
    const { part } = found
    const idx = part.sections.findIndex(s => s.id === sectionId)
    const partIdx = GUIDE_STRUCTURE.parts.findIndex(p => p.id === part.id)

    let prev = null
    if (idx > 0) {
      prev = { section: part.sections[idx - 1], part }
    } else if (partIdx > 0) {
      const prevPart = GUIDE_STRUCTURE.parts[partIdx - 1]
      prev = { section: prevPart.sections[prevPart.sections.length - 1], part: prevPart }
    }

    let next = null
    if (idx < part.sections.length - 1) {
      next = { section: part.sections[idx + 1], part }
    } else if (partIdx < GUIDE_STRUCTURE.parts.length - 1) {
      const nextPart = GUIDE_STRUCTURE.parts[partIdx + 1]
      next = { section: nextPart.sections[0], part: nextPart }
    }

    return { prev, next }
  }

  const { prev: prevSection, next: nextSection } = getAdjacentSections()

  if (!found) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Section not found.</p>
            <Link to="/" className="text-accent text-sm mt-2 block hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { section, part } = found

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-gray-200">
        <div
          className="h-full transition-all duration-100"
          style={{ width: `${scrollProgress}%`, backgroundColor: part.color }}
        />
      </div>

      <Header />

      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/part/${part.id}`} className="hover:text-accent transition-colors">
              {part.title}
            </Link>
            <span>/</span>
            <span className="text-gray-600 font-medium line-clamp-1">{section.title}</span>
          </nav>

          <div className="flex gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-xl border border-gray-100 p-6 sm:p-8">
                {/* Section header */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {section.sopNum && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: part.color }}
                    >
                      SOP {section.sopNum}
                    </span>
                  )}
                  {section.readTime && (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {section.readTime}
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-navy">
                    {section.title}
                  </h1>
                  {lastEdited && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 whitespace-nowrap flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Updated {new Date(lastEdited).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  )}
                </div>

                {/* Scenario buttons */}
                <SOPScenarios pageId={sectionId} />

                {/* Notion content */}
                <div ref={contentRef}>
                  <NotionRenderer
                    pageId={sectionId}
                    onMetadata={({ lastEdited }) => setLastEdited(lastEdited)}
                  />
                </div>

                {/* Resources & Tools */}
                <SOPResources pageId={sectionId} />

                {/* Community discussion */}
                <DiscussionBoard pageId={sectionId} />

                {/* Prev / Next navigation */}
                {(prevSection || nextSection) && (
                  <div className="mt-10 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {prevSection ? (
                      <button
                        onClick={() => navigate(`/section/${prevSection.section.id}`)}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 transition-all group text-left"
                        style={{
                          borderColor: `${prevSection.part.color}40`,
                          backgroundColor: `${prevSection.part.color}08`,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = prevSection.part.color
                          e.currentTarget.style.backgroundColor = `${prevSection.part.color}15`
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = `${prevSection.part.color}40`
                          e.currentTarget.style.backgroundColor = `${prevSection.part.color}08`
                        }}
                      >
                        <svg className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-0.5 transition-transform"
                          style={{ color: prevSection.part.color }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium mb-0.5" style={{ color: prevSection.part.color }}>← Previous</p>
                          <p className="text-sm font-semibold text-navy truncate">{prevSection.section.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{prevSection.part.title}</p>
                        </div>
                      </button>
                    ) : <div />}

                    {nextSection ? (
                      <button
                        onClick={() => navigate(`/section/${nextSection.section.id}`)}
                        className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all group text-left sm:col-start-2"
                        style={{
                          borderColor: `${nextSection.part.color}40`,
                          backgroundColor: `${nextSection.part.color}08`,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = nextSection.part.color
                          e.currentTarget.style.backgroundColor = `${nextSection.part.color}15`
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = `${nextSection.part.color}40`
                          e.currentTarget.style.backgroundColor = `${nextSection.part.color}08`
                        }}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium mb-0.5" style={{ color: nextSection.part.color }}>Next →</p>
                          <p className="text-sm font-semibold text-navy truncate">{nextSection.section.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{nextSection.part.title}</p>
                        </div>
                        <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
                          style={{ color: nextSection.part.color }}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : <div />}
                  </div>
                )}
              </div>
            </div>

            {/* Table of contents sidebar */}
            {toc.length > 0 && (
              <aside className="hidden xl:block w-56 flex-shrink-0">
                <div className="sticky top-20">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    On this page
                  </p>
                  <nav className="space-y-1">
                    {toc.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-xs text-gray-500 hover:text-accent
                          transition-colors leading-relaxed py-0.5
                          ${item.level === 'H3' ? 'pl-3 border-l border-gray-200' : ''}`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
