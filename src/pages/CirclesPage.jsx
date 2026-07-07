import { useState, useEffect, useContext } from 'react'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const LENS_CONFIG = {
  inner: {
    label: 'Inside Us',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    header: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-600',
    dot: 'bg-amber-400',
    desc: 'What we carry — fear, curiosity, identity, and the things we know we were never taught.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  community: {
    label: 'Outside Us',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    header: 'bg-emerald-50 border-emerald-200',
    accent: 'text-emerald-600',
    dot: 'bg-emerald-400',
    desc: 'Our neighborhood, families, and the community we serve — whose voice is heard, what is broken, what gift is given.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  world: {
    label: 'Beyond Us',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    header: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-600',
    dot: 'bg-blue-400',
    desc: 'Systems, ecology, history, and the future — why injustice persists, who paid for what we use, what is possible.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  any: {
    label: 'Any Lens',
    badge: 'bg-purple-50 text-purple-700 border border-purple-200',
    header: 'bg-purple-50 border-purple-200',
    accent: 'text-purple-600',
    dot: 'bg-purple-400',
    desc: 'Special circles for specific moments — conflict, renewal, decision, transition, celebration.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
}

const FLAVOR_BADGES = {
  reflection:         'bg-gray-100 text-gray-600',
  debate:             'bg-orange-100 text-orange-700',
  vulnerability:      'bg-rose-100 text-rose-700',
  analysis:           'bg-sky-100 text-sky-700',
  problem_solving:    'bg-emerald-100 text-emerald-700',
  acknowledgment:     'bg-amber-100 text-amber-700',
  imagination:        'bg-violet-100 text-violet-700',
  conflict_resolution:'bg-red-100 text-red-700',
  renewal:            'bg-teal-100 text-teal-700',
  celebration:        'bg-yellow-100 text-yellow-700',
}

const FLAVOR_LABELS = {
  reflection: 'Reflection', debate: 'Debate', vulnerability: 'Vulnerability',
  analysis: 'Analysis', problem_solving: 'Problem-Solving', acknowledgment: 'Acknowledgment',
  imagination: 'Imagination', conflict_resolution: 'Conflict Resolution',
  renewal: 'Renewal', celebration: 'Celebration',
}

// Phase 1 weekly prescription — 8 weeks
const PHASE1_WEEKS = [
  {
    week: 1,
    theme: 'First Steps — Building Trust',
    opening_spec: '2 Inner + 2 Community',
    closing_spec: '3 Inner + 2 Community',
    notes: 'Focus entirely on self-introduction and personal story. No World lens yet — trust has to be built before the group can think together about power and systems. The opener sets the tone for the entire cycle. Choose circles that allow people to be specific, not general.',
    featured_titles: [
      'Not What You Do, But What You Carry',
      'Where I Come From and What I Carry',
      'The Most Interesting Person in Your Neighborhood',
      'Carry and Release',
      'Thank Someone in the Room',
    ],
  },
  {
    week: 2,
    theme: 'Finding Your Voice',
    opening_spec: '2 Inner + 2 Community + 1 World (first introduction)',
    closing_spec: '2 Inner + 3 Community',
    notes: 'Introduce the World lens carefully — start with something personal and familiar (like "Learning and Unlearning") rather than pure systems analysis. The group is still finding its voice. The Community closing circles start connecting personal experience to collective responsibility.',
    featured_titles: [
      'What Makes This Hard',
      'What I Know That I Wasn\'t Taught',
      'Who Gets Heard and Who Doesn\'t',
      'Learning and Unlearning',
      'What We Witnessed',
      'One True Thing',
    ],
  },
  {
    week: 3,
    theme: 'Community as Text',
    opening_spec: '1 Inner + 3 Community + 1 World',
    closing_spec: '1 Inner + 2 Community + 2 World',
    notes: 'Shift the balance toward community. This week the Nook\'s external context — the neighborhood, the community, the local problems — becomes the primary subject of inquiry. The group should start to feel like they share a common object of study: the world just outside the door.',
    featured_titles: [
      'The Problem That Has No Name',
      'The Gift Your Community Gives',
      'The Story We Tell About Ourselves',
      'Why Does This Still Exist?',
      'Whose Day Are We Building For?',
      'The Unseen Work',
    ],
  },
  {
    week: 4,
    theme: 'Systems and Power',
    opening_spec: '1 Inner + 2 Community + 2 World',
    closing_spec: '1 Inner + 2 Community + 2 World',
    notes: 'This is the week to go directly into World lens inquiry. The group should be ready now to analyze power, trace costs, and think structurally. The Inner closing circles keep it personal — the analysis stays grounded in lived experience, not abstraction.',
    featured_titles: [
      'The Story of Power',
      'Who Paid for This?',
      'Crisis Mapping',
      'What Changed',
      'The Scale Problem',
      'What Do We Owe?',
    ],
  },
  {
    week: 5,
    theme: 'Going Deeper',
    opening_spec: '2 Inner + 1 Community + 2 World',
    closing_spec: '2 Inner + 1 Community + 2 World',
    notes: 'Return to the inner lens after a week of outward focus. The vulnerability circles (The Question I\'ve Been Avoiding, Softness) can now go deeper because the group has built enough history together. The World circles this week should be ones that require imagination and historical thinking.',
    featured_titles: [
      'The Question I\'ve Been Avoiding',
      'What Indigenous Communities Know',
      'Revolution',
      'Softness',
      'Despair and Hope',
      'What I Needed and Didn\'t Say',
    ],
  },
  {
    week: 6,
    theme: 'Our Work in the World',
    opening_spec: '1 Inner + 2 Community + 2 World',
    closing_spec: '1 Inner + 2 Community + 2 World',
    notes: 'Connect the Nook\'s work explicitly to the community and the future. The "Future We\'re Building" and "Climate and Us" circles ask builders to think about the long-term context their work lives inside. This is a good week for a Project Circle (special) if a decision point has arrived.',
    featured_titles: [
      'The Future We\'re Building',
      'Climate and Us',
      'Youth and Elders',
      'Whose Day Are We Building For?',
      'What Changed Us',
      'Beauty and Resilience',
    ],
  },
  {
    week: 7,
    theme: 'Reflection and Design',
    opening_spec: '2 Inner + 1 Community + 2 World',
    closing_spec: '2 Inner + 2 Community + 1 World',
    notes: 'The cycle is moving toward its end. This week\'s circles should invite the group to look back at how they\'ve changed and forward at who they want to be. A good week to run "What I Want to Become" as an opening — the group now has context to answer it with more depth than in week 1.',
    featured_titles: [
      'What I Want to Become',
      'Anger Is Information',
      'What Changed',
      'The Long Game',
      'Tomorrow',
      'Who Are We Missing?',
    ],
  },
  {
    week: 8,
    theme: 'Closing the Cycle',
    opening_spec: '2 Inner + 2 Community + 1 World',
    closing_spec: '2 Inner + 1 Community + 2 World + Season Circle (closing)',
    notes: 'End the cycle intentionally. The Season Circle (closing flavor) should run on the final day — this is the one circle most worth recording and preserving. The group should feel the weight of what this cycle was and what they\'re taking forward. From Week 9 onwards, builders begin to design their own circles.',
    featured_titles: [
      'The Problem I\'ve Carried',
      'What I Know That I Wasn\'t Taught',
      'A Story of Solidarity',
      'The Long Game',
      'Enough',
      'Season Circle',
    ],
  },
]

// ─── CIRCLE CARD ──────────────────────────────────────────────────────────────

function CircleCard({ circle, onClick }) {
  const lens = LENS_CONFIG[circle.lens] || LENS_CONFIG.any
  const isOpening = circle.circle_type === 'opening'
  const isSpecial = circle.circle_type === 'special'

  return (
    <button
      onClick={() => onClick(circle)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-4
        hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {/* Type badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${isOpening ? 'bg-orange-100 text-orange-700' :
                isSpecial ? 'bg-purple-100 text-purple-700' :
                'bg-indigo-100 text-indigo-700'}`}>
              {isOpening ? '◯ Opening' : isSpecial ? '★ Special' : '● Closing'}
            </span>
            {/* Lens badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lens.badge}`}>
              {lens.label}
            </span>
            {/* Flavor badge */}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full
              ${FLAVOR_BADGES[circle.flavor] || 'bg-gray-100 text-gray-600'}`}>
              {FLAVOR_LABELS[circle.flavor] || circle.flavor}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-700 leading-snug">
            {circle.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{circle.purpose}</p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400">{circle.duration_min} min</span>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  )
}

// ─── CIRCLE DETAIL MODAL ──────────────────────────────────────────────────────

function CircleModal({ circle, onClose }) {
  const lens = LENS_CONFIG[circle.lens] || LENS_CONFIG.any
  const isOpening = circle.circle_type === 'opening'
  const isSpecial = circle.circle_type === 'special'
  const prompts = Array.isArray(circle.discussion_prompts)
    ? circle.discussion_prompts
    : (typeof circle.discussion_prompts === 'string'
        ? JSON.parse(circle.discussion_prompts)
        : [])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh]
          rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 px-5 pt-5 pb-4 border-b ${lens.header} border-opacity-60`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                  ${isOpening ? 'bg-orange-100 text-orange-700' :
                    isSpecial ? 'bg-purple-100 text-purple-700' :
                    'bg-indigo-100 text-indigo-700'}`}>
                  {isOpening ? '◯ Opening' : isSpecial ? '★ Special' : '● Closing'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${lens.badge}`}>
                  {lens.label}
                </span>
                <span className="text-xs text-gray-500">{circle.duration_min} min</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{circle.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{circle.purpose}</p>
            </div>
            <button onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 text-gray-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-6">
          {/* Opening question */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center
                ${isOpening ? 'bg-orange-100' : isSpecial ? 'bg-purple-100' : 'bg-indigo-100'}`}>
                <div className={`w-2 h-2 rounded-full
                  ${isOpening ? 'bg-orange-500' : isSpecial ? 'bg-purple-500' : 'bg-indigo-500'}`} />
              </div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Opening Question
              </h3>
            </div>
            <p className="text-base text-gray-900 leading-relaxed font-medium italic">
              "{circle.opening_question}"
            </p>
          </div>

          {/* Discussion prompts */}
          {prompts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Discussion Prompts
                </h3>
              </div>
              <div className="space-y-3">
                {prompts.map((p, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100
                      flex items-center justify-center mt-0.5">
                      <span className="text-xs text-gray-500 font-medium">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Landing question */}
          <div className={`rounded-xl p-4 ${lens.header} border`}>
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-4 h-4 ${lens.accent}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Landing Question
              </h3>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">
              {circle.landing_question}
            </p>
          </div>

          {/* Facilitation notes */}
          {circle.facilitation_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Facilitation Notes
                </h3>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">
                {circle.facilitation_notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LIBRARY VIEW ─────────────────────────────────────────────────────────────

function LibraryView({ circles, onSelect }) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [lensFilter, setLensFilter] = useState('all')

  const filtered = circles.filter(c => {
    if (typeFilter !== 'all' && c.circle_type !== typeFilter) return false
    if (lensFilter !== 'all' && c.lens !== lensFilter) return false
    return true
  })

  // Group by lens then type for display
  const lenses = lensFilter === 'all'
    ? ['inner', 'community', 'world', 'any']
    : [lensFilter]

  const types = typeFilter === 'all' ? ['opening', 'closing', 'special'] : [typeFilter]

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[['all','All'], ['opening','Opening'], ['closing','Closing'], ['special','Special']].map(([v, l]) => (
            <button key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${typeFilter === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {[['all','All Lenses'], ['inner','Inside Us'], ['community','Outside Us'], ['world','Beyond Us'], ['any','Special']].map(([v, l]) => (
            <button key={v}
              onClick={() => setLensFilter(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${lensFilter === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} circle{filtered.length !== 1 ? 's' : ''}
        {lensFilter !== 'all' || typeFilter !== 'all' ? ' (filtered)' : ' in the library'}
      </p>

      {/* Grid by lens */}
      {lenses.map(lens => {
        const lensCircles = filtered.filter(c => c.lens === lens)
        if (lensCircles.length === 0) return null
        const cfg = LENS_CONFIG[lens]
        return (
          <div key={lens} className="mb-8">
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-3 ${cfg.header} border`}>
              <span className={cfg.accent}>{cfg.icon}</span>
              <div>
                <h2 className="text-sm font-bold text-gray-800">{cfg.label}</h2>
                <p className="text-xs text-gray-600">{cfg.desc}</p>
              </div>
            </div>
            {types.map(type => {
              const typeCircles = lensCircles.filter(c => c.circle_type === type)
              if (typeCircles.length === 0) return null
              return (
                <div key={type} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 ml-1">
                    {type === 'opening' ? '◯ Opening' : type === 'special' ? '★ Special' : '● Closing'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {typeCircles
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(c => (
                        <CircleCard key={c.id} circle={c} onClick={onSelect} />
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No circles match this filter.</p>
        </div>
      )}
    </div>
  )
}

// ─── PHASE 1 WEEKLY GUIDE ─────────────────────────────────────────────────────

function PhaseGuideView({ circles, onSelect }) {
  const [openWeek, setOpenWeek] = useState(1)

  // Build lookup by title for featured circles
  const byTitle = {}
  circles.forEach(c => { byTitle[c.title] = c })

  return (
    <div>
      {/* Phase intro */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-gray-800 mb-1">Phase 1: Guided Circles (First Cycle)</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          In the first cycle, circles are pre-designed for you. Each week has a theme, a required
          balance across the Three Lenses, and a set of featured circles to pick from. You choose
          which circle to run each day based on the mood of the group — but by the end of each week
          you should have covered the required mix.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-medium">
            ◯ Opening — minimum 45 min
          </span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-medium">
            ● Closing — minimum 30 min
          </span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md font-medium">
            ★ Special — as needed
          </span>
        </div>
      </div>

      {/* Phase 2/3 preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-800">After Week 8 — You Start Designing</p>
            <p className="text-sm text-blue-700 mt-1 leading-relaxed">
              From the second cycle onwards, you use the full library to plan your own weekly circles.
              Phase 2: choose circles from a menu, adapt them for your context.
              Phase 3: design circles from scratch using the Three Lenses framework.
              The library stays your reference — it doesn't go away.
            </p>
          </div>
        </div>
      </div>

      {/* Week cards */}
      <div className="space-y-3">
        {PHASE1_WEEKS.map(week => {
          const isOpen = openWeek === week.week
          const featuredCircles = week.featured_titles
            .map(t => byTitle[t])
            .filter(Boolean)

          return (
            <div key={week.week}
              className={`border rounded-xl overflow-hidden transition-all
                ${isOpen ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}>
              <button
                onClick={() => setOpenWeek(isOpen ? null : week.week)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-navy text-white text-xs font-bold
                    flex items-center justify-center flex-shrink-0">
                    {week.week}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{week.theme}</p>
                    <p className="text-xs text-gray-500">Week {week.week} of 8</p>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0
                  ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                  {/* Lens requirements */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-orange-700 mb-1">◯ Opening circles</p>
                      <p className="text-xs text-orange-900">{week.opening_spec}</p>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-indigo-700 mb-1">● Closing circles</p>
                      <p className="text-xs text-indigo-900">{week.closing_spec}</p>
                    </div>
                  </div>

                  {/* Facilitation notes */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-amber-700 mb-1">This week's focus</p>
                    <p className="text-xs text-amber-900 leading-relaxed">{week.notes}</p>
                  </div>

                  {/* Featured circles */}
                  {featuredCircles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Featured this week
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {featuredCircles.map(c => (
                          <CircleCard key={c.id} circle={c} onClick={onSelect} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── RECORDING PROTOCOL BANNER ────────────────────────────────────────────────

function RecordingBanner() {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-teal-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span className="text-sm font-semibold text-teal-800">The Recording Commitment</span>
        </div>
        <svg className={`w-4 h-4 text-teal-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-teal-200 pt-3">
          <p className="text-sm text-teal-900 leading-relaxed mb-3">
            Before recording any circle, ask clearly:
          </p>
          <div className="bg-white border border-teal-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-800 italic leading-relaxed">
              "I'd like to record today's circle so we can look back at our conversations over time.
              The recording stays within this group and won't be shared outside it. If you'd prefer
              not to be recorded today, just let me know — no reason needed. And if anything we
              discuss feels too personal after we're done, you can ask me to delete that part."
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-teal-800 font-medium">Key rules:</p>
            {[
              'A single "no" or hesitation stops the recording. No pressure, no negotiation.',
              'Purpose: the group\'s own memory of its intellectual life — not evaluation or evidence.',
              'Listen back together occasionally to witness how the group has moved over time.',
              'The Season Circle (start and end of cycle) is the one most worth preserving.',
            ].map((rule, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-teal-500 text-xs mt-0.5">→</span>
                <p className="text-xs text-teal-800 leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function CirclesPage() {
  const { userAccess } = useContext(AuthContext)
  const [tab, setTab] = useState('guide')
  const [circles, setCircles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    supabase
      .from('circles')
      .select('*')
      .order('display_order')
      .then(({ data, error }) => {
        if (!error && data) setCircles(data)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 flex justify-center"><LoadingSpinner /></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* Page header */}
        <div className="mb-6 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Discussion Circles</h1>
              <p className="text-sm text-gray-500">The daily practice of the Nook</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
            Every day at the Nook begins and ends in a circle. Not a procedure — a practice.
            Circles are organized across three lenses: <span className="font-medium text-amber-700">Inside Us</span>,{' '}
            <span className="font-medium text-emerald-700">Outside Us</span>, and{' '}
            <span className="font-medium text-blue-700">Beyond Us</span>.
          </p>
        </div>

        {/* Recording commitment */}
        <RecordingBanner />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {[['guide', 'Phase 1 Weekly Guide'], ['library', 'Full Circle Library']].map(([v, l]) => (
            <button key={v}
              onClick={() => setTab(v)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${tab === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'guide'
          ? <PhaseGuideView circles={circles} onSelect={setSelected} />
          : <LibraryView circles={circles} onSelect={setSelected} />
        }
      </main>

      {/* Modal */}
      {selected && <CircleModal circle={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
