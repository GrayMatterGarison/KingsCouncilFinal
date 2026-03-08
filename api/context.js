// api/context.js
// Fetches Kingdom Context + operative memory from Notion
// Injected into every agent call as enriched system prompt

const NOTION_VERSION = '2022-06-28'
const KINGDOM_CONTEXT_PAGE_ID = '31d7753f916481e5ab8beff6fbd4bebf'

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

async function notionGet(path) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
    }
  })
  return res.json()
}

async function notionPost(path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })
  return res.json()
}

function extractText(blocks) {
  if (!blocks || !Array.isArray(blocks)) return ''
  return blocks.map(b => {
    const type = b.type
    const block = b[type]
    if (!block) return ''
    if (block.rich_text) return block.rich_text.map(t => t.plain_text || '').join('')
    return ''
  }).filter(Boolean).join('\n')
}

async function getKingdomContext() {
  if (!process.env.NOTION_TOKEN) return ''
  try {
    const page = await notionGet(`/blocks/${KINGDOM_CONTEXT_PAGE_ID}/children?page_size=50`)
    return extractText(page.results || [])
  } catch { return '' }
}

async function getOperativeMemory(operativeId, limit = 5) {
  if (!process.env.NOTION_TOKEN) return ''
  const envKey = DB_MAP[operativeId]
  if (!envKey) return ''
  const dbId = process.env[envKey]
  if (!dbId) return ''
  try {
    const data = await notionPost(`/databases/${dbId}/query`, {
      filter: {
        or: [
          { property: 'Type', select: { equals: 'Directive' } },
          { property: 'Type', select: { equals: 'Brief' } },
          { property: 'Type', select: { equals: 'Conversation' } },
        ]
      },
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: limit,
    })
    if (!data.results || data.results.length === 0) return ''
    return data.results.map(r => {
      const props = r.properties || {}
      const entry = props.Entry?.title?.[0]?.plain_text || ''
      const type = props.Type?.select?.name || ''
      const summary = props.Summary?.rich_text?.[0]?.plain_text || ''
      const content = props['Full Content']?.rich_text?.[0]?.plain_text || ''
      return `[${type.toUpperCase()}] ${entry}\n${summary || content}`.trim()
    }).join('\n\n---\n\n')
  } catch { return '' }
}

export async function buildSystemPrompt(operativeId, basePrompt) {
  const [kingdomCtx, memory] = await Promise.all([
    getKingdomContext(),
    getOperativeMemory(operativeId)
  ])

  let enriched = basePrompt

  if (kingdomCtx) {
    enriched += `\n\n━━━ KINGDOM CONTEXT ━━━\n${kingdomCtx}`
  }

  if (memory) {
    enriched += `\n\n━━━ YOUR MEMORY & DIRECTIVES ━━━\n${memory}`
  }

  enriched += `\n\n━━━ COUNCIL PROTOCOL ━━━
You are part of a multi-agent system. When you detect your directive requires another operative's domain expertise, you MAY signal a delegation by including a JSON block at the END of your response in this exact format:

<COUNCIL_CALL>
{"delegate": ["operative_id_1", "operative_id_2"], "brief": "One sentence briefing for the called operatives"}
</COUNCIL_CALL>

Operative IDs: cipher, vault, oracle, shadow, commander, director, marshal, operator, scriptor, lens, vanguard, signal, reel, broker, warden, architect

Only call other operatives when genuinely needed. Do not call yourself. Always complete your own domain response first, then append the COUNCIL_CALL block if needed.`

  return enriched
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { operativeId } = req.body || {}
  if (!operativeId) return res.status(400).json({ error: 'Missing operativeId' })

  const [kingdomCtx, memory] = await Promise.all([
    getKingdomContext(),
    getOperativeMemory(operativeId)
  ])

  return res.status(200).json({ kingdomCtx, memory })
}
