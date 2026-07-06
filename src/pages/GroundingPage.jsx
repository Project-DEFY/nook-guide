import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'

const PHASE_COLORS = [
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', dot: 'bg-teal-400' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
]
const pc = phase => PHASE_COLORS[phase] || PHASE_COLORS[0]

function isQuestionDone(q, resp) {
  if (!resp) return false
  if (q.question_type === 'short_answer') return resp.self_assessed_correct !== null
  return resp.seen_explanation === true
}

// ─── QUESTION BLOCK ───────────────────────────────────────────────────────────

function QuestionBlock({ question, userId, existingResponse, onComplete }) {
  const [selected, setSelected] = useState(existingResponse?.response || '')
  const [shortText, setShortText] = useState(existingResponse?.response || '')
  const [submitted, setSubmitted] = useState(!!existingResponse)
  const [isCorrect, setIsCorrect] = useState(
    existingResponse ? existingResponse.is_correct : null
  )
  const [showExplanation, setShowExplanation] = useState(
    existingResponse?.seen_explanation || false
  )
  const [selfAssessed, setSelfAssessed] = useState(
    existingResponse?.self_assessed_correct ?? null
  )
  const [saving, setSaving] = useState(false)

  const isYesNo = question.question_type === 'yes_no'
  const isMCQ = question.question_type === 'multiple_choice'
  const isShort = question.question_type === 'short_answer'
  const opts = isMCQ ? (typeof question.options === 'string'
    ? JSON.parse(question.options) : question.options) || [] : []

  const done = showExplanation || (isShort && selfAssessed !== null)

  async function upsertResponse(payload) {
    await supabase.from('grounding_question_responses').upsert(
      { user_id: userId, question_id: question.id, ...payload },
      { onConflict: 'user_id,question_id' }
    )
  }

  async function submitAnswer(answer) {
    setSaving(true)
    const correct = isShort ? null : answer.toLowerCase() === question.correct_answer.toLowerCase()
    await upsertResponse({ response: answer, is_correct: correct, seen_explanation: false })
    setSelected(answer)
    setSubmitted(true)
    setIsCorrect(correct)
    // For correct non-short answers, auto-acknowledge
    if (!isShort && correct) {
      await upsertResponse({ response: answer, is_correct: true, seen_explanation: true })
      setShowExplanation(true)
      onComplete(question.id)
    }
    setSaving(false)
  }

  async function acknowledge() {
    setSaving(true)
    await upsertResponse({ response: selected, is_correct: isCorrect, seen_explanation: true })
    setShowExplanation(true)
    onComplete(question.id)
    setSaving(false)
  }

  async function selfAssess(correct) {
    setSaving(true)
    await upsertResponse({
      response: shortText, is_correct: null,
      self_assessed_correct: correct, seen_explanation: true,
    })
    setSelfAssessed(correct)
    setShowExplanation(true)
    onComplete(question.id)
    setSaving(false)
  }

  // ── Done state (compact summary) ────────────────────────────────────────────
  if (done) {
    const wasCorrect = isShort ? selfAssessed : isCorrect
    return (
      <div className={`rounded-lg px-3 py-2.5 border flex items-start gap-2 text-sm
        ${wasCorrect !== false ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className={`flex-shrink-0 font-bold ${wasCorrect !== false ? 'text-teal-600' : 'text-amber-500'}`}>
          {wasCorrect !== false ? '✓' : '→'}
        </span>
        <div className="min-w-0">
          <p className="text-gray-700 font-medium leading-snug">{question.question_text}</p>
          {!isShort && !wasCorrect && (
            <p className="text-xs text-gray-500 mt-0.5">Correct: {question.correct_answer}</p>
          )}
          {isShort && (
            <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">"{selected || shortText}"</p>
          )}
        </div>
      </div>
    )
  }

  // ── Not submitted yet ───────────────────────────────────────────────────────
  if (!submitted) {
    if (isYesNo) return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick check</p>
        <p className="text-sm font-medium text-gray-800 mb-3">{question.question_text}</p>
        <div className="flex gap-2">
          {['Yes', 'No'].map(opt => (
            <button key={opt} onClick={() => submitAnswer(opt.toLowerCase())} disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold border
                border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {opt}
            </button>
          ))}
        </div>
      </div>
    )

    if (isMCQ) return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick check</p>
        <p className="text-sm font-medium text-gray-800 mb-3">{question.question_text}</p>
        <div className="space-y-2 mb-3">
          {opts.map(opt => (
            <label key={opt} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer
              transition-colors ${selected === opt ? 'border-navy bg-navy/5' : 'border-gray-100 hover:border-gray-200'}`}>
              <input type="radio" name={`q_${question.id}`} value={opt}
                checked={selected === opt} onChange={() => setSelected(opt)}
                className="mt-0.5 accent-navy" />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
        <button onClick={() => selected && submitAnswer(selected)} disabled={!selected || saving}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-navy text-white
            hover:bg-navy/90 disabled:opacity-40 transition-colors">
          Submit
        </button>
      </div>
    )

    if (isShort) return (
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Reflect & respond</p>
        <p className="text-sm font-medium text-gray-800 mb-3">{question.question_text}</p>
        <textarea value={shortText} onChange={e => setShortText(e.target.value)}
          placeholder="Write your answer..." rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none
            focus:outline-none focus:ring-1 focus:ring-teal-400 placeholder:text-gray-300 mb-3" />
        <button onClick={() => shortText.trim() && submitAnswer(shortText.trim())}
          disabled={!shortText.trim() || saving}
          className="w-full py-2 rounded-lg text-sm font-semibold bg-navy text-white
            hover:bg-navy/90 disabled:opacity-40 transition-colors">
          Submit
        </button>
      </div>
    )
  }

  // ── Submitted — show result ─────────────────────────────────────────────────

  // Short answer: show model answer + self-assess
  if (isShort) return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reflect & respond</p>
      <p className="text-sm font-medium text-gray-800">{question.question_text}</p>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-400 mb-1">Your answer</p>
        <p className="text-sm text-gray-700 italic">"{shortText}"</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 mb-1">Model answer</p>
        <p className="text-sm text-gray-700">{question.correct_answer}</p>
      </div>
      {question.context_excerpt && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Worth re-reading</p>
          <p className="text-sm text-gray-600 italic">"{question.context_excerpt}"</p>
        </div>
      )}
      <p className="text-xs font-semibold text-gray-500">How did you do?</p>
      <div className="flex gap-2">
        <button onClick={() => selfAssess(true)} disabled={saving}
          className="flex-1 py-2 rounded-lg text-sm font-semibold bg-teal-500 text-white
            hover:bg-teal-600 disabled:opacity-50 transition-colors">
          I got it ✓
        </button>
        <button onClick={() => selfAssess(false)} disabled={saving}
          className="flex-1 py-2 rounded-lg text-sm font-semibold border border-amber-300
            text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors">
          I missed this
        </button>
      </div>
    </div>
  )

  // MCQ / yes-no: show correct/wrong
  if (isCorrect) return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
      <p className="text-sm font-bold text-teal-700">✓ Correct!</p>
      <p className="text-sm text-gray-700">{question.explanation}</p>
    </div>
  )

  // Wrong
  return (
    <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-amber-600">Not quite.</p>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Correct answer</p>
        <p className="text-sm font-semibold text-gray-800">{question.correct_answer}</p>
      </div>
      <p className="text-sm text-gray-600">{question.explanation}</p>
      {question.context_excerpt && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">Read this again before moving on</p>
          <p className="text-sm text-gray-600 italic">"{question.context_excerpt}"</p>
        </div>
      )}
      <button onClick={acknowledge} disabled={saving}
        className="w-full py-2 rounded-lg text-sm font-semibold bg-amber-500 text-white
          hover:bg-amber-600 disabled:opacity-50 transition-colors">
        Got it — continue
      </button>
    </div>
  )
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export default function GroundingPage() {
  const { userAccess } = useContext(AuthContext)
  const role = userAccess?.nook_role
  if (role === 'hopper') return <HopperDashboard />
  if (role === 'admin' || role === 'co_admin') return <AdminGrounding />
  return <FellowGrounding />
}

// ─── FELLOW VIEW ─────────────────────────────────────────────────────────────

function FellowGrounding() {
  const { session, userAccess } = useContext(AuthContext)
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState({})
  const [hopper, setHopper] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState(null)
  const [reflectionText, setReflectionText] = useState('')
  const [saving, setSaving] = useState(false)
  // { [modId]: { questions: [], responses: {[qId]: resp}, doneSet: Set<qId>, loaded: bool } }
  const [moduleData, setModuleData] = useState({})

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [modRes, progRes, assignRes] = await Promise.all([
      supabase.rpc('get_my_grounding_modules'),
      supabase.from('grounding_progress').select('*').eq('user_id', session.user.id),
      supabase.from('hopper_assignments').select('hopper_id')
        .eq('fellow_id', session.user.id).eq('is_active', true).maybeSingle(),
    ])

    const mods = modRes.data || []
    const prog = {}
    for (const p of (progRes.data || [])) prog[p.module_id] = p
    setModules(mods)
    setProgress(prog)

    if (assignRes.data?.hopper_id) {
      const { data: hopperAccess } = await supabase
        .from('nook_guide_access').select('full_name, email, nook_location')
        .eq('user_id', assignRes.data.hopper_id).maybeSingle()
      setHopper(hopperAccess)
    }
    setLoading(false)
  }

  async function openModule(mod) {
    const isOpen = activeModule?.id === mod.id
    setActiveModule(isOpen ? null : mod)
    if (isOpen) return

    // Load questions + responses if not already loaded
    if (moduleData[mod.id]?.loaded) return

    const { data: questions } = await supabase
      .from('grounding_questions').select('*').eq('module_id', mod.id).order('display_order')

    const qIds = (questions || []).map(q => q.id)
    const { data: responses } = qIds.length > 0
      ? await supabase.from('grounding_question_responses').select('*')
          .in('question_id', qIds).eq('user_id', session.user.id)
      : { data: [] }

    const respMap = {}
    for (const r of (responses || [])) respMap[r.question_id] = r

    const doneSet = new Set(
      (questions || []).filter(q => isQuestionDone(q, respMap[q.id])).map(q => q.id)
    )

    setModuleData(prev => ({
      ...prev,
      [mod.id]: { questions: questions || [], responses: respMap, doneSet, loaded: true },
    }))
  }

  function handleQuestionComplete(modId, questionId) {
    setModuleData(prev => {
      const md = prev[modId]
      if (!md) return prev
      const newDone = new Set(md.doneSet)
      newDone.add(questionId)
      return { ...prev, [modId]: { ...md, doneSet: newDone } }
    })
  }

  async function markComplete(mod) {
    setSaving(true)
    await supabase.from('grounding_progress').upsert({
      user_id: session.user.id,
      module_id: mod.id,
      status: 'completed',
      reflection_answer: reflectionText || null,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,module_id' })

    setActiveModule(null)
    setReflectionText('')
    await loadAll()
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-14 flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Loading your Grounding path..." />
      </div>
    </div>
  )

  const phaseMap = {}
  for (const mod of modules) {
    if (!phaseMap[mod.phase]) phaseMap[mod.phase] = { phase: mod.phase, phase_name: mod.phase_name, modules: [] }
    phaseMap[mod.phase].modules.push(mod)
  }
  const phaseList = Object.values(phaseMap).sort((a, b) => a.phase - b.phase)

  const completedCount = Object.values(progress).filter(p => p.status === 'completed').length
  const totalCount = modules.length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy">Grounding</h1>
            <p className="text-gray-500 mt-1">Your first cycles in the Nook.</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalCount ? (completedCount / totalCount) * 100 : 0}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-500 flex-shrink-0">
                {completedCount} / {totalCount}
              </span>
            </div>
          </div>

          {/* Hopper card */}
          {hopper && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-8 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">
                  {(hopper.full_name || hopper.email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Your Hopper</p>
                <p className="text-sm font-semibold text-navy">{hopper.full_name || hopper.email}</p>
                {hopper.email && <p className="text-xs text-gray-500 truncate">{hopper.email}</p>}
              </div>
              <a href={`mailto:${hopper.email}`}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex-shrink-0
                  bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors">
                Contact
              </a>
            </div>
          )}

          {modules.length === 0 && !loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
              <p className="text-lg mb-2">No modules available yet.</p>
              <p className="text-sm">Your training will appear here once assigned.</p>
            </div>
          )}

          {/* Phases */}
          {phaseList.map(ph => {
            const color = pc(ph.phase)
            const phaseDone = ph.modules.every(m => progress[m.id]?.status === 'completed')
            const phaseUnlocked = true // all returned modules are accessible
            return (
              <div key={ph.phase} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${phaseDone ? 'bg-teal-500 text-white' : `${color.bg} ${color.text}`}`}>
                    {phaseDone ? '✓' : ph.phase}
                  </div>
                  <p className="text-sm font-bold text-navy">{ph.phase_name}</p>
                </div>

                <div className="space-y-3 pl-5 border-l-2 border-gray-100">
                  {ph.modules.map(mod => {
                    const p = progress[mod.id] || {}
                    const isDone = p.status === 'completed'
                    const isActive = activeModule?.id === mod.id
                    const md = moduleData[mod.id]
                    const totalQ = md?.questions?.length || 0
                    const doneQ = md?.doneSet?.size || 0
                    const allQDone = totalQ === 0 || doneQ >= totalQ

                    const inlineQs = md?.questions?.filter(q => q.placement === 'inline') || []
                    const endQs = md?.questions?.filter(q => q.placement === 'end_quiz') || []

                    return (
                      <div key={mod.id}
                        className={`bg-white rounded-xl border transition-all
                          ${isDone ? 'border-teal-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                          ${isActive ? 'shadow-md border-teal-300' : ''}`}>

                        <button onClick={() => openModule(mod)}
                          className="w-full text-left p-4 flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center
                            flex-shrink-0 mt-0.5
                            ${isDone ? 'bg-teal-500' : color.bg}`}>
                            {isDone ? (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : <div className={`w-2 h-2 rounded-full ${color.dot}`} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-snug
                              ${isDone ? 'text-teal-700' : 'text-navy'}`}>
                              {mod.title}
                            </p>
                            {isDone && p.reflection_answer && (
                              <p className="text-xs text-teal-600 mt-0.5 line-clamp-1 italic">
                                "{p.reflection_answer}"
                              </p>
                            )}
                            {!isDone && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {mod.context}
                              </p>
                            )}
                          </div>

                          <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform
                            ${isActive ? 'rotate-180 text-teal-500' : 'text-gray-300'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Expanded content */}
                        {isActive && (
                          <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">

                            {/* Context */}
                            <p className="text-sm text-gray-700 leading-relaxed">{mod.context}</p>

                            {/* Inline questions */}
                            {inlineQs.length > 0 && (
                              <div className="space-y-3">
                                {inlineQs.map(q => (
                                  <QuestionBlock
                                    key={q.id}
                                    question={q}
                                    userId={session.user.id}
                                    existingResponse={md?.responses?.[q.id]}
                                    onComplete={(qId) => handleQuestionComplete(mod.id, qId)}
                                  />
                                ))}
                              </div>
                            )}

                            {/* SOP link */}
                            {mod.sop_page_id && (
                              <Link to={`/section/${mod.sop_page_id}`}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg
                                  text-xs font-semibold border transition-colors
                                  ${color.bg} ${color.text} ${color.border} hover:opacity-80`}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Read the full SOP →
                              </Link>
                            )}

                            {/* Practical task */}
                            {mod.practical_task && (
                              <div className={`rounded-lg p-3 ${color.bg} border ${color.border}`}>
                                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${color.text}`}>
                                  This week
                                </p>
                                <p className="text-sm text-gray-700">{mod.practical_task}</p>
                              </div>
                            )}

                            {/* Reflection */}
                            {mod.reflection_prompt && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                                  Reflect
                                </p>
                                <p className="text-sm text-gray-600 italic mb-2">{mod.reflection_prompt}</p>
                                <textarea value={reflectionText} onChange={e => setReflectionText(e.target.value)}
                                  placeholder="Write a few words... (optional)" rows={3}
                                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                                    text-gray-700 resize-none focus:outline-none focus:ring-1
                                    focus:ring-teal-400 placeholder:text-gray-300" />
                              </div>
                            )}

                            {/* End-quiz questions */}
                            {endQs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-px bg-gray-100" />
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-2">
                                    Check your understanding
                                  </p>
                                  <div className="flex-1 h-px bg-gray-100" />
                                </div>
                                {endQs.map(q => (
                                  <QuestionBlock
                                    key={q.id}
                                    question={q}
                                    userId={session.user.id}
                                    existingResponse={md?.responses?.[q.id]}
                                    onComplete={(qId) => handleQuestionComplete(mod.id, qId)}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Question progress nudge */}
                            {totalQ > 0 && !allQDone && (
                              <p className="text-xs text-gray-400 text-center">
                                {doneQ}/{totalQ} check-in questions answered — complete them to get the most from this module.
                              </p>
                            )}

                            {/* Mark complete */}
                            {!isDone ? (
                              <button onClick={() => markComplete(mod)} disabled={saving}
                                className="w-full py-2.5 rounded-lg text-sm font-semibold
                                  bg-teal-500 text-white hover:bg-teal-600 transition-colors
                                  disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving
                                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : '✓ Mark as complete'}
                              </button>
                            ) : (
                              <p className="text-xs text-teal-600 font-semibold text-center py-1">✓ Completed</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

// ─── HOPPER DASHBOARD ────────────────────────────────────────────────────────

function HopperDashboard() {
  const { session } = useContext(AuthContext)
  const [fellows, setFellows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFellow, setSelectedFellow] = useState(null)
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [fellowProgress, setFellowProgress] = useState({})

  useEffect(() => { loadFellows() }, [])

  async function loadFellows() {
    setLoading(true)
    const { data: assignments } = await supabase
      .from('hopper_assignments').select('fellow_id')
      .eq('hopper_id', session.user.id).eq('is_active', true)

    if (!assignments?.length) { setLoading(false); return }

    const fellowIds = assignments.map(a => a.fellow_id)
    const { data: accessRows } = await supabase
      .from('nook_guide_access')
      .select('user_id, full_name, email, nook_location, current_cycle_number, nook_role')
      .in('user_id', fellowIds)

    const fs = (accessRows || []).map(r => ({ fellow_id: r.user_id, ...r }))
    setFellows(fs)

    const prog = {}
    await Promise.all(fs.map(async f => {
      const { data: p } = await supabase.from('grounding_progress')
        .select('status').eq('user_id', f.fellow_id)
      prog[f.fellow_id] = {
        total: p?.length || 0,
        completed: p?.filter(x => x.status === 'completed').length || 0,
      }
    }))
    setFellowProgress(prog)

    if (fs.length > 0) await loadNotes(fs[0])
    setLoading(false)
  }

  async function loadNotes(fellow) {
    setSelectedFellow(fellow)
    const { data } = await supabase.from('hopper_notes').select('*')
      .eq('hopper_id', session.user.id).eq('fellow_id', fellow.fellow_id)
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setNewNote('')
  }

  async function addNote() {
    if (!newNote.trim() || !selectedFellow) return
    setSavingNote(true)
    await supabase.from('hopper_notes').insert({
      hopper_id: session.user.id, fellow_id: selectedFellow.fellow_id, note: newNote.trim(),
    })
    setNewNote('')
    await loadNotes(selectedFellow)
    setSavingNote(false)
  }

  async function deleteNote(noteId) {
    await supabase.from('hopper_notes').delete().eq('id', noteId)
    await loadNotes(selectedFellow)
  }

  const initials = s => (s || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const fmtDate = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Hopper Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Your assigned fellows and their Grounding progress.</p>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading your fellows..." />
          ) : fellows.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
              No fellows assigned to you yet.
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="w-64 flex-shrink-0 space-y-2">
                {fellows.map(f => {
                  const prog = fellowProgress[f.fellow_id] || { total: 0, completed: 0 }
                  const sel = selectedFellow?.fellow_id === f.fellow_id
                  return (
                    <button key={f.fellow_id} onClick={() => loadNotes(f)}
                      className={`w-full text-left p-3 rounded-xl border transition-all
                        ${sel ? 'bg-navy border-navy' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{initials(f.full_name || f.email)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${sel ? 'text-white' : 'text-gray-900'}`}>
                            {f.full_name || f.email}
                          </p>
                          <p className={`text-xs ${sel ? 'text-white/60' : 'text-gray-400'}`}>
                            Cycle {f.current_cycle_number || 0}
                          </p>
                        </div>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${sel ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <div className={`h-full rounded-full ${sel ? 'bg-teal-300' : 'bg-teal-500'}`}
                          style={{ width: `${prog.total ? (prog.completed / prog.total) * 100 : 0}%` }} />
                      </div>
                      <p className={`text-xs mt-1 ${sel ? 'text-white/60' : 'text-gray-400'}`}>
                        {prog.completed}/{prog.total} modules
                      </p>
                    </button>
                  )
                })}
              </div>

              {selectedFellow && (
                <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {initials(selectedFellow.full_name || selectedFellow.email)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        {selectedFellow.full_name || selectedFellow.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedFellow.nook_location} · Cycle {selectedFellow.current_cycle_number || 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your notes</p>
                    <div className="flex gap-2 mb-4">
                      <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                        placeholder="Add a note about this fellow..." rows={2}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                          resize-none focus:outline-none focus:ring-1 focus:ring-teal-400
                          placeholder:text-gray-300"
                        onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) addNote() }} />
                      <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                        className="px-3 py-2 bg-navy text-white rounded-lg text-xs font-semibold
                          hover:bg-navy/90 disabled:opacity-40 transition-colors self-start">
                        {savingNote ? '...' : 'Add'}
                      </button>
                    </div>

                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-300 italic text-center py-4">No notes yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {notes.map(n => (
                          <div key={n.id} className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                              <p className="text-xs text-gray-400 mt-1">{fmtDate(n.created_at)}</p>
                            </div>
                            <button onClick={() => deleteNote(n.id)}
                              className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ─── ADMIN GROUNDING VIEW ─────────────────────────────────────────────────────

function AdminGrounding() {
  const { session } = useContext(AuthContext)
  const [fellows, setFellows] = useState([])
  const [hoppers, setHoppers] = useState([])
  const [assignments, setAssignments] = useState({})
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [fellowRes, hopperRes, assignRes] = await Promise.all([
      supabase.from('nook_guide_access')
        .select('*').in('nook_role', ['new_fellow', 'fellow', 'senior_fellow'])
        .order('created_at', { ascending: false }),
      supabase.from('nook_guide_access')
        .select('user_id, full_name, email')
        .in('nook_role', ['hopper', 'senior_fellow', 'team_member', 'admin', 'co_admin']),
      supabase.from('hopper_assignments').select('fellow_id, hopper_id').eq('is_active', true),
    ])

    setFellows(fellowRes.data || [])
    setHoppers(hopperRes.data || [])

    const amap = {}
    for (const a of (assignRes.data || [])) amap[a.fellow_id] = a.hopper_id
    setAssignments(amap)

    const prog = {}
    await Promise.all((fellowRes.data || []).filter(f => f.user_id).map(async f => {
      const { data: p } = await supabase.from('grounding_progress')
        .select('status').eq('user_id', f.user_id)
      prog[f.user_id] = {
        total: p?.length || 0,
        completed: p?.filter(x => x.status === 'completed').length || 0,
      }
    }))
    setProgress(prog)
    setLoading(false)
  }

  async function assignHopper(fellowUserId, hopperUserId) {
    setSaving(fellowUserId)
    await supabase.from('hopper_assignments').update({ is_active: false })
      .eq('fellow_id', fellowUserId).eq('is_active', true)
    if (hopperUserId) {
      await supabase.from('hopper_assignments').insert({
        fellow_id: fellowUserId, hopper_id: hopperUserId,
        assigned_by: session.user.id, is_active: true,
      })
    }
    await loadAll()
    setSaving(null)
  }

  const initials = s => (s || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const roleLabel = { new_fellow: 'New Fellow', fellow: 'Fellow', senior_fellow: 'Senior Fellow' }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy">Grounding — Admin</h1>
            <p className="text-gray-500 text-sm mt-0.5">Assign hoppers and track fellow progress.</p>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading..." />
          ) : fellows.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
              No fellows in the system yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {fellows.map(f => {
                  const prog = f.user_id ? (progress[f.user_id] || { total: 0, completed: 0 }) : null
                  const currentHopper = f.user_id ? (assignments[f.user_id] || '') : ''
                  const pct = prog?.total ? (prog.completed / prog.total) * 100 : 0

                  return (
                    <div key={f.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{initials(f.full_name || f.email)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{f.full_name || '—'}</p>
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {roleLabel[f.nook_role] || f.nook_role}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{f.email}</p>
                        {f.nook_location && (
                          <p className="text-xs text-gray-400">{f.nook_location} · Cycle {f.current_cycle_number || 0}</p>
                        )}
                      </div>

                      <div className="w-32 flex-shrink-0">
                        {prog ? (
                          <>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span><span>{prog.completed}/{prog.total}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </>
                        ) : <span className="text-xs text-gray-300 italic">Not logged in</span>}
                      </div>

                      <div className="w-44 flex-shrink-0">
                        {f.user_id ? (
                          <select value={currentHopper}
                            onChange={e => assignHopper(f.user_id, e.target.value || null)}
                            disabled={saving === f.user_id}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5
                              text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-400
                              disabled:opacity-50">
                            <option value="">— No hopper —</option>
                            {hoppers.map(h => (
                              <option key={h.user_id || h.email} value={h.user_id || ''}>
                                {h.full_name || h.email}
                              </option>
                            ))}
                          </select>
                        ) : <span className="text-xs text-gray-300 italic">Assign after login</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
