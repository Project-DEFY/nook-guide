module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const { id: pageId } = req.query
  if (!pageId) return res.status(400).json({ error: 'Missing id' })

  const notionKey = process.env.NOTION_API_KEY
  if (!notionKey) return res.status(500).json({ error: 'NOTION_API_KEY not configured' })

  try {
    const pageMeta = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: { Authorization: `Bearer ${notionKey}`, 'Notion-Version': '2022-06-28' },
    }).then(r => r.json())

    const title = extractTitle(pageMeta)
    const html = await fetchBlocksHtml(pageId, notionKey)

    return res.status(200).json({ html, title })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

function extractTitle(pageMeta) {
  try {
    const titleProp = pageMeta.properties?.title || pageMeta.properties?.Name
    if (titleProp?.title) return richTextToText(titleProp.title)
    return 'Untitled'
  } catch { return 'Untitled' }
}

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

async function fetchBlocksHtml(blockId, notionKey) {
  let html = ''
  let cursor = undefined
  let listState = null

  const closeList = () => {
    if (listState) { html += `</${listState}>`; listState = null }
  }

  do {
    const params = new URLSearchParams({ page_size: '100' })
    if (cursor) params.set('start_cursor', cursor)

    const resp = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children?${params}`, {
      headers: { Authorization: `Bearer ${notionKey}`, 'Notion-Version': '2022-06-28' },
    })
    const data = await resp.json()

    for (const block of (data.results || [])) {
      const type = block.type
      const content = block[type] || {}
      const text = richTextToHtml(content.rich_text || [])

      if (type === 'bulleted_list_item') {
        if (listState !== 'ul') { closeList(); html += '<ul>'; listState = 'ul' }
        html += `<li>${text}`
        if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
        html += '</li>'
      } else if (type === 'numbered_list_item') {
        if (listState !== 'ol') { closeList(); html += '<ol>'; listState = 'ol' }
        html += `<li>${text}`
        if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
        html += '</li>'
      } else {
        closeList()
        if (type === 'paragraph') {
          html += `<p>${text}</p>`
          if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
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
          if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
        } else if (type === 'table') {
          html += await renderTable(block.id, content.has_column_header, notionKey)
        } else if (type === 'toggle') {
          html += `<details><summary>${text}</summary>`
          if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
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
          if (block.has_children) html += await fetchBlocksHtml(block.id, notionKey)
        }
      }
    }

    closeList()
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return html
}

async function renderTable(blockId, hasHeader, notionKey) {
  const resp = await fetch(`https://api.notion.com/v1/blocks/${blockId}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${notionKey}`, 'Notion-Version': '2022-06-28' },
  })
  const data = await resp.json()
  const rows = data.results || []

  let html = '<table>'
  rows.forEach((row, i) => {
    const cells = row.table_row?.cells || []
    html += '<tr>'
    cells.forEach(cell => {
      const cellHtml = richTextToHtml(cell)
      const tag = (i === 0 && hasHeader) ? 'th' : 'td'
      html += `<${tag}>${cellHtml}</${tag}>`
    })
    html += '</tr>'
  })
  html += '</table>'
  return html
}
