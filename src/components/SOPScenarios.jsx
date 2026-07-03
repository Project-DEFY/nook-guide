import { useState } from 'react'
import { SOP_SCENARIOS } from '../data/sopScenarios'

export default function SOPScenarios({ pageId }) {
  const [modal, setModal] = useState(null) // null | 'success' | 'breakdown'
  const data = SOP_SCENARIOS[pageId]
  if (!data) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setModal('success')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            bg-green-50 text-green-700 border border-green-200
            hover:bg-green-100 active:scale-95 transition-all"
        >
          <span>✅</span>
          <span>When This Works</span>
        </button>
        <button
          onClick={() => setModal('breakdown')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            bg-red-50 text-red-700 border border-red-200
            hover:bg-red-100 active:scale-95 transition-all"
        >
          <span>❌</span>
          <span>When This Breaks Down</span>
        </button>
      </div>

      {modal && (
        <ScenarioModal
          type={modal}
          content={modal === 'success' ? data.success : data.breakdown}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

function ScenarioModal({ type, content, onClose }) {
  const isSuccess = type === 'success'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl my-8 shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl border-b
          ${isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
        >
          <span className={`text-sm font-bold ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
            {isSuccess ? '✅ When This Works' : '❌ When This Breaks Down'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[72vh]">
          <ScenarioContent content={content} isSuccess={isSuccess} />
        </div>
      </div>
    </div>
  )
}

function ScenarioContent({ content, isSuccess }) {
  if (!content) return null
  const lines = content.split('\n')
  const elements = []
  let listItems = []

  const flushList = key => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="my-2 space-y-1.5">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-300 mt-0.5 flex-shrink-0 select-none">•</span>
              <span className="leading-snug">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const t = line.trim()

    if (t.startsWith('## ')) {
      flushList(i)
      const text = t.replace(/^##\s+/, '').replace(/^[✅❌]\s*/, '')
      if (text) {
        elements.push(
          <h3 key={i} className={`font-bold text-base mt-5 mb-1.5
            ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {text}
          </h3>
        )
      }
    } else if (/^\*\*[^*]+\*\*$/.test(t)) {
      // Standalone bold line = section label
      flushList(i)
      elements.push(
        <p key={i} className="font-semibold text-gray-800 text-sm mt-4 mb-1">
          {t.slice(2, -2)}
        </p>
      )
    } else if (t.startsWith('- ') || t.startsWith('\\- ')) {
      listItems.push(t.replace(/^\\?-\s+/, ''))
    } else if (t === '---') {
      flushList(i)
      elements.push(<hr key={i} className="my-4 border-gray-100" />)
    } else if (t === '') {
      flushList(i)
    } else {
      flushList(i)
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed">
          {renderInline(t)}
        </p>
      )
    }
  })
  flushList('end')

  return <div className="space-y-0.5">{elements}</div>
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part
  )
}
