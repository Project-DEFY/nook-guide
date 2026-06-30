export default async (req, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    return new Response(JSON.stringify({ error: 'NOTION_API_KEY not configured', results: [] }), { status: 500, headers });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get('q') || '';

  try {
    const res = await fetch('https://api.notion.com/v1/search', {
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
    });

    const data = await res.json();

    const results = (data.results || []).map(page => {
      const titleProp = page.properties?.title || page.properties?.Name;
      const title = titleProp?.title?.map(t => t.plain_text).join('') || 'Untitled';
      return { id: page.id, title, url: page.url };
    });

    return new Response(JSON.stringify({ results }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, results: [] }), { status: 500, headers });
  }
};
