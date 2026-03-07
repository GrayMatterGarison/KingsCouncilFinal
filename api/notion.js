// api/notion.js
// Serverless function — Notion integration, token stays server-side

const NOTION_VERSION = '2022-06-28'

async function notionRequest(path, method = 'GET', body = null) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { action } = req.query

  try {
    // ── GET ESCALATIONS ─────────────────────────────────────────
    if (req.method === 'GET' && action === 'escalations') {
      const dbId = process.env.NOTION_ESCALATION_DB_ID
      if (!dbId) return res.status(200).json({ results: [] })
      const data = await notionRequest(`/databases/${dbId}/query`, 'POST', {
        filter: { property: 'Status', select: { equals: 'Open' } },
        sorts: [{ property: 'Created', direction: 'descending' }],
        page_size: 10,
      })
      return res.status(200).json(data)
    }

    // ── GET TASKS ────────────────────────────────────────────────
    if (req.method === 'GET' && action === 'tasks') {
      const dbId = process.env.NOTION_TASKS_DB_ID
      if (!dbId) return res.status(200).json({ results: [] })
      const data = await notionRequest(`/databases/${dbId}/query`, 'POST', {
        filter: { property: 'Status', select: { does_not_equal: 'Done' } },
        sorts: [{ property: 'Priority', direction: 'descending' }],
        page_size: 20,
      })
      return res.status(200).json(data)
    }

    // ── GET VENTURES ─────────────────────────────────────────────
    if (req.method === 'GET' && action === 'ventures') {
      const dbId = process.env.NOTION_VENTURES_DB_ID
      if (!dbId) return res.status(200).json({ results: [] })
      const data = await notionRequest(`/databases/${dbId}/query`, 'POST', {
        sorts: [{ property: 'Created', direction: 'descending' }],
        page_size: 10,
      })
      return res.status(200).json(data)
    }

    // ── LOG DECISION ─────────────────────────────────────────────
    if (req.method === 'POST' && action === 'log-decision') {
      const dbId = process.env.NOTION_DECISIONS_DB_ID
      if (!dbId) return res.status(200).json({ success: false, reason: 'No DB configured' })
      const { title, operative, summary } = req.body
      const data = await notionRequest('/pages', 'POST', {
        parent: { database_id: dbId },
        properties: {
          'Name': { title: [{ text: { content: title || 'Decision' } }] },
          'Operative': { rich_text: [{ text: { content: operative || '' } }] },
          'Summary': { rich_text: [{ text: { content: summary || '' } }] },
        },
      })
      return res.status(200).json({ success: true, id: data.id })
    }

    // ── LOG ESCALATION ───────────────────────────────────────────
    if (req.method === 'POST' && action === 'escalate') {
      const dbId = process.env.NOTION_ESCALATION_DB_ID
      if (!dbId) return res.status(200).json({ success: false, reason: 'No DB configured' })
      const { title, operative, details } = req.body
      const data = await notionRequest('/pages', 'POST', {
        parent: { database_id: dbId },
        properties: {
          'Name': { title: [{ text: { content: title || 'Escalation' } }] },
          'Operative': { rich_text: [{ text: { content: operative || '' } }] },
          'Details': { rich_text: [{ text: { content: details || '' } }] },
          'Status': { select: { name: 'Open' } },
        },
      })
      return res.status(200).json({ success: true, id: data.id })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('Notion API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
