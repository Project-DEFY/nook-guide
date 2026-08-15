/**
 * SOP Roadmap — a visual lifecycle map for all 30 Nook SOPs.
 *
 * Shows three lifecycle states per SOP:
 *   🟢 Introduced   — the first time this SOP is practiced
 *   🟡 Active Practice check — the moment to verify the Fellow is doing it consciously
 *   🔵 Routine check — the moment to verify it has become second nature
 *
 * Future: tie check moments into the Grounding system so that, at the right week/cycle,
 * a check-in prompt surfaces automatically for the Fellow to self-report whether the SOP
 * has become active practice / routine. The data model would be:
 *   sop_lifecycle_checks (sop_num, fellow_id, state, check_week, response, checked_at)
 * This page would then highlight "due now" checks and show Fellow history.
 */

import { useState, useContext, useRef } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import { AuthContext } from '../App'

// ─── TIMELINE BANDS ───────────────────────────────────────────────────────────
// Seven time bands covering Phase 1 through Cycle 4+.
// Each SOP state (intro / apCheck / routine) maps to one of these bands.

const BANDS = [
  { id: 'p1',  label: 'Phase 1',  sub: '12 wks',   color: '#059669', light: '#d1fae5' },
  { id: 'c1a', label: 'Cycle 1',  sub: 'Wk 1–8',   color: '#7C3AED', light: '#ede9fe' },
  { id: 'c1b', label: 'Cycle 1',  sub: 'Wk 9–16',  color: '#7C3AED', light: '#ede9fe' },
  { id: 'c1c', label: 'Cycle 1',  sub: 'Wk 17–24', color: '#7C3AED', light: '#ede9fe' },
  { id: 'c2',  label: 'Cycle 2',  sub: '24 wks',   color: '#2563EB', light: '#dbeafe' },
  { id: 'c3',  label: 'Cycle 3',  sub: '24 wks',   color: '#D97706', light: '#fef3c7' },
  { id: 'c4',  label: 'Cycle 4+', sub: 'Year 3+',  color: '#E11D48', light: '#ffe4e6' },
]

const BAND_INDEX = BANDS.reduce((acc, b, i) => ({ ...acc, [b.id]: i }), {})

function cycleNumToBand(n) {
  if (!n || n < 1) return 'p1'
  if (n === 1) return 'c1a'
  if (n === 2) return 'c2'
  if (n === 3) return 'c3'
  return 'c4'
}

// ─── SOP SECTIONS ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 's0', label: 'Phase 1 — New Nook Setup',    tag: null,         note: 'Applies only when establishing a brand-new Nook. Fellows joining an existing Nook begin at Cycle 1.' },
  { id: 's1', label: 'Community Activation',        tag: 'SOPs 1–3',   note: null },
  { id: 's2', label: 'Learning Cycle Design',       tag: 'SOPs 4–8',   note: null },
  { id: 's3', label: 'Institutional Operations',    tag: 'SOPs 9–13',  note: null },
  { id: 's4', label: 'Learning Quality & Culture',  tag: 'SOPs 14–19', note: null },
  { id: 's5', label: 'V2.1 New Additions',          tag: 'SOPs 20–24', note: null },
]

// ─── SOP DATA ─────────────────────────────────────────────────────────────────
// Each SOP has: num, title, section, lead (CF/IF), pageId (guide section link),
// intro, apCheck, routine — each with { band, label } or null.

const SOPS = [
  // ── Phase 1 SOPs ─────────────────────────────────────────────────────────
  { num: '0.0', title: 'Community Baseline', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Week 1 — begin building People Map and field notes' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 8 coaching call — Is the People Map growing? Are field notes being kept?' },
    routine: { band: 'p1',  label: 'Phase 1, Week 12 Readiness Check — Is the full Community Baseline Package complete?', oneTime: true },
  },
  { num: '0.1', title: 'Presence & Making Log', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Day 1 — both logs start immediately' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 4 coaching call — Are both logs filled consistently without being chased?' },
    routine: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — No reminders needed; it\'s just how the week ends' },
  },
  { num: '0.2', title: 'Community Mapping', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Week 1' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 6 coaching call — Is the map actively growing, or stalled at initial contacts?' },
    routine: { band: 'c1b', label: 'Cycle 1, Week 12 coaching call — CF adds new people naturally, not as a task' },
  },
  { num: '0.3', title: 'Knowledge Reversal Visits', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Week 5 — after initial presence-building' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 8 coaching call — Has at least one visit happened? Was CF genuinely in learning mode?' },
    routine: { band: 'c2',  label: 'Cycle 2, Week 4 coaching call — Visits are a standing part of the CF\'s weekly rhythm' },
  },
  { num: '0.4', title: 'Community Conversations', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Week 10' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 12 Readiness Check — Did the conversation happen? Are notes documented?' },
    routine: null, // one-time milestone
  },
  { num: '0.5', title: 'Readiness Check', section: 's0', lead: 'CF', pageId: null,
    intro:   { band: 'p1',  label: 'Phase 1, Week 12 — the gate before Cycle 1' },
    apCheck: null, // it IS the check
    routine: null, // gate; not an ongoing practice
  },

  // ── Community Activation ─────────────────────────────────────────────────
  { num: '1', title: 'Outreach & Learner Onboarding', section: 's1', lead: 'CF',
    pageId: '379fef71-1233-81ed-b305-c1255b7d75cc',
    intro:   { band: 'p1',  label: 'Phase 1, Week 10 — Fellows identify potential learners 6–8 weeks before Cycle 1' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Is outreach relational and community-grounded, not transactional?' },
    routine: { band: 'c2',  label: 'Pre-Cycle 2 setup call — Are Fellows planning the next round without prompting?' },
  },
  { num: '1a', title: 'Cycle Start Bootcamp', section: 's1', lead: 'IF',
    pageId: '379fef71-1233-81c0-969a-fb99abc3536b',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1, Day 1' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Did Bootcamp achieve identity shift, not just activity?' },
    routine: { band: 'c2',  label: 'Post-Cycle 2 consolidation — Fellows design Bootcamp independently, adapting without the SOP' },
  },
  { num: '1b', title: 'Orientation Day', section: 's1', lead: 'IF',
    pageId: '379fef71-1233-8148-86c0-cd07bf3cdc4b',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1, Day 4 — after Bootcamp' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Did learners understand commitments? Did Constitution begin forming with them?' },
    routine: { band: 'c3',  label: 'Pre-Cycle 3 setup call — Fellows run Orientation in their own voice, without guidance' },
  },
  { num: '2', title: 'Early Projects', section: 's1', lead: 'IF',
    pageId: '379fef71-1233-8108-8dc1-d27b0a395ea2',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 2' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 6 coaching call — Are projects tangible and fun? Making, not training?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Fellows calibrate project ideas naturally' },
  },
  { num: '3', title: 'Exploration Phase', section: 's1', lead: 'IF',
    pageId: '379fef71-1233-81a8-b4dd-cf4bba28e61e',
    intro:   { band: 'c1b', label: 'Cycle 1, Week 6 — after Early Projects' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 10 coaching call — Are 7 areas offered? Is the closure meeting planned intentionally?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Exploration menu is set; facilitation flows without SOP reference' },
  },

  // ── Learning Cycle Design ─────────────────────────────────────────────────
  { num: '4', title: 'Goal Setting', section: 's2', lead: 'IF',
    pageId: '379fef71-1233-81dc-8e06-e1791823d58f',
    intro:   { band: 'c1b', label: 'Cycle 1, Week 9 — after exploration closure meeting' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 12 coaching call — Are goals SMAART? Did the Inquiry Panel happen? Any goals too safe?' },
    routine: { band: 'c3',  label: 'End of Cycle 3 consolidation — Fellows run sharp Panels, catching weak goals instinctively' },
  },
  { num: '5', title: 'Cycle Rhythm & Daily Flow', section: 's2', lead: 'IF',
    pageId: '379fef71-1233-817c-9ef7-eb6591d1884f',
    intro:   { band: 'c1a', label: 'Cycle 1, Day 1' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Is the daily structure holding? Circles happening? Deep work protected?' },
    routine: { band: 'c2',  label: 'Pre-Cycle 2 setup call — Fellows maintain rhythm without reminders or nudges' },
  },
  { num: '6', title: 'Design Phase', section: 's2', lead: 'IF',
    pageId: '379fef71-1233-81b0-94bd-ddf23682c6d5',
    intro:   { band: 'c1b', label: 'Cycle 1, Week 11 — after goals are set' },
    apCheck: { band: 'c1c', label: 'Cycle 1, Week 16 coaching call — Are there real prototypes? Has user feedback been gathered from outside the Nook?' },
    routine: { band: 'c3',  label: 'End of Cycle 3 consolidation — Fellows expect multiple iterations as default; coach design without being prompted' },
  },
  { num: '7', title: 'Holding Vibe & Culture', section: 's2', lead: 'CF',
    pageId: '379fef71-1233-8195-bee7-fd01fa90d3ea',
    intro:   { band: 'p1',  label: 'Phase 1, Day 1' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 6 coaching call — Does the space feel like somewhere people want to be? Is the Fellow intentional about energy?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Vibe is maintained instinctively; not manufactured for visits or events' },
  },
  { num: '8', title: 'Exhibition & Learning Festival', section: 's2', lead: 'IF',
    pageId: '379fef71-1233-813d-bfe3-fe6edad234b1',
    intro:   { band: 'c1c', label: 'Cycle 1, Week 20 — planning begins' },
    apCheck: { band: 'c1c', label: 'Cycle 1, Week 22 — Is it a genuine learning showcase? Are incomplete and failed projects also shown?' },
    routine: { band: 'c2',  label: 'Post-Cycle 2 Exhibition — Fellows plan the next exhibition before DEFY raises it' },
  },

  // ── Institutional Operations ──────────────────────────────────────────────
  { num: '9', title: 'Daily Routine', section: 's3', lead: 'CF',
    pageId: '379fef71-1233-8134-b86a-dbc46f024de2',
    intro:   { band: 'p1',  label: 'Phase 1, Day 1' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 4 coaching call — Are circles happening every day? Is the rhythm holding on busy days?' },
    routine: { band: 'c1b', label: 'Cycle 1, Week 8 mid-cycle check — Daily structure runs without Fellows planning it each morning' },
  },
  { num: '10', title: 'Initial Rule Building', section: 's3', lead: 'CF',
    pageId: '379fef71-1233-81bb-b46f-db7997869eb0',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Is Constitution being built with learners, not for them? Any rules imposed?' },
    routine: { band: 'c2',  label: 'Pre-Cycle 2 setup call — Constitution review happens naturally at cycle start without prompting' },
  },
  { num: '11', title: 'Active Governance', section: 's3', lead: 'CF',
    pageId: '379fef71-1233-81fd-98c0-e4b5d5b946fe',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 2 — Stage 1: Constitution + first informal role' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 12 coaching call — Is the Constitution being used? Is Stage 1 governance functioning?' },
    routine: { band: 'c3',  label: 'End of Cycle 3 consolidation — Stage 2 governance running; community holds their own meetings without Fellow initiation' },
  },
  { num: '12', title: 'Tools Management & Space Upkeep', section: 's3', lead: 'CF',
    pageId: '379fef71-1233-81ba-84c8-eb446a993bbd',
    intro:   { band: 'p1',  label: 'Phase 1, Week 1' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 6 coaching call — Is space set up intentionally? Are tools accessible and cared for?' },
    routine: { band: 'c1b', label: 'Cycle 1, Week 12 mid-cycle check — Space maintenance is habit; no prompting needed' },
  },
  { num: '13', title: 'Nook Safety', section: 's3', lead: 'CF',
    pageId: '379fef71-1233-8166-b27f-e3f0998fdb68',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1, Orientation Day' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Do Fellows know the protocols? Was any early incident handled correctly?' },
    routine: { band: 'c2',  label: 'Cycle 2, Week 4 coaching call — Safety is background awareness; Fellows act on it without consulting the SOP' },
  },

  // ── Learning Quality & Culture ────────────────────────────────────────────
  { num: '14', title: 'Coaching & Consolidation', section: 's4', lead: 'CF',
    pageId: '379fef71-1233-8104-a942-db4661a81e7e',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 4 — first monthly coaching call' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 12 coaching call — Are Fellows preparing well? Bringing real questions, not just updates?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Fellows arrive with pattern-level observations; call needs no guidance structure' },
  },
  { num: '15', title: 'Fellow Reflection & Sensemaking', section: 's4', lead: 'CF',
    pageId: '379fef71-1233-813b-9228-e58e519c3995',
    intro:   { band: 'p1',  label: 'Phase 1, Week 1' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 8 coaching call — Are weekly reflections happening? Genuine sensemaking or just event descriptions?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Reflection flows without prompting; Fellows notice patterns independently' },
  },
  { num: '16', title: 'M&E System', section: 's4', lead: 'IF',
    pageId: '379fef71-1233-8189-ae1e-ebf04959875a',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1 — baseline forms begin immediately' },
    apCheck: { band: 'c1b', label: 'Cycle 1, Week 10 coaching call — Are all baseline and goal forms complete? Data filled in real time, not reconstructed?' },
    routine: { band: 'c3',  label: 'End of Cycle 3 consolidation — Fellows know what to fill and when, without checking the M&E calendar' },
  },
  { num: '17', title: 'Seasonal Routines', section: 's4', lead: 'CF',
    pageId: '379fef71-1233-81fb-aed9-d35245e6c391',
    intro:   { band: 'c2',  label: 'End of Cycle 2 — after first full year observed' },
    apCheck: { band: 'c3',  label: 'Cycle 3, Week 4 coaching call — Is the cycle deliberately shaped around seasonal and community rhythms?' },
    routine: { band: 'c4',  label: 'Pre-Cycle 5 setup call — Fellows naturally plan cycles around community rhythm without needing the SOP' },
  },
  { num: '18', title: 'Custom Routines', section: 's4', lead: 'CF',
    pageId: '379fef71-1233-81fb-aed9-d35245e6c391',
    intro:   { band: 'c2',  label: 'Cycle 2–3 — when organic community practices start emerging' },
    apCheck: { band: 'c3',  label: 'End of Cycle 3 consolidation — Have any community-specific practices been named and documented?' },
    routine: { band: 'c4',  label: 'End of Cycle 5 consolidation — Community practices are just part of how the Nook runs' },
  },
  { num: '19', title: 'Evolving Nook Processes', section: 's4', lead: 'CF',
    pageId: '379fef71-1233-81fb-aed9-d35245e6c391',
    intro:   { band: 'c1c', label: 'Cycle 1, Week 24 — first end-of-cycle review' },
    apCheck: { band: 'c2',  label: 'End of Cycle 2 — Are Fellows proposing changes based on observation? Is the Constitution being updated?' },
    routine: { band: 'c4',  label: 'End of Cycle 4 consolidation — Process evolution happens at every cycle close without DEFY initiating' },
  },

  // ── V2.1 New Additions ────────────────────────────────────────────────────
  { num: '20', title: 'Nook Fellow Lifecycle', section: 's5', lead: 'CF',
    pageId: '379fef71-1233-8168-b40b-ee6f1e075858',
    intro:   { band: 'p1',  label: 'Before Phase 1 — during Fellow induction week' },
    apCheck: { band: 'p1',  label: 'Phase 1, Week 4 coaching call — Are Fellows tracking their own development? Are wellbeing signals named, not suppressed?' },
    routine: { band: 'c2',  label: 'End of Cycle 2 consolidation — Fellows proactively flag wellbeing; transition planning enters the conversation' },
  },
  { num: '21', title: 'Financial Governance', section: 's5', lead: 'IF',
    pageId: '379fef71-1233-815b-b876-fb0e5b6a1249',
    intro:   { band: 'c1a', label: 'Cycle 1, Week 1, Day 1' },
    apCheck: { band: 'c1a', label: 'Cycle 1, Week 4 coaching call — Is co-signing happening for all expenses? First monthly budget submitted on time?' },
    routine: { band: 'c2',  label: 'Cycle 2, Week 4 coaching call — Financial rhythm is automatic; both Fellows co-sign without reminder' },
  },
  { num: '22', title: 'Exhibition Follow-Up', section: 's5', lead: 'CF',
    pageId: '379fef71-1233-817e-a0d4-f7d2f7b18335',
    intro:   { band: 'c1c', label: 'Cycle 1, Week 23 — immediately post-exhibition' },
    apCheck: { band: 'c1c', label: 'Cycle 1, Week 24 consolidation — Did the 48-hour follow-up happen? Commitments and contacts logged?' },
    routine: { band: 'c2',  label: 'Post-Cycle 2 Exhibition — Fellows plan follow-up before the exhibition, not scrambling after' },
  },
  { num: '23', title: 'Alumni Engagement', section: 's5', lead: 'CF',
    pageId: '379fef71-1233-8194-a693-f16b404e95df',
    intro:   { band: 'c2',  label: 'Pre-Cycle 2 — first alumni exist after Cycle 1 close' },
    apCheck: { band: 'c2',  label: 'Cycle 2, Week 4 coaching call — Have alumni been contacted? Any invited back informally? Register started?' },
    routine: { band: 'c4',  label: 'End of Cycle 4 consolidation — Alumni flow in and out naturally; no formal management needed' },
  },
  { num: '24', title: 'Peer Nook Exchange', section: 's5', lead: 'CF',
    pageId: '379fef71-1233-8147-ac3a-c131b1b85102',
    intro:   { band: 'c3',  label: 'Cycle 3 — DEFY schedules the first exchange; Nook participates' },
    apCheck: { band: 'c3',  label: 'During/after first exchange — Did Fellows prepare, participate, and bring something back?' },
    routine: { band: 'c4',  label: 'Pre-Cycle 5 setup call — Exchange is a calendar fixture; Fellows prepare independently' },
  },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SOPRoadmapPage() {
  const { userAccess } = useContext(AuthContext)
  const [view, setView] = useState('timeline')
  const currentBand = cycleNumToBand(userAccess?.current_cycle_number)
  const currentCycle = userAccess?.current_cycle_number || null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

          {/* Page header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-navy">SOP Roadmap</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                When each SOP enters a Fellow's practice — and when to check that it has taken root.
              </p>
            </div>
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1 self-start flex-shrink-0">
              <button onClick={() => setView('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${view === 'timeline' ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Timeline
              </button>
              <button onClick={() => setView('detail')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${view === 'detail' ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                By SOP
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-teal-500 shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Introduced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Check: Active Practice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-sm" />
              <span className="text-xs font-medium text-gray-600">Check: Routine</span>
            </div>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded">CF</span>
              <span className="text-xs text-gray-500">Community Fellow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white bg-violet-600 px-1.5 py-0.5 rounded">IF</span>
              <span className="text-xs text-gray-500">Innovation Fellow</span>
            </div>
            {currentCycle && (
              <>
                <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-blue-600 font-semibold">You are in Cycle {currentCycle}</span>
                </div>
              </>
            )}
          </div>

          {/* Views */}
          {view === 'timeline'
            ? <TimelineView currentBand={currentBand} />
            : <DetailView currentBand={currentBand} />
          }
        </div>
      </main>
    </div>
  )
}

// ─── TIMELINE (GANTT) VIEW ────────────────────────────────────────────────────

function TimelineView({ currentBand }) {
  const [tooltip, setTooltip] = useState(null) // { sop, state, label, x, y }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">

          {/* Column headers */}
          <div className="flex items-stretch border-b border-gray-100">
            <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-gray-100">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">SOP</span>
            </div>
            {BANDS.map(band => {
              const isCurrent = band.id === currentBand
              return (
                <div key={band.id} className={`flex-1 px-2 py-3 text-center border-r border-gray-50 last:border-0
                  ${isCurrent ? 'bg-blue-50' : ''}`}>
                  <div className={`text-xs font-bold ${isCurrent ? 'text-blue-700' : 'text-gray-600'}`}>
                    {band.label}
                  </div>
                  <div className={`text-[10px] ${isCurrent ? 'text-blue-500' : 'text-gray-400'}`}>
                    {band.sub}
                  </div>
                  {isCurrent && (
                    <div className="mt-1 mx-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Section groups */}
          {SECTIONS.map(sec => {
            const secSops = SOPS.filter(s => s.section === sec.id)
            return (
              <div key={sec.id}>
                {/* Section label */}
                <div className="flex items-center bg-gray-50 border-b border-gray-100">
                  <div className="w-48 flex-shrink-0 px-4 py-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                      {sec.label}
                    </span>
                    {sec.tag && (
                      <span className="ml-2 text-[10px] text-gray-400">{sec.tag}</span>
                    )}
                  </div>
                  {sec.note && (
                    <div className="flex-1 px-4 py-2">
                      <span className="text-[11px] text-gray-400 italic">{sec.note}</span>
                    </div>
                  )}
                </div>

                {/* SOP rows */}
                {secSops.map((sop, rowIdx) => (
                  <GanttRow
                    key={sop.num}
                    sop={sop}
                    currentBand={currentBand}
                    isLast={rowIdx === secSops.length - 1}
                    onDotHover={setTooltip}
                    tooltip={tooltip}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip — fixed to bottom of screen on mobile, absolute on desktop */}
      {tooltip && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-auto sm:w-80
          bg-navy text-white rounded-xl px-4 py-3 shadow-xl z-50 pointer-events-none">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0
              ${tooltip.state === 'intro' ? 'bg-teal-400' :
                tooltip.state === 'apCheck' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">
              {tooltip.state === 'intro' ? 'Introduced' :
               tooltip.state === 'apCheck' ? 'Active Practice — check at' : 'Routine — check at'}
            </span>
          </div>
          <p className="text-sm font-semibold">SOP {tooltip.sop.num}: {tooltip.sop.title}</p>
          <p className="text-xs text-white/80 mt-1 leading-relaxed">{tooltip.label}</p>
        </div>
      )}
    </div>
  )
}

function GanttRow({ sop, currentBand, isLast, onDotHover, tooltip }) {
  // Calculate the span (for the connecting line)
  const dots = [
    sop.intro   ? { state: 'intro',   band: sop.intro.band,   label: sop.intro.label }   : null,
    sop.apCheck ? { state: 'apCheck', band: sop.apCheck.band, label: sop.apCheck.label } : null,
    sop.routine ? { state: 'routine', band: sop.routine.band, label: sop.routine.label } : null,
  ].filter(Boolean)

  const dotBandIndices = dots.map(d => BAND_INDEX[d.band])
  const minIdx = Math.min(...dotBandIndices)
  const maxIdx = Math.max(...dotBandIndices)

  // For the connector line: it spans from the centre of the minIdx column to the centre of maxIdx
  // Expressed as left % and width % of the bands container
  const nBands = BANDS.length
  const lineLeft  = (minIdx / nBands + 1 / (2 * nBands)) * 100
  const lineRight = ((maxIdx + 1) / nBands - 1 / (2 * nBands)) * 100
  const lineWidth = lineRight - lineLeft

  return (
    <div className={`flex items-center group hover:bg-gray-50 transition-colors
      ${!isLast ? 'border-b border-gray-50' : ''}`}>

      {/* SOP label */}
      <div className="w-48 flex-shrink-0 px-4 py-2.5 flex items-center gap-2 border-r border-gray-100">
        <span className={`text-[10px] font-bold text-white px-1.5 py-0.5 rounded flex-shrink-0
          ${sop.lead === 'CF' ? 'bg-emerald-600' : 'bg-violet-600'}`}>
          {sop.num}
        </span>
        {sop.pageId ? (
          <Link to={`/section/${sop.pageId}`}
            className="text-xs text-gray-700 hover:text-navy hover:underline leading-snug line-clamp-2">
            {sop.title}
          </Link>
        ) : (
          <span className="text-xs text-gray-500 leading-snug line-clamp-2">{sop.title}</span>
        )}
      </div>

      {/* Timeline bands container */}
      <div className="flex flex-1 items-center relative" style={{ height: '44px' }}>

        {/* Connecting line */}
        {dots.length > 1 && (
          <div
            className="absolute top-1/2 h-px bg-gray-200 -translate-y-1/2 pointer-events-none"
            style={{ left: `${lineLeft}%`, width: `${lineWidth}%` }}
          />
        )}

        {/* Cells with dots */}
        {BANDS.map((band, i) => {
          const isCurrent = band.id === currentBand
          const bandDots = dots.filter(d => d.band === band.id)

          return (
            <div key={band.id}
              className={`flex-1 flex items-center justify-center gap-1 h-full relative
                ${isCurrent ? 'bg-blue-50/50' : ''}`}>
              {bandDots.map(dot => (
                <button
                  key={dot.state}
                  onMouseEnter={() => onDotHover({ sop, state: dot.state, label: dot.label })}
                  onMouseLeave={() => onDotHover(null)}
                  onClick={() => onDotHover(
                    tooltip?.sop.num === sop.num && tooltip?.state === dot.state
                      ? null
                      : { sop, state: dot.state, label: dot.label }
                  )}
                  className={`relative z-10 rounded-full border-2 border-white shadow-sm
                    transition-transform hover:scale-125 active:scale-110 cursor-pointer flex-shrink-0
                    ${bandDots.length > 1 ? 'w-3 h-3' : 'w-4 h-4'}
                    ${dot.state === 'intro'   ? 'bg-teal-500'   :
                      dot.state === 'apCheck' ? 'bg-amber-500'  : 'bg-indigo-500'}`}
                  title={dot.label}
                />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── BY SOP (DETAIL) VIEW ─────────────────────────────────────────────────────

function DetailView({ currentBand }) {
  const [expanded, setExpanded] = useState(null)

  const toggle = (num) => setExpanded(prev => prev === num ? null : num)

  return (
    <div className="space-y-6">
      {SECTIONS.map(sec => {
        const secSops = SOPS.filter(s => s.section === sec.id)
        return (
          <div key={sec.id}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-bold text-navy">{sec.label}</h2>
              {sec.tag && (
                <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                  {sec.tag}
                </span>
              )}
            </div>
            {sec.note && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 italic">
                ⚠ {sec.note}
              </p>
            )}

            <div className="space-y-2">
              {secSops.map(sop => (
                <DetailCard
                  key={sop.num}
                  sop={sop}
                  isExpanded={expanded === sop.num}
                  onToggle={() => toggle(sop.num)}
                  currentBand={currentBand}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailCard({ sop, isExpanded, onToggle, currentBand }) {
  // Determine if this SOP's intro is in the current phase (highlight)
  const isCurrentIntro   = sop.intro?.band   === currentBand
  const isCurrentAP      = sop.apCheck?.band === currentBand
  const isCurrentRoutine = sop.routine?.band === currentBand
  const isRelevantNow    = isCurrentIntro || isCurrentAP || isCurrentRoutine

  return (
    <div className={`bg-white rounded-xl border transition-all
      ${isExpanded ? 'border-navy/20 shadow-md' : isRelevantNow ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}>

      <button onClick={onToggle} className="w-full text-left px-4 py-3 flex items-center gap-3">
        {/* SOP badge */}
        <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded flex-shrink-0
          ${sop.lead === 'CF' ? 'bg-emerald-600' : 'bg-violet-600'}`}>
          {sop.num}
        </span>

        {/* Title */}
        <span className={`text-sm font-semibold flex-1 ${isExpanded ? 'text-navy' : 'text-gray-800'}`}>
          {sop.title}
        </span>

        {/* Now indicator */}
        {isRelevantNow && !isExpanded && (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex-shrink-0">
            now
          </span>
        )}

        {/* Compact state dots (collapsed) */}
        {!isExpanded && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {sop.intro   && <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />}
            {sop.apCheck && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
            {sop.routine && <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />}
          </div>
        )}

        {/* Link to SOP */}
        {sop.pageId && (
          <Link
            to={`/section/${sop.pageId}`}
            onClick={e => e.stopPropagation()}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex-shrink-0
              hidden sm:block"
            title="Read the full SOP">
            Read →
          </Link>
        )}

        {/* Expand chevron */}
        <svg className={`w-4 h-4 flex-shrink-0 transition-transform text-gray-400
          ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded: three-step lifecycle */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1">
          {/* Visual three-step progress */}
          <div className="flex items-start gap-2 mb-4 relative">
            {/* Connector lines between steps */}
            <div className="absolute top-4 left-0 right-0 flex pointer-events-none">
              {[sop.intro, sop.apCheck, sop.routine].filter(Boolean).length > 1 && (
                <div className="flex-1 flex">
                  <div className="flex-1 h-px bg-gray-200 mt-0" />
                </div>
              )}
            </div>

            <LifecycleStep
              state="intro"
              data={sop.intro}
              label="Introduced"
              isCurrent={isCurrentIntro}
              color="teal"
            />
            <div className="flex-1 self-center h-px bg-gray-200 mt-3 flex-shrink" />
            <LifecycleStep
              state="apCheck"
              data={sop.apCheck}
              label="Active Practice"
              sublabel="when to check"
              isCurrent={isCurrentAP}
              color="amber"
            />
            <div className="flex-1 self-center h-px bg-gray-200 mt-3 flex-shrink" />
            <LifecycleStep
              state="routine"
              data={sop.routine}
              label="Routine"
              sublabel="when to check"
              isCurrent={isCurrentRoutine}
              color="indigo"
            />
          </div>

          {/* SOP link on mobile */}
          {sop.pageId && (
            <div className="sm:hidden mt-2">
              <Link to={`/section/${sop.pageId}`}
                className="text-xs text-teal-600 font-semibold hover:underline">
                Read the full SOP →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LifecycleStep({ state, data, label, sublabel, isCurrent, color }) {
  const colors = {
    teal:   { dot: 'bg-teal-500',   text: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200'   },
    amber:  { dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
    indigo: { dot: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  }
  const c = colors[color]

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-1 w-28 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
          <span className="text-gray-300 text-lg">–</span>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{label}</p>
          {sublabel && <p className="text-[9px] text-gray-300">{sublabel}</p>}
          <p className="text-[10px] text-gray-400 italic mt-0.5">Not applicable</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 w-32 flex-shrink-0`}>
      <div className={`w-8 h-8 rounded-full ${c.dot} flex items-center justify-center shadow-sm
        ${isCurrent ? 'ring-4 ring-offset-1 ring-blue-300' : ''}`}>
        <span className="text-white text-sm font-bold">
          {state === 'intro' ? '🌱' : state === 'apCheck' ? '👁' : '✓'}
        </span>
      </div>
      <div className="text-center">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${c.text}`}>{label}</p>
        {sublabel && <p className={`text-[9px] ${c.text} opacity-70`}>{sublabel}</p>}
        {isCurrent && (
          <span className="inline-block text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full mt-0.5">
            NOW
          </span>
        )}
        <div className={`mt-1.5 rounded-lg px-2 py-1.5 border text-[10px] text-gray-600 leading-relaxed ${c.bg} ${c.border}`}>
          {data.label}
        </div>
      </div>
    </div>
  )
}
