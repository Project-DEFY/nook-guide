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
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl border-b
          ${isSuccess ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">{isSuccess ? '✅' : '❌'}</span>
            <div>
              <p className={`text-sm font-bold ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                {isSuccess ? 'When This Works' : 'When This Breaks Down'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isSuccess ? 'A scenario showing successful execution' : 'A scenario showing what goes wrong'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 flex-shrink-0 p-1 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          <ScenarioContent content={content} isSuccess={isSuccess} />
        </div>
      </div>
    </div>
  )
}

function ScenarioContent({ content, isSuccess }) {
  if (!content) return null

  // Parse content into typed blocks for rendering
  const lines = content.split('\n')
  const blocks = []
  let currentList = null

  const flushList = () => {
    if (currentList) {
      blocks.push({ type: 'list', items: currentList })
      currentList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()

    if (t === '' || t === '---') {
      flushList()
      continue
    }

    if (t.startsWith('## ')) {
      flushList()
      const heading = t.slice(3)
      blocks.push({ type: 'heading', text: heading })
      continue
    }

    if (t.startsWith('- ') || t.startsWith('\\- ')) {
      const itemText = t.replace(/^\\?-\s+/, '')
      if (!currentList) currentList = []
      currentList.push(itemText)
      continue
    }

    // Standalone bold line
    if (/^\*\*[^*]+\*\*$/.test(t)) {
      flushList()
      blocks.push({ type: 'label', text: t.slice(2, -2) })
      continue
    }

    flushList()
    blocks.push({ type: 'paragraph', text: t })
  }
  flushList()

  // Merge "Lesson" heading + its following paragraphs into a single callout block
  const merged = []
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i]
    if (b.type === 'heading' && b.text === 'Lesson') {
      // Collect all following paragraphs as lesson text
      const parts = []
      while (i + 1 < blocks.length && blocks[i + 1].type === 'paragraph') {
        parts.push(blocks[++i].text)
      }
      merged.push({ type: 'lesson', text: parts.join(' ') })
    } else {
      merged.push(b)
    }
  }

  // Now render blocks with good visual design
  return (
    <div className="space-y-0">
      {merged.map((block, i) => {
        // Lesson callout
        if (block.type === 'lesson') {
          return (
            <div key={i} className={`mt-6 p-4 rounded-xl border-l-4
              ${isSuccess ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}
            >
              <p className={`text-xs font-bold uppercase tracking-widest mb-2
                ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                Key Lesson
              </p>
              {block.text && (
                <p className={`text-sm font-medium leading-relaxed
                  ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
                  {renderInline(block.text)}
                </p>
              )}
            </div>
          )
        }

        if (block.type === 'heading') {
          // "Context" is a subtle intro label
          if (block.text === 'Context') {
            return (
              <p key={i} className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Context
              </p>
            )
          }
          // Other section headings
          return (
            <div key={i} className="pt-5 pb-1">
              <p className={`text-xs font-bold uppercase tracking-widest
                ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                {block.text}
              </p>
              <div className={`mt-1.5 h-px w-8 rounded ${isSuccess ? 'bg-green-200' : 'bg-red-200'}`} />
            </div>
          )
        }

        if (block.type === 'list') {
          return (
            <ul key={i} className="my-2 space-y-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0
                    ${isSuccess ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="leading-relaxed">{renderInline(item)}</span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === 'label') {
          return (
            <p key={i} className="text-sm font-semibold text-gray-700 mt-3 mb-1">
              {block.text}
            </p>
          )
        }

        return (
          <p key={i} className="text-sm text-gray-700 leading-relaxed py-0.5">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part
  )
}
