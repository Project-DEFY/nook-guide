import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { GUIDE_STRUCTURE } from '../lib/guideStructure'

export default function PartPage() {
  const { partId } = useParams()
  const navigate = useNavigate()
  const part = GUIDE_STRUCTURE.parts.find(p => p.id === partId)

  if (!part) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-14 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-500 text-lg">Part not found.</p>
            <Link to="/" className="text-accent text-sm mt-2 block hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        {/* Part header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500
                hover:text-accent transition-colors mb-5 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 19l-7-7 7-7" />
              </svg>
              All Parts
            </Link>

            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${part.color}20` }}
              >
                {part.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: part.color }}
                  >
                    {part.number === 0 ? 'Introduction' : `Part ${part.number}`}
                  </span>
                  {part.tag && (
                    <span className="text-xs text-gray-500 font-medium">{part.tag}</span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-navy">{part.title}</h1>
                <p className="text-gray-500 mt-1 text-sm max-w-xl">{part.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-sm text-gray-500 mb-5">
            {part.sections.length} section{part.sections.length !== 1 ? 's' : ''} in this part
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {part.sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                part={part}
                index={idx}
                onClick={() => navigate(`/section/${section.id}`)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionCard({ section, part, index, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100
        hover:shadow-lg transition-all duration-200 cursor-pointer group
        flex overflow-hidden"
    >
      <div
        className="w-1.5 flex-shrink-0"
        style={{ backgroundColor: part.color }}
      />
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {section.sopNum && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: part.color }}
              >
                SOP {section.sopNum}
              </span>
            )}
          </div>
          {section.readTime && (
            <span className="text-xs text-gray-400 font-medium flex-shrink-0">
              {section.readTime}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-navy group-hover:text-accent
          transition-colors leading-snug mb-1">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-1">
            {section.description}
          </p>
        )}

        <div className="flex items-center justify-end mt-3">
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-accent
              group-hover:translate-x-0.5 transition-all"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
