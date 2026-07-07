const SUPABASE_URL = 'https://kgvnllmxhepbrzwovrjb.supabase.co'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!serviceRoleKey) return res.status(500).json({ error: 'Server misconfigured' })

  // Verify caller is authenticated (has a valid JWT)
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  // Parse body
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}

  const { email, password, fullName, role, nookLocation } = body
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password and role are required' })
  }

  try {
    // 1. Create auth user via Supabase Admin REST API
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || '' },
      }),
    })

    const authData = await authRes.json()

    if (!authRes.ok) {
      const msg = authData.msg || authData.message || authData.error_description || authData.error || JSON.stringify(authData)
      return res.status(400).json({ error: msg })
    }

    const userId = authData.id
    if (!userId) return res.status(500).json({ error: 'User created but no ID returned' })

    // 2. Upsert access row via PostgREST
    const accessRes = await fetch(`${SUPABASE_URL}/rest/v1/nook_guide_access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        full_name: fullName || email.split('@')[0],
        nook_role: role,
        nook_location: nookLocation || null,
      }),
    })

    if (!accessRes.ok) {
      const accessData = await accessRes.json().catch(() => ({}))
      return res.status(200).json({
        success: true,
        warning: 'User created but access row failed: ' + (accessData.message || JSON.stringify(accessData)),
      })
    }

    return res.status(200).json({ success: true })

  } catch (err) {
    return res.status(500).json({ error: 'Unexpected error: ' + (err?.message || String(err)) })
  }
}
