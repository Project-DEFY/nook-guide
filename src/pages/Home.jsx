import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { GUIDE_STRUCTURE } from '../lib/guideStructure'

const totalSections = GUIDE_STRUCTURE.parts.reduce((sum, p) => sum + p.sections.length, 0)

const QUICK_PATHS = [
  {
    label: 'New Fellow',
    description: 'Start with the welcome & model',
    icon: '👋',
    sectionId: '379fef71-1233-81b1-ab23-dbf7daff242c',
    color: '#059669',
  },
  {
    label: 'Experienced Fellow',
    description: 'Jump to SOPs 20–24',
    icon: '🔥',
    sectionId: '379fef71-1233-8168-b40b-ee6f1e075858',
    color: '#EA580C',
  },
  {
    label: 'Setting Up a Nook',
    description: 'Infrastructure & space specs',
    icon: '🛠️',
    sectionId: '379fef71-1233-81d0-8ceb-c5eaa57ea649',
    color: '#475569',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-14">
        {/* Hero */}
        <div className="bg-navy text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold tracking-widest text-blue-300 uppercase">
                  Project DEFY
                </span>
                <span className="w-1 h-1 rounded-full bg-blue-400" />
                <span className="text-xs text-blue-300">V2.1</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
                Nook V2.1 — The Complete<br className="hidden sm:block" /> Operating Guide
              </h1>
              <p className="text-blue-200 text-sm mb-6">
                {totalSections} sections · 24 SOPs · Last updated June 2026
              </p>

              {/* Quick path buttons */}
              <div className="flex flex-wrap gap-3">
                {QUICK_PATHS.map(path => (
                  <button
                    key={path.label}
                    onClick={() => navigate(`/section/${path.sectionId}`)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                      bg-white/10 hover:bg-white/20 border border-white/20
                      text-sm font-medium text-white transition-colors group"
                  >
                    <span className="text-base">{path.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{path.label}</div>
                      <div className="text-xs text-blue-300 font-normal">{path.description}</div>
                    </div>
                    <svg className="w-4 h-4 text-blue-300 group-hover:translate-x-0.5 transition-transform ml-1"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full table of contents */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {GUIDE_STRUCTURE.parts.map(part => (
            <PartSection key={part.id} part={part} navigate={navigate} />
          ))}
        </div>
      </main>
    </div>
  )
}

function PartSection({ part, navigate }) {
  return (
    <div>
      {/* Part header */}
      <button
        onClick={() => navigate(`/part/${part.id}`)}
        className="w-full text-left group mb-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${part.color}20` }}
          >
            {part.icon}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: part.color }}
            >
              {part.number === 0 ? 'Intro' : `Part ${part.number}`}
            </span>
            {part.tag && (
              <span className="text-xs text-gray-500 font-medium">{part.tag}</span>
            )}
            <h2 className="text-base font-bold text-navy group-hover:text-accent transition-colors">
              {part.title}
            </h2>
          </div>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5
              transition-all ml-auto flex-shrink-0"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 ml-11">{part.description}</p>
      </button>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-0">
        {part.sections.map(section => (
          <SectionMiniCard
            key={section.id}
            section={section}
            part={part}
            onClick={() => navigate(`/section/${section.id}`)}
          />
        ))}
      </div>
    </div>
  )
}

function SectionMiniCard({ section, part, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100
        hover:border-gray-200 hover:shadow-md transition-all duration-150
        cursor-pointer group flex overflow-hidden"
    >
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: part.color }} />
      <div className="flex-1 px-4 py-3.5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {section.sopNum && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
                style={{ backgroundColor: part.color }}
              >
                SOP {section.sopNum}
              </span>
            )}
            {section.readTime && (
              <span className="text-[10px] text-gray-400">{section.readTime}</span>
            )}
          </div>
          <svg
            className="w-3.5 h-3.5 text-gray-200 group-hover:text-accent
              group-hover:translate-x-0.5 transition-all flex-shrink-0"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <h3 className="text-xs font-semibold text-navy group-hover:text-accent
          transition-colors leading-snug mb-1">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
            {section.description}
          </p>
        )}
      </div>
    </button>
  )
}
