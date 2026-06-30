/**
 * Fetches all Notion pages referenced in guideStructure and writes
 * src/data/pageContent.js as a static ES module.
 *
 * Run: node scripts/fetch-notion-content.mjs
 * Requires NOTION_API_KEY in .env (or set as env var)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Read NOTION_API_KEY from .env
function loadEnv() {
  try {
    const env = readFileSync(resolve(root, '.env'), 'utf8')
    for (const line of env.split('\n')) {
      const [k, ...rest] = line.split('=')
      if (k?.trim() === 'NOTION_API_KEY') return rest.join('=').trim()
    }
  } catch {}
  return process.env.NOTION_API_KEY
}

const NOTION_KEY = loadEnv()
if (!NOTION_KEY) {
  console.error('NOTION_API_KEY not found in .env')
  process.exit(1)
}

const HEADERS = {
  Authorization: `Bearer ${NOTION_KEY}`,
  'Notion-Version': '2022-06-28',
}

// ── All page IDs from guideStructure ─────────────────────────────────────────
const PAGE_IDS = [
  // Part 0 – Understanding Nook
  '379fef71-1233-81b1-ab23-dbf7daff242c',
  '379fef71-1233-8168-9862-c52f289c785c',
  '379fef71-1233-81a4-a6fc-fd3abc3e4054',
  '379fef71-1233-812d-ad71-d46291ffe226',
  // Part 1 – The V2.1 Model
  '379fef71-1233-81d1-932b-f382f3ec3eeb',
  '379fef71-1233-811d-bb34-e7340ed66e08',
  '379fef71-1233-8131-aae9-d7037f1fe856',
  '379fef71-1233-8114-968f-ead5a3221183',
  '379fef71-1233-81ff-b26e-c9d6a88e5393',
  // Part 2 – Community Activation
  '379fef71-1233-81ed-b305-c1255b7d75cc',
  '379fef71-1233-81c0-969a-fb99abc3536b',
  '379fef71-1233-8148-86c0-cd07bf3cdc4b',
  '379fef71-1233-8108-8dc1-d27b0a395ea2',
  '379fef71-1233-81a8-b4dd-cf4bba28e61e',
  // Part 3 – Learning Cycle Design
  '379fef71-1233-81dc-8e06-e1791823d58f',
  '379fef71-1233-817c-9ef7-eb6591d1884f',
  '379fef71-1233-81b0-94bd-ddf23682c6d5',
  '379fef71-1233-8195-bee7-fd01fa90d3ea',
  '379fef71-1233-813d-bfe3-fe6edad234b1',
  // Part 4 – Institutional Operations
  '379fef71-1233-8134-b86a-dbc46f024de2',
  '379fef71-1233-81bb-b46f-db7997869eb0',
  '379fef71-1233-81fd-98c0-e4b5d5b946fe',
  '379fef71-1233-81ba-84c8-eb446a993bbd',
  '379fef71-1233-8166-b27f-e3f0998fdb68',
  // Part 5 – Learning Quality & Culture
  '379fef71-1233-8104-a942-db4661a81e7e',
  '379fef71-1233-813b-9228-e58e519c3995',
  '379fef71-1233-8189-ae1e-ebf04959875a',
  '379fef71-1233-81fb-aed9-d35245e6c391',
  // Part 6 – V2.1 New Additions
  '379fef71-1233-8168-b40b-ee6f1e075858',
  '379fef71-1233-815b-b876-fb0e5b6a1249',
  '379fef71-1233-817e-a0d4-f7d2f7b18335',
  '379fef71-1233-8194-a693-f16b404e95df',
  '379fef71-1233-8147-ac3a-c131b1b85102',
  // Part 7 – M&E Framework
  '379fef71-1233-8124-86db-edc43a2ccdf7',
  '379fef71-1233-8156-96dd-f520c844e6dd',
  '379fef71-1233-8103-9add-c16586cb0047',
  '379fef71-1233-81fb-87f3-d0b49cbc64c6',
  '379fef71-1233-8134-b181-e0036a20b25b',
  '379fef71-1233-817e-b833-d8b92abe207f',
  // Part 8 – Impact & Donor Reporting
  '379fef71-1233-81af-b255-fa8378165d02',
  '379fef71-1233-81f6-80b8-e0d996c05980',
  '379fef71-1233-81d4-9451-ed62bdd4a733',
  '379fef71-1233-8183-921a-e91a27fabaa3',
  // Part 9 – Infrastructure & Setup
  '379fef71-1233-81d0-8ceb-c5eaa57ea649',
  '379fef71-1233-819f-b317-e8f21b53df99',
  '379fef71-1233-8190-8261-ce4074e8219d',
]

// ── Notion rendering helpers (same logic as api/notion-fetch.js) ──────────────

function richTextToText(richText) {
  if (!richText?.length) return ''
  return richText.map(t => t.plain_text || '').join('')
}

function richTextToHtml(richText) {
  if (!richText?.length) return ''
  return richText.map(t => {
    let text = t.plain_text || ''
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (t.annotations?.bold) text = `<strong>${text}</strong>`
    if (t.annotations?.italic) text = `<em>${text}</em>`
    if (t.annotations?.code) text = `<code>${text}</code>`
    if (t.annotations?.strikethrough) text = `<del>${text}</del>`
    if (t.href) text = `<a href="${t.href}" target="_blank" rel="noopener noreferrer">${text}</a>`
    return text
  }).join('')
}

async function renderTable(blockId) {
  const resp = await fetch(
    `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`,
    { headers: HEADERS }
  )
  const data = await resp.json()
  const rows = data.results || []
  let html = '<table>'
  rows.forEach((row, i) => {
    const cells = row.table_row?.cells || []
    html += '<tr>'
    cells.forEach(cell => {
      const cellHtml = richTextToHtml(cell)
      const tag = i === 0 ? 'th' : 'td'
      html += `<${tag}>${cellHtml}</${tag}>`
    })
    html += '</tr>'
  })
  html += '</table>'
  return html
}

async function fetchBlocksHtml(blockId, depth = 0) {
  if (depth > 4) return ''
  let html = ''
  let cursor
  let listState = null

  const closeList = () => {
    if (listState) { html += `</${listState}>`; listState = null }
  }

  do {
    const params = new URLSearchParams({ page_size: '100' })
    if (cursor) params.set('start_cursor', cursor)

    const resp = await fetch(
      `https://api.notion.com/v1/blocks/${blockId}/children?${params}`,
      { headers: HEADERS }
    )
    const data = await resp.json()

    for (const block of (data.results || [])) {
      const type = block.type
      const content = block[type] || {}
      const text = richTextToHtml(content.rich_text || [])

      if (type === 'bulleted_list_item') {
        if (listState !== 'ul') { closeList(); html += '<ul>'; listState = 'ul' }
        html += `<li>${text}`
        if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
        html += '</li>'
      } else if (type === 'numbered_list_item') {
        if (listState !== 'ol') { closeList(); html += '<ol>'; listState = 'ol' }
        html += `<li>${text}`
        if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
        html += '</li>'
      } else {
        closeList()
        if (type === 'paragraph') {
          html += text ? `<p>${text}</p>` : '<br>'
          if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
        } else if (type === 'heading_1') {
          html += `<h1>${text}</h1>`
        } else if (type === 'heading_2') {
          html += `<h2>${text}</h2>`
        } else if (type === 'heading_3') {
          html += `<h3>${text}</h3>`
        } else if (type === 'heading_4') {
          html += `<h4>${text}</h4>`
        } else if (type === 'quote') {
          html += `<blockquote>${text}</blockquote>`
        } else if (type === 'divider') {
          html += '<hr>'
        } else if (type === 'code') {
          const code = (content.rich_text || []).map(t => t.plain_text).join('')
          const lang = content.language || ''
          const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          html += `<pre><code class="language-${lang}">${escaped}</code></pre>`
        } else if (type === 'callout') {
          const emoji = content.icon?.emoji || '💡'
          html += `<blockquote><strong>${emoji}</strong> ${text}</blockquote>`
          if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
        } else if (type === 'table') {
          html += await renderTable(block.id)
        } else if (type === 'toggle') {
          html += `<details><summary>${text}</summary>`
          if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
          html += '</details>'
        } else if (type === 'child_page') {
          html += `<p><em>→ ${content.title || 'Linked page'}</em></p>`
        } else if (type === 'image') {
          const imgUrl = content.type === 'external' ? content.external?.url : content.file?.url
          const caption = richTextToText(content.caption || [])
          if (imgUrl) {
            html += `<figure><img src="${imgUrl}" alt="${caption || ''}" style="max-width:100%;border-radius:8px;" /></figure>`
            if (caption) html += `<figcaption style="text-align:center;font-size:0.85em;color:#666;">${caption}</figcaption>`
          }
        } else if (type === 'column_list' || type === 'column') {
          if (block.has_children) html += await fetchBlocksHtml(block.id, depth + 1)
        }
      }
    }

    closeList()
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return html
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function fetchPage(pageId) {
  const pageMeta = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: HEADERS,
  }).then(r => r.json())

  const lastEdited = pageMeta.last_edited_time || null
  const html = await fetchBlocksHtml(pageId)
  return { html, lastEdited }
}

async function main() {
  console.log(`Fetching ${PAGE_IDS.length} pages from Notion…\n`)

  const results = {}
  let done = 0

  for (const id of PAGE_IDS) {
    process.stdout.write(`  [${++done}/${PAGE_IDS.length}] ${id} … `)
    try {
      results[id] = await fetchPage(id)
      console.log('✓')
    } catch (err) {
      console.log(`✗ ${err.message}`)
      results[id] = { html: `<p><em>Content temporarily unavailable.</em></p>`, lastEdited: null }
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 350))
  }

  // Write output
  mkdirSync(resolve(root, 'src/data'), { recursive: true })
  const outPath = resolve(root, 'src/data/pageContent.js')

  const output = [
    '// AUTO-GENERATED — run: node scripts/fetch-notion-content.mjs',
    `// Last fetched: ${new Date().toISOString()}`,
    '',
    'export const PAGE_CONTENT = ' + JSON.stringify(results, null, 2),
  ].join('\n')

  writeFileSync(outPath, output, 'utf8')
  console.log(`\n✅ Written to src/data/pageContent.js (${Math.round(output.length / 1024)} KB)`)
}

main().catch(err => { console.error(err); process.exit(1) })
