import { allSections } from './guideStructure'
import { PAGE_CONTENT } from '../data/pageContent'

// Strip HTML to plain text once at module load
function htmlToText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Pre-compute once — plain text per section
export const SEARCH_INDEX = allSections().map(section => {
  const staticData = PAGE_CONTENT[section.id]
  const plainText = staticData?.html
    ? htmlToText(staticData.html)
    : (section.description || '')
  return { ...section, plainText }
})

// Extract a snippet around the first match
export function getSnippet(text, query, before = 55, after = 85) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return null
  const start = Math.max(0, idx - before)
  const end = Math.min(text.length, idx + query.length + after)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}

// Highlight a query match inside a string — returns array for React rendering
export function highlightMatch(text, query) {
  if (!query.trim()) return [text]
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return [text]
  return [
    text.slice(0, idx),
    { highlight: true, text: text.slice(idx, idx + query.length) },
    text.slice(idx + query.length),
  ]
}

// Main search function — returns ranked results with snippet
export function searchContent(query, maxResults = 50) {
  const lower = query.toLowerCase().trim()
  if (!lower) return []

  const results = []
  for (const section of SEARCH_INDEX) {
    const titleMatch = section.title.toLowerCase().includes(lower)
    const descMatch = section.description?.toLowerCase().includes(lower)
    const contentMatch = section.plainText.toLowerCase().includes(lower)

    if (titleMatch || descMatch || contentMatch) {
      // Prefer a content snippet showing the match; fall back to description
      let snippet = null
      if (contentMatch && !titleMatch) {
        snippet = getSnippet(section.plainText, query)
      } else if (contentMatch && titleMatch) {
        // title matched — show description as context, not a content snippet
        snippet = section.description || getSnippet(section.plainText, query)
      } else if (descMatch) {
        snippet = section.description
      }

      results.push({ ...section, titleMatch, descMatch, contentMatch, snippet })
    }
    if (results.length >= maxResults) break
  }

  // Title matches first, then desc matches, then content-only
  return results.sort((a, b) => {
    const scoreA = a.titleMatch ? 2 : a.descMatch ? 1 : 0
    const scoreB = b.titleMatch ? 2 : b.descMatch ? 1 : 0
    return scoreB - scoreA
  })
}
