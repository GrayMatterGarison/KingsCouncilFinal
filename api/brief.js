// api/brief.js
// The Cipher's morning brief — aggregates Notion tasks + escalations,
// passes to Claude, returns structured brief for the dashboard

const NOTION_VERSION = '2022-06-28'

async function notionQuery(dbId, filter, sorts) {
  if (!dbId) return []
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filter, sorts, page_size: 10 }),
    })
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

function extractTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(p => p.type === 'title')
  return titleProp?.title?.[0]?.text?.content || 'Untitled'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // Pull data from Notion in parallel
    const [escalations, tasks, ventures] = await Promise.all([
      notionQuery(
        process.env.NOTION_ESCALATION_DB_ID,
        { property: 'Status', select: { equals: 'Open' } },
        [{ property: 'Created', direction: 'descending' }]
      ),
      notionQuery(
        process.env.NOTION_TASKS_DB_ID,
        { property: 'Status', select: { does_not_equal: 'Done' } },
        [{ property: 'Priority', direction: 'descending' }]
      ),
      notionQuery(
        process.env.NOTION_VENTURES_DB_ID,
        null,
        [{ property: 'Created', direction: 'descending' }]
      ),
    ])

    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const context = `
DATE: ${date}

OPEN ESCALATIONS (${escalations.length}):
${escalations.map(e => `- ${extractTitle(e)}`).join('\n') || '- None'}

ACTIVE TASKS (${tasks.length}):
${tasks.map(t => `- ${extractTitle(t)}`).join('\n') || '- None'}

ACTIVE VENTURES (${ventures.length}):
${ventures.map(v => `- ${extractTitle(v)}`).join('\n') || '- Kingdom Alpha'}
`.trim()

    // Ask Claude to synthesize the brief
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: `You are THE CIPHER, Chief of Staff to the Sovereign. Generate a morning brief from the Kingdom's operational data. Be direct and tactical. Format: 1) STATUS (one line: GREEN/YELLOW/RED + one sentence why), 2) PRIORITY ACTIONS (max 3 bullet points, action-oriented), 3) WATCH LIST (1-2 items requiring Sovereign attention). Keep total under 150 words. Military precision.`,
        messages: [{ role: 'user', content: `Generate morning brief from this data:\n\n${context}` }],
      }),
    })

    const claudeData = await claudeRes.json()
    const brief = claudeData.content?.[0]?.text || 'Brief unavailable — check API key.'

    return res.status(200).json({
      date,
      brief,
      counts: {
        escalations: escalations.length,
        tasks: tasks.length,
        ventures: ventures.length,
      },
    })
  } catch (err) {
    console.error('Brief error:', err)
    return res.status(500).json({ error: 'Failed to generate brief' })
  }
}
