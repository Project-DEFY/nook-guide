import { useParams, useNavigate, Link } from 'react-router-dom'
import Header from '../components/Header'
import { GUIDE_STRUCTURE } from '../lib/guideStructure'
import { SOP_RESOURCES } from '../data/sopResources'

const MIME_CONFIG = {
  'application/vnd.google-apps.spreadsheet': { label: 'Sheet', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'application/vnd.google-apps.document':    { label: 'Doc',   color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'application/pdf':                          { label: 'PDF',   color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'application/vnd.google-apps.presentation':{ label: 'Slides',color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { label: 'Sheet', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
}

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
                resources={SOP_RESOURCES[section.id] || []}
                onClick={() => navigate(`/section/${section.id}`)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function SectionCard({ section, part, index, resources, onClick }) {
  const MAX_SHOWN = 3
  const visible = resources.slice(0, MAX_SHOWN)
  const overflow = resources.length - MAX_SHOWN

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

        {visible.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" onClick={e => e.stopPropagation()}>
            {visible.map((r, i) => {
              const cfg = MIME_CONFIG[r.mimeType] || { label: 'File', color: 'text-gray-600 bg-gray-50 border-gray-200' }
              const shortName = r.name
                .replace(/\s*[-—]\s*(Template|Filled Sample|Guide).*$/i, '')
                .replace(/\s*\(.*\)$/, '')
                .trim()
              return (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={r.name}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium
                    transition-all hover:shadow-sm hover:-translate-y-0.5 active:scale-95
                    ${cfg.color}`}
                >
                  <span className="opacity-60 text-xs">{cfg.label}</span>
                  <span className="max-w-[120px] truncate">{shortName}</span>
                  <svg className="w-2.5 h-2.5 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )
            })}
            {overflow > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium
                text-gray-400 bg-gray-50 border-gray-200">
                +{overflow} more
              </span>
            )}
          </div>
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
