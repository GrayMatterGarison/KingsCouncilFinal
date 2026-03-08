// api/write.js
// Executes a Sovereign-approved agent write action to the agent's Notion database.
// Parses markdown-style content into Notion blocks for rich, structured documents.

const NOTION_VERSION = '2022-06-28'

// Maps every v3 agent ID to its Notion DB env var
const DB_MAP = {
  chancellor:   'NOTION_DB_CHANCELLOR',
  oracle:       'NOTION_DB_ORACLE',
  scribe:       'NOTION_DB_SCRIBE',
  devil:        'NOTION_DB_DEVIL',
  truthteller:  'NOTION_DB_TRUTHTELLER',
  inspector:    'NOTION_DB_INSPECTOR',
  visionary:    'NOTION_DB_VISIONARY',
  war:          'NOTION_DB_WAR',
  economics:    'NOTION_DB_ECONOMICS',
  justice:      'NOTION_DB_JUSTICE',
  shadows:      'NOTION_DB_SHADOWS',
  people:       'NOTION_DB_PEOPLE',
  herald:       'NOTION_DB_HERALD',
  builder:      'NOTION_DB_BUILDER',
  philosopher:  'NOTION_DB_PHILOSOPHER',
  foreign:      'NOTION_DB_FOREIGN',
  continuity:   'NOTION_DB_CONTINUITY',
  pioneer:      'NOTION_DB_PIONEER',
  knowledge:    'NOTION_DB_KNOWLEDGE',
  tactician:    'NOTION_DB_TACTICIAN',
  sentinel:     'NOTION_DB_SENTINEL',
  trader:       'NOTION_DB_TRADER',
  auditor:      'NOTION_DB_AUDITOR',
  lawmaker:     'NOTION_DB_LAWMAKER',
  enforcer:     'NOTION_DB_ENFORCER',
  analyst:      'NOTION_DB_ANALYST',
  counterintel: 'NOTION_DB_COUNTERINTEL',
  recruiter:    'NOTION_DB_RECRUITER',
  keeper:       'NOTION_DB_KEEPER',
  writer:       'NOTION_DB_WRITER',
  historian:    'NOTION_DB_HISTORIAN',
  architect:    'NOTION_DB_ARCHITECT',
  engineer:     'NOTION_DB_ENGINEER',
  ethicist:     'NOTION_DB_ETHICIST',
  inquisitor:   'NOTION_DB_INQUISITOR',
  envoy:        'NOTION_DB_ENVOY',
  watcher:      'NOTION_DB_WATCHER',
  resilience:   'NOTION_DB_RESILIENCE',
  crisis:       'NOTION_DB_CRISIS',
  scout:        'NOTION_DB_SCOUT',
  integrator:   'NOTION_DB_INTEGRATOR',
  pedagogue:    'NOTION_DB_PEDAGOGUE',
  curator:      'NOTION_DB_CURATOR',
}

// Safely truncate a string to Notion's 2000-char rich_text limit
function safe(str, max = 2000) {
  return (str || '').slice(0, max)
}

// Convert markdown-style text into Notion block objects.
// Handles: ## headings, ### sub-headings, * bullet lines, paragraphs
function markdownToBlocks(text) {
  const lines  = text.split('\n')
  const blocks = []
  let   para   = []

  const flushPara = () => {
    const joined = para.join(' ').trim()
    if (joined) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: safe(joined) } }] },
      })
    }
    para = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (/^## /.test(line)) {
      flushPara()
      blocks.push({ object:'block', type:'heading_2', heading_2:{ rich_text:[{ type:'text', text:{ content: safe(line.replace(/^## /,'')) } }] } })
      continue
    }
    if (/^### /.test(line)) {
      flushPara()
      blocks.push({ object:'block', type:'heading_3', heading_3:{ rich_text:[{ type:'text', text:{ content: safe(line.replace(/^### /,'')) } }] } })
      continue
    }
    if (/^[\*\-] /.test(line) || /^\d+\. /.test(line)) {
      flushPara()
      const t = line.replace(/^[\*\-] /,'').replace(/^\d+\. /,'')
      blocks.push({ object:'block', type:'bulleted_list_item', bulleted_list_item:{ rich_text:[{ type:'text', text:{ content: safe(t) } }] } })
      continue
    }
    if (/^[-\*]{3,}$/.test(line.trim())) {
      flushPara()
      blocks.push({ object:'block', type:'divider', divider:{} })
      continue
    }
    if (line.trim() === '') { flushPara(); continue }
    para.push(line)
  }
  flushPara()

  return blocks.slice(0, 100) // Notion max 100 blocks per request
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { agentId, agentName, target, content, venture = 'Kingdom Alpha' } = req.body

  if (!agentId || !content) {
    return res.status(400).json({ error: 'Missing agentId or content' })
  }
  if (!process.env.NOTION_TOKEN) {
    return res.status(200).json({ success: false, reason: 'NOTION_TOKEN not configured' })
  }

  const envKey = DB_MAP[agentId]
  const dbId   = envKey ? process.env[envKey] : null

  if (!dbId) {
    return res.status(200).json({
      success: false,
      reason: `No Notion DB configured for ${agentId}. Add ${envKey || 'NOTION_DB_' + agentId.toUpperCase()} to environment variables.`,
    })
  }

  const today   = new Date().toISOString().split('T')[0]
  const title   = target || `${agentName || agentId} — Doctrine`
  const summary = content.split('\n').find(l => l.trim()) || title
  const blocks  = markdownToBlocks(content)

  try {
    const pageRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: dbId },
        properties: {
          'Entry':        { title:     [{ text: { content: safe(title, 200) } }] },
          'Type':         { select:    { name: 'Doctrine' } },
          'Session Date': { date:      { start: today } },
          'Summary':      { rich_text: [{ text: { content: safe(summary, 200) } }] },
          'Full Content': { rich_text: [{ text: { content: safe(content) } }] },
          'Venture':      { rich_text: [{ text: { content: safe(venture, 100) } }] },
          'Status':       { select:    { name: 'Active' } },
        },
        children: blocks,
      }),
    })

    const data = await pageRes.json()

    if (!pageRes.ok) {
      console.error('Notion write error:', data)
      return res.status(200).json({ success: false, reason: data.message || 'Notion error' })
    }

    return res.status(200).json({ success: true, id: data.id, url: data.url })

  } catch (err) {
    console.error('Write API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
