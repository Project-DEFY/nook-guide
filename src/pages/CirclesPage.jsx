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
  reflection:          'bg-gray-100 text-gray-600',
  debate:              'bg-orange-100 text-orange-700',
  vulnerability:       'bg-rose-100 text-rose-700',
  analysis:            'bg-sky-100 text-sky-700',
  problem_solving:     'bg-emerald-100 text-emerald-700',
  acknowledgment:      'bg-amber-100 text-amber-700',
  imagination:         'bg-violet-100 text-violet-700',
  conflict_resolution: 'bg-red-100 text-red-700',
  renewal:             'bg-teal-100 text-teal-700',
  celebration:         'bg-yellow-100 text-yellow-700',
  // Inquiry flavors
  scientific_inquiry:  'bg-cyan-100 text-cyan-700',
  historical_inquiry:  'bg-amber-100 text-amber-800',
  literary:            'bg-pink-100 text-pink-700',
  philosophical:       'bg-violet-100 text-violet-700',
}

const FLAVOR_LABELS = {
  reflection: 'Reflection', debate: 'Debate', vulnerability: 'Vulnerability',
  analysis: 'Analysis', problem_solving: 'Problem-Solving', acknowledgment: 'Acknowledgment',
  imagination: 'Imagination', conflict_resolution: 'Conflict Resolution',
  renewal: 'Renewal', celebration: 'Celebration',
  scientific_inquiry: 'Science', historical_inquiry: 'History',
  literary: 'Literary', philosophical: 'Philosophy',
}

const MODE_CONFIG = {
  reflective: {
    label: 'Reflective',
    badge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    desc: 'Personal experience and shared feeling — you bring what you carry.',
  },
  inquiry: {
    label: 'Inquiry',
    badge: 'bg-teal-50 text-teal-700 border border-teal-200',
    desc: 'Collective exploration of a question, topic, poem, or idea — the fellow comes prepared.',
  },
}

// Phase 1 weekly prescription — 8 weeks
const PHASE1_WEEKS = [
  {
    week: 1,
    theme: 'First Steps — Building Trust',
    opening_spec: '2 Reflective + 2 Inquiry',
    closing_spec: '5 Reflective (Inner + Community)',
    notes: 'Start with personal story for reflective openings — trust must be built before the group can think structurally together. The two inquiry openings this week should be gentle entry points: stars, stories, music. Inquiry circles in Week 1 are invitations to wonder, not deep analysis.',
    featured_titles: [
      'Not What You Do, But What You Carry',
      'Where I Come From and What I Carry',
      'Why Do Stars Twinkle?',
      'What Is a Story For?',
      'Carry and Release',
      'Thank Someone in the Room',
    ],
  },
  {
    week: 2,
    theme: 'Finding Your Voice',
    opening_spec: '2 Reflective + 2 Inquiry',
    closing_spec: '5 Reflective (Inner + Community)',
    notes: 'Reflective circles this week should push toward voice and honesty. Inquiry circles can move into language, music, and memory — subjects with personal resonance. The group is still finding its footing; choose inquiry topics that feel close to daily experience.',
    featured_titles: [
      'What Makes This Hard',
      'What I Know That I Wasn\'t Taught',
      'Words That Don\'t Exist in Your Language',
      'Where Do Songs Come From?',
      'What We Witnessed',
      'One True Thing',
    ],
  },
  {
    week: 3,
    theme: 'Community as Text',
    opening_spec: '1 Reflective + 3 Inquiry',
    closing_spec: '5 Reflective (Community + World)',
    notes: 'Shift the balance toward inquiry this week — the Nook\'s external context becomes the subject. Inquiry circles about community, writing, and everyday history pull the group outward. Reflective closing circles should connect what was learned to personal experience.',
    featured_titles: [
      'The Problem That Has No Name',
      'Who Invented Writing, and Why?',
      'What Was Life Like 500 Years Ago?',
      'How Did Languages Spread?',
      'The Gift Your Community Gives',
      'The Unseen Work',
    ],
  },
  {
    week: 4,
    theme: 'Systems and Power',
    opening_spec: '1 Reflective + 3–4 Inquiry',
    closing_spec: '5 Reflective (Inner + World)',
    notes: 'This is the week to go fully into structural thinking. Inquiry openings about empire, indigenous knowledge, and democracy are natural here. The reflective closing circles keep the analysis grounded in lived experience — the group should leave each day feeling something, not just knowing something.',
    featured_titles: [
      'Why Do Empires Fall?',
      'What Happened to Indigenous Knowledge?',
      'What If We Always Had Democracy?',
      'Crisis Mapping',
      'The Story of Power',
      'What Do We Owe?',
    ],
  },
  {
    week: 5,
    theme: 'Going Deeper',
    opening_spec: '2 Reflective + 2 Inquiry',
    closing_spec: '5 Reflective (Inner + Community)',
    notes: 'Return to balance after a heavy inquiry week. Vulnerability circles (The Question I\'ve Been Avoiding, Softness) can now go deeper — the group has history. Inquiry circles this week should be ones that invite wonder and personal connection: memory, dreams, time.',
    featured_titles: [
      'The Question I\'ve Been Avoiding',
      'How Does Memory Work?',
      'Why Do We Dream?',
      'Is Time Real?',
      'Softness',
      'What I Needed and Didn\'t Say',
    ],
  },
  {
    week: 6,
    theme: 'Our Work in the World',
    opening_spec: '1 Reflective + 3 Inquiry',
    closing_spec: '5 Reflective (Community + World)',
    notes: 'Connect the Nook\'s work to larger questions. Inquiry circles about ecology, physics, and obligation pair well with reflective circles about what the group is building. A good week for a Project Circle (special) if a decision point has arrived.',
    featured_titles: [
      'How Do Trees Talk to Each Other?',
      'What Is Light Made Of?',
      'What Do We Owe Strangers?',
      'The Future We\'re Building',
      'Climate and Us',
      'Beauty and Resilience',
    ],
  },
  {
    week: 7,
    theme: 'Reflection and Design',
    opening_spec: '2 Reflective + 2 Inquiry',
    closing_spec: '5 Reflective (Inner + Community)',
    notes: 'The cycle is moving toward its end. Reflective circles should invite the group to look back at how they\'ve changed. Inquiry circles — poems, language, infinity — create space for wonder as the cycle winds down. Good week to run "What I Want to Become" as a reflective opening.',
    featured_titles: [
      'What I Want to Become',
      'Reading a Poem Together',
      'What Came Before Language?',
      'What Is Infinity?',
      'The Long Game',
      'Who Are We Missing?',
    ],
  },
  {
    week: 8,
    theme: 'Closing the Cycle',
    opening_spec: '2 Reflective + 2 Inquiry',
    closing_spec: '5 Reflective + Season Circle (final day)',
    notes: 'End the cycle intentionally. The Season Circle (closing flavor) runs on the final day — record it if the group consents. Inquiry openings this week should be ones that feel like completion: What Is a Story For?, What Came Before Language? The group should feel the weight of what this cycle was. From Week 9, builders begin designing their own circles.',
    featured_titles: [
      'What Is a Story For?',
      'What Came Before Language?',
      'The Problem I\'ve Carried',
      'A Story of Solidarity',
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
            {/* Mode badge */}
            {circle.circle_mode === 'inquiry' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full
                bg-teal-50 text-teal-700 border border-teal-200">
                ◈ Inquiry
              </span>
            )}
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
  const [modeFilter, setModeFilter] = useState('all')

  const filtered = circles.filter(c => {
    if (typeFilter !== 'all' && c.circle_type !== typeFilter) return false
    if (lensFilter !== 'all' && c.lens !== lensFilter) return false
    if (modeFilter !== 'all' && c.circle_mode !== modeFilter) return false
    return true
  })

  const lenses = lensFilter === 'all'
    ? ['inner', 'community', 'world', 'any']
    : [lensFilter]

  const types = typeFilter === 'all' ? ['opening', 'closing', 'special'] : [typeFilter]

  return (
    <div>
      {/* Mode toggle — prominent at top */}
      <div className="flex gap-2 mb-4">
        {[
          ['all', 'All Circles', 'bg-gray-100'],
          ['reflective', '◎ Reflective', 'bg-indigo-50 border border-indigo-200'],
          ['inquiry', '◈ Inquiry', 'bg-teal-50 border border-teal-200'],
        ].map(([v, l, active]) => (
          <button key={v}
            onClick={() => setModeFilter(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${modeFilter === v
                ? (v === 'inquiry' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                   v === 'reflective' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' :
                   'bg-gray-200 text-gray-800')
                : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Inquiry mode explainer */}
      {modeFilter === 'inquiry' && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-5">
          <p className="text-sm text-teal-800 leading-relaxed">
            <span className="font-semibold">Inquiry circles</span> are opening circles where the group
            thinks through a question, poem, or idea together. The fellow comes prepared with a fact,
            image, or artifact to introduce. Nobody needs to know the answer — the discovery is collective.
            All inquiry circles are <span className="font-medium">opening type only</span>.
          </p>
        </div>
      )}

      {/* Secondary filters */}
      <div className="flex flex-wrap gap-3 mb-5">
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
          {[['all','All Lenses'], ['inner','Inside Us'], ['community','Outside Us'], ['world','Beyond Us'], ['any','Any']].map(([v, l]) => (
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
        {lensFilter !== 'all' || typeFilter !== 'all' || modeFilter !== 'all' ? ' (filtered)' : ' in the library'}
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
          In the first cycle, circles are pre-designed for you. Each week has a theme, a
          prescribed balance of Reflective and Inquiry openings, and featured circles to pick from.
          You choose which to run each day based on the mood of the group — but by the end of each
          week you should have covered the required mix.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded-md font-medium">
            ◈ Inquiry opening — fellow comes prepared
          </span>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md font-medium">
            ◎ Reflective opening — personal sharing
          </span>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-medium">
            ● Closing — always reflective, 30 min+
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
                  {/* Circle prescription */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-700">◯ Opening circles</p>
                      {week.opening_spec.split('+').map((part, i) => {
                        const p = part.trim()
                        const isInquiry = p.toLowerCase().includes('inquiry')
                        return (
                          <span key={i} className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-1
                            ${isInquiry
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                            {isInquiry ? '◈' : '◎'} {p}
                          </span>
                        )
                      })}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">● Closing circles</p>
                      <p className="text-xs text-gray-600">{week.closing_spec}</p>
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

// ─── DESIGN YOUR OWN CIRCLE ───────────────────────────────────────────────────

const ANATOMY = [
  { step: '1', label: 'Title', desc: 'A name that captures the spirit of the inquiry — not the topic.' },
  { step: '2', label: 'Lens', desc: 'Which of the three lenses anchors this circle? Inner, Community, or World.' },
  { step: '3', label: 'Opening question', desc: 'One specific, personal question that opens the inquiry. The hardest part to get right.' },
  { step: '4', label: 'Discussion prompts', desc: '2–4 follow-up questions that deepen or turn the conversation. Not leading — widening.' },
  { step: '5', label: 'Landing question', desc: 'A final question that helps the group carry something forward. Often quiet and integrative.' },
]

const GOOD_VS_BAD = [
  {
    topic: 'Goals and aspiration',
    lens: 'inner',
    bad: {
      title: 'What are your goals?',
      question: '"What are your goals for this year?"',
      why: [
        'Invites performance, not honesty',
        'Most people say what sounds good, not what is true',
        'The word "goals" triggers anxiety and defensiveness',
        'No one is specific — answers float in the abstract',
      ],
    },
    good: {
      title: 'What I Want to Become',
      question: '"What is one thing you want to become — not a job or an achievement, but a quality of person — that you have never said out loud?"',
      why: [
        'Specific and personal — it asks for something private, not performed',
        '"Never said out loud" creates safety and invites honesty',
        '"Quality of person" shifts away from productivity and toward identity',
        'The constraint (one thing) prevents deflection',
      ],
    },
  },
  {
    topic: 'Community problems',
    lens: 'world',
    bad: {
      title: 'What problems exist in our community?',
      question: '"What problems exist in our community, and how can we help?"',
      why: [
        '"Problems" and "how can we help" collapses inquiry into solution mode immediately',
        'Produces lists of familiar grievances, not real thinking',
        '"We can help" assumes the group is outside the problem',
        'Nothing in this question creates discomfort — and circles need a little discomfort',
      ],
    },
    good: {
      title: 'Crisis Mapping',
      question: '"Name one crisis happening in your community right now that most people are pretending isn\'t there."',
      why: [
        '"Pretending isn\'t there" forces honesty — people must name the unspeakable',
        'Specific: one crisis, not a list',
        'Creates discomfort productively — it asks for courage, not solutions',
        'Positions the group as insiders to the community, not helpers looking in',
      ],
    },
  },
  {
    topic: 'Emotional check-in',
    lens: 'inner',
    bad: {
      title: 'How is everyone feeling?',
      question: '"How are you feeling today? Is everyone okay?"',
      why: [
        '"Is everyone okay?" signals you want them to say yes',
        'Most people answer with "good" or "fine" — the check-in becomes a formality',
        'There is no real question here — just a request for reassurance',
        'It closes down honesty instead of opening it',
      ],
    },
    good: {
      title: 'Carry and Release',
      question: '"What is one thing you have been carrying this week that you haven\'t set down yet?"',
      why: [
        '"Carrying" is a concrete image — it makes the emotional physical and safe to name',
        '"Haven\'t set down yet" implies it\'s okay to still be holding it',
        'Creates genuine emotional presence without asking "are you sad?"',
        'Everyone has something — no one has to perform wellness',
      ],
    },
  },
]

const CIRCLE_TRAPS = [
  {
    trap: 'The abstract question',
    example: '"What does justice mean to you?"',
    fix: 'Anchor it in the personal and specific. "Tell us about a time you saw something unjust and stayed quiet. What stopped you?"',
  },
  {
    trap: 'The leading question',
    example: '"Don\'t you think we should be doing more for our community?"',
    fix: 'Remove your opinion from the question entirely. A circle question opens space — it doesn\'t push toward an answer.',
  },
  {
    trap: 'The multi-part question',
    example: '"What is your goal, why is it important, and how will you achieve it?"',
    fix: 'One question only. Let it land. Discussion prompts can open the later parts.',
  },
  {
    trap: 'The homework question',
    example: '"Research a local NGO and tell us what they do."',
    fix: 'Circle questions ask for what people already carry — their experience, their feeling, their memory. No preparation required.',
  },
  {
    trap: 'The comfort question',
    example: '"Share something positive that happened this week."',
    fix: 'Positive-only questions close down honesty. A circle holds all of it — the good and the hard. Design for truth, not warmth.',
  },
]

function DesignView() {
  const [openTrap, setOpenTrap] = useState(null)
  const [cardData, setCardData] = useState({
    title: '', lens: '', opening: '', prompts: ['', '', ''], landing: '', notes: '',
  })

  return (
    <div className="space-y-8">

      {/* Intro */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-base font-bold text-amber-900 mb-2">
          Designing Your Own Circle
        </h2>
        <p className="text-sm text-amber-800 leading-relaxed">
          From Week 9 — your second cycle — you begin designing circles yourself.
          This is not a free-for-all. A well-designed circle has a specific anatomy,
          and the hardest part is the opening question. This section shows you how to build one,
          what to avoid, and what the difference between a weak circle and a strong one actually looks like.
        </p>
      </div>

      {/* Anatomy */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">The Anatomy of a Circle</h2>
        <div className="space-y-2">
          {ANATOMY.map(a => (
            <div key={a.step} className="flex gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-bold
                flex items-center justify-center flex-shrink-0 mt-0.5">
                {a.step}
              </span>
              <div>
                <span className="text-sm font-semibold text-gray-900">{a.label}</span>
                <span className="text-sm text-gray-500 ml-2">{a.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Good vs Bad examples */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide">
          Good vs Bad — What the Difference Looks Like
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Three topics, each designed two ways. The difference is almost always in the opening question.
        </p>
        <div className="space-y-5">
          {GOOD_VS_BAD.map((ex, i) => {
            const lens = LENS_CONFIG[ex.lens]
            return (
              <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Topic header */}
                <div className={`px-4 py-3 border-b flex items-center gap-2 ${lens.header}`}>
                  <span className={`text-xs font-bold uppercase tracking-wide ${lens.accent}`}>
                    Topic: {ex.topic}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lens.badge}`}>
                    {lens.label}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  {/* Bad */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 text-xs font-bold">✕</span>
                      </span>
                      <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Weak Circle</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">{ex.bad.title}</p>
                    <p className="text-xs text-gray-500 italic mb-3">{ex.bad.question}</p>
                    <div className="space-y-1.5">
                      {ex.bad.why.map((w, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="text-red-400 text-xs mt-0.5 flex-shrink-0">→</span>
                          <p className="text-xs text-gray-600 leading-relaxed">{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Good */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 text-xs font-bold">✓</span>
                      </span>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Strong Circle</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1">{ex.good.title}</p>
                    <p className="text-xs text-gray-500 italic mb-3">{ex.good.question}</p>
                    <div className="space-y-1.5">
                      {ex.good.why.map((w, j) => (
                        <div key={j} className="flex gap-2">
                          <span className="text-emerald-500 text-xs mt-0.5 flex-shrink-0">→</span>
                          <p className="text-xs text-gray-600 leading-relaxed">{w}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Common traps */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide">
          5 Things That Break a Circle
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Tap each trap to see what to do instead.
        </p>
        <div className="space-y-2">
          {CIRCLE_TRAPS.map((t, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenTrap(openTrap === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 text-xs font-bold">!</span>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.trap}</p>
                    <p className="text-xs text-gray-400 italic mt-0.5">{t.example}</p>
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0
                  ${openTrap === i ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openTrap === i && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium mb-1">Instead:</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{t.fix}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Design Card */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide">
          Circle Design Card
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Draft your circle here before running it. Get feedback from your co-fellow first.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Circle title</label>
              <input
                value={cardData.title}
                onChange={e => setCardData(d => ({ ...d, title: e.target.value }))}
                placeholder="e.g. What I Needed to Hear"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lens</label>
              <select
                value={cardData.lens}
                onChange={e => setCardData(d => ({ ...d, lens: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                  focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 bg-white"
              >
                <option value="">Choose a lens…</option>
                <option value="inner">Inside Us (personal / internal)</option>
                <option value="community">Outside Us (community / relational)</option>
                <option value="world">Beyond Us (systems / structural)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Opening question</label>
            <textarea
              value={cardData.opening}
              onChange={e => setCardData(d => ({ ...d, opening: e.target.value }))}
              rows={2}
              placeholder="One specific, personal question. Make it impossible to answer with one word."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Discussion prompts <span className="text-gray-400 font-normal">(2–4)</span>
            </label>
            <div className="space-y-2">
              {cardData.prompts.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={e => {
                    const updated = [...cardData.prompts]
                    updated[i] = e.target.value
                    setCardData(d => ({ ...d, prompts: updated }))
                  }}
                  placeholder={`Prompt ${i + 1}`}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                    focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Landing question</label>
            <textarea
              value={cardData.landing}
              onChange={e => setCardData(d => ({ ...d, landing: e.target.value }))}
              rows={2}
              placeholder="What does the group carry forward? Often quieter and more integrative than the opener."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Facilitation notes</label>
            <textarea
              value={cardData.notes}
              onChange={e => setCardData(d => ({ ...d, notes: e.target.value }))}
              rows={2}
              placeholder="What might come up? What should the host watch for? Any timing notes."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2
                focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none"
            />
          </div>

          {/* Preview card */}
          {(cardData.title || cardData.opening) && (
            <div className={`border rounded-xl p-4 mt-2
              ${cardData.lens ? LENS_CONFIG[cardData.lens]?.header : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Preview</p>
              {cardData.title && (
                <p className="text-base font-bold text-gray-900 mb-1">{cardData.title}</p>
              )}
              {cardData.lens && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${LENS_CONFIG[cardData.lens]?.badge} inline-block mb-3`}>
                  {LENS_CONFIG[cardData.lens]?.label}
                </span>
              )}
              {cardData.opening && (
                <p className="text-sm text-gray-700 italic">"{cardData.opening}"</p>
              )}
            </div>
          )}
        </div>
      </div>

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
                <circle cx="12" cy="12" r="8" strokeWidth={1.5} />
                <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
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
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit">
          {[
            ['guide', 'Phase 1 Weekly Guide'],
            ['library', 'Full Circle Library'],
            ['design', 'Design Your Own'],
          ].map(([v, l]) => (
            <button key={v}
              onClick={() => setTab(v)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${tab === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'guide' && <PhaseGuideView circles={circles} onSelect={setSelected} />}
        {tab === 'library' && <LibraryView circles={circles} onSelect={setSelected} />}
        {tab === 'design' && <DesignView />}
      </main>

      {/* Modal */}
      {selected && <CircleModal circle={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
