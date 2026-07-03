import { SOP_RESOURCES } from '../data/sopResources'

const TYPE_CONFIG = {
  'application/vnd.google-apps.spreadsheet': {
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3h5v2h-5V6zm0 4h5v2h-5v-2zm0 4h5v2h-5v-2zM7 6h3v2H7V6zm0 4h3v2H7v-2zm0 4h3v2H7v-2z"/>
      </svg>
    ),
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Sheet',
  },
  'application/vnd.google-apps.document': {
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
      </svg>
    ),
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Doc',
  },
  'application/pdf': {
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
      </svg>
    ),
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    label: 'PDF',
  },
  'application/vnd.google-apps.presentation': {
    icon: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-7l-3 3.72V9l3 3zm0 0"/>
      </svg>
    ),
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Slides',
  },
}

const DEFAULT_CONFIG = {
  icon: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/>
    </svg>
  ),
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  border: 'border-gray-200',
  label: 'File',
}

export default function SOPResources({ pageId }) {
  const resources = SOP_RESOURCES[pageId]
  if (!resources || resources.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Resources & Tools
      </p>
      <div className="flex flex-wrap gap-2">
        {resources.map((r, i) => {
          const cfg = TYPE_CONFIG[r.mimeType] || DEFAULT_CONFIG
          return (
            <a
              key={i}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open ${r.name}`}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
                transition-all hover:shadow-sm hover:-translate-y-0.5 active:scale-95
                ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.icon}
              <span>{r.name}</span>
              <svg className="w-3 h-3 opacity-40 flex-shrink-0" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )
        })}
      </div>
    </div>
  )
}
