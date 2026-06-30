import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { GUIDE_STRUCTURE } from '../lib/guideStructure'

const totalSections = GUIDE_STRUCTURE.parts.reduce((sum, p) => sum + p.sections.length, 0)

const QUICK_PATHS = [
  {
    label: 'New Fellow',
    description: 'Start with the welcome & model',
    icon: '👋',
    sectionId: '379fef71-1233-81b1-ab23-dbf7daff242c', // NF Welcome Letter
    color: '#059669',
  },
  {
    label: 'Experienced Fellow',
    description: 'Jump to V2.1 new additions',
    icon: '🔥',
    sectionId: '379fef71-1233-8168-b40b-ee6f1e075858', // SOP 20
    color: '#EA580C',
  },
  {
    label: 'Setting Up a Nook',
    description: 'Infrastructure & space specs',
    icon: '🛠️',
    sectionId: '379fef71-1233-81d0-8ceb-c5eaa57ea649', // Physical Space Specification
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

        {/* Parts grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-5">
            All Parts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GUIDE_STRUCTURE.parts.map(part => (
              <PartCard key={part.id} part={part} onClick={() => navigate(`/part/${part.id}`)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function PartCard({ part, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100
        hover:shadow-lg transition-all duration-200 overflow-hidden
        cursor-pointer group flex"
    >
      {/* Color bar */}
      <div
        className="w-1.5 flex-shrink-0 rounded-l-xl"
        style={{ backgroundColor: part.color }}
      />

      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: part.color }}
            >
              {part.number === 0 ? 'Intro' : `Part ${part.number}`}
            </span>
            {part.tag && (
              <span className="text-xs text-gray-500 font-medium">{part.tag}</span>
            )}
            {part.isNew && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full
                bg-amber/20 text-amber border border-amber/30">
                NEW IN V2.1
              </span>
            )}
          </div>
          <span className="text-xl flex-shrink-0">{part.icon}</span>
        </div>

        <h3 className="text-base font-bold text-navy mb-1 group-hover:text-accent transition-colors">
          {part.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
          {part.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">
            {part.sections.length} section{part.sections.length !== 1 ? 's' : ''}
          </span>
          <svg
            className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}
