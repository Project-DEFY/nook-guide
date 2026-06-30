export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(204).end()

  const notionKey = process.env.NOTION_API_KEY
  if (!notionKey) return res.status(500).json({ error: 'NOTION_API_KEY not configured', results: [] })

  const query = req.query.q || ''

  try {
    const notionRes = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        filter: { value: 'page', property: 'object' },
        page_size: 20,
      }),
    })

    const data = await notionRes.json()

    const results = (data.results || []).map(page => {
      const titleProp = page.properties?.title || page.properties?.Name
      const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled'
      return { id: page.id, title, url: page.url }
    })

    return res.status(200).json({ results })
  } catch (err) {
    return res.status(500).json({ error: err.message, results: [] })
  }
}
