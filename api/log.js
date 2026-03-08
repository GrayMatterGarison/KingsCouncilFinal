// api/log.js
// Logs conversations and outputs to each operative's individual Notion database
// Called automatically when a chat session ends or the user saves a session

const NOTION_VERSION = '2022-06-28'

// Map operative ID → Notion DB env var name
const DB_MAP = {
  cipher:    'NOTION_DB_CIPHER',
  vault:     'NOTION_DB_VAULT',
  oracle:    'NOTION_DB_ORACLE',
  shadow:    'NOTION_DB_SHADOW',
  commander: 'NOTION_DB_COMMANDER',
  director:  'NOTION_DB_DIRECTOR',
  marshal:   'NOTION_DB_MARSHAL',
  operator:  'NOTION_DB_OPERATOR',
  scriptor:  'NOTION_DB_SCRIPTOR',
  lens:      'NOTION_DB_LENS',
  vanguard:  'NOTION_DB_VANGUARD',
  signal:    'NOTION_DB_SIGNAL',
  reel:      'NOTION_DB_REEL',
  broker:    'NOTION_DB_BROKER',
  warden:    'NOTION_DB_WARDEN',
  architect: 'NOTION_DB_ARCHITECT',
}

function getDbId(operativeId) {
  const envKey = DB_MAP[operativeId]
  return envKey ? process.env[envKey] : null
}

function buildConversationText(messages) {
  return messages
    .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
    .join('\n\n---\n\n')
}

function buildSummary(messages) {
  // First user message as the summary title
  const firstUser = messages.find(m => m.role === 'user')
  if (!firstUser) return 'Session'
  const text = firstUser.content.slice(0, 80)
  return text.length < firstUser.content.length ? text + '...' : text
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { operativeId, operativeName, messages, type = 'Conversation', venture = 'Kingdom Alpha' } = req.body

  if (!operativeId || !messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing operativeId or messages' })
  }

  const dbId = getDbId(operativeId)
  if (!dbId) {
    return res.status(200).json({ success: false, reason: `No Notion DB configured for ${operativeId}. Add NOTION_DB_${operativeId.toUpperCase()} to environment variables.` })
  }

  if (!process.env.NOTION_TOKEN) {
    return res.status(200).json({ success: false, reason: 'NOTION_TOKEN not configured' })
  }

  try {
    const summary = buildSummary(messages)
    const fullContent = buildConversationText(messages)
    const today = new Date().toISOString().split('T')[0]

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          'Entry': {
            title: [{ text: { content: summary } }]
          },
          'Type': {
            select: { name: type }
          },
          'Session Date': {
            date: { start: today }
          },
          'Summary': {
            rich_text: [{ text: { content: summary } }]
          },
          'Full Content': {
            rich_text: [{ text: { content: fullContent.slice(0, 2000) } }]
          },
          'Venture': {
            rich_text: [{ text: { content: venture } }]
          },
          'Status': {
            select: { name: 'Active' }
          },
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Notion log error:', data)
      return res.status(200).json({ success: false, reason: data.message || 'Notion error' })
    }

    return res.status(200).json({ success: true, id: data.id, url: data.url })
  } catch (err) {
    console.error('Log API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
