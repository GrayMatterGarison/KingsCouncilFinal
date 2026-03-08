// api/context.js
// Fetches Kingdom Context + agent memory from Notion
// Injected into every agent call as enriched system prompt
// Kingdom Intelligence Architecture v3 — 43 agents

const NOTION_VERSION = '2022-06-28'
const KINGDOM_CONTEXT_PAGE_ID = '31d7753f916481e5ab8beff6fbd4bebf'

// ─────────────────────────────────────────────────────────────────────────────
// V3 DB MAP — maps agentId → Vercel env var name
// ─────────────────────────────────────────────────────────────────────────────
const DB_MAP = {

  // Tier I
  sovereign:    'NOTION_DB_SOVEREIGN',

  // Inner Council
  chancellor:   'NOTION_DB_CHANCELLOR',
  oracle:       'NOTION_DB_ORACLE',
  scribe:       'NOTION_DB_SCRIBE',
  devil:        'NOTION_DB_DEVIL',
  truthteller:  'NOTION_DB_TRUTHTELLER',
  inspector:    'NOTION_DB_INSPECTOR',
  visionary:    'NOTION_DB_VISIONARY',

  // Tier II — Ministers
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

  // Tier III — Operatives
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

// Full list of all agent IDs for COUNCIL_CALL reference
const ALL_AGENT_IDS = Object.keys(DB_MAP)

// ─────────────────────────────────────────────────────────────────────────────
// NOTION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT FETCHERS
// ─────────────────────────────────────────────────────────────────────────────

async function getKingdomContext() {
  if (!process.env.NOTION_TOKEN) return ''
  try {
    const page = await notionGet(`/blocks/${KINGDOM_CONTEXT_PAGE_ID}/children?page_size=50`)
    return extractText(page.results || [])
  } catch { return '' }
}

// Fetches Knowledge entries — doctrine, frameworks, reference material
// These load on every session (higher limit, sorted by created so they stay stable)
async function getAgentKnowledge(dbId, limit = 20) {
  try {
    const data = await notionPost(`/databases/${dbId}/query`, {
      filter: {
        property: 'Type', select: { equals: 'Knowledge' }
      },
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
      page_size: limit,
    })
    if (!data.results || data.results.length === 0) return ''
    return data.results.map(r => {
      const props   = r.properties || {}
      const entry   = props.Entry?.title?.[0]?.plain_text || ''
      const content = props['Full Content']?.rich_text?.[0]?.plain_text || ''
      const summary = props.Summary?.rich_text?.[0]?.plain_text || ''
      return `[KNOWLEDGE] ${entry}\n${content || summary}`.trim()
    }).join('\n\n---\n\n')
  } catch { return '' }
}

// Fetches recent session memory — Directives, Briefs, Conversations
// These load the most recent N entries so the agent knows what happened lately
async function getAgentSessionMemory(dbId, limit = 5) {
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
      const props   = r.properties || {}
      const entry   = props.Entry?.title?.[0]?.plain_text || ''
      const type    = props.Type?.select?.name || ''
      const summary = props.Summary?.rich_text?.[0]?.plain_text || ''
      const content = props['Full Content']?.rich_text?.[0]?.plain_text || ''
      return `[${type.toUpperCase()}] ${entry}\n${summary || content}`.trim()
    }).join('\n\n---\n\n')
  } catch { return '' }
}

async function getAgentMemory(agentId) {
  if (!process.env.NOTION_TOKEN) return { knowledge: '', sessions: '' }

  const envKey = DB_MAP[agentId]
  if (!envKey) return { knowledge: '', sessions: '' }

  const dbId = process.env[envKey]
  if (!dbId) return { knowledge: '', sessions: '' }

  const [knowledge, sessions] = await Promise.all([
    getAgentKnowledge(dbId),
    getAgentSessionMemory(dbId),
  ])
  return { knowledge, sessions }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — builds enriched system prompt
// ─────────────────────────────────────────────────────────────────────────────

export async function buildSystemPrompt(agentId, basePrompt) {
  const [kingdomCtx, { knowledge, sessions }] = await Promise.all([
    getKingdomContext(),
    getAgentMemory(agentId),
  ])

  let enriched = basePrompt

  if (kingdomCtx) {
    enriched += `\n\n━━━ KINGDOM CONTEXT ━━━\n${kingdomCtx}`
  }

  if (knowledge) {
    enriched += `\n\n━━━ YOUR DOCTRINE & KNOWLEDGE BASE ━━━\nThe following frameworks and doctrine are permanently loaded into your operating mind. They inform every recommendation you make.\n\n${knowledge}`
  }

  if (sessions) {
    enriched += `\n\n━━━ RECENT MEMORY & DIRECTIVES ━━━\n${sessions}`
  }

  enriched += `\n\n━━━ COUNCIL PROTOCOL ━━━
You are part of a 43-agent Kingdom Intelligence Architecture. When your response requires expertise outside your domain, you MAY signal a delegation by appending a JSON block at the END of your response in this exact format:

<COUNCIL_CALL>
{"delegate": ["agent_id_1", "agent_id_2"], "brief": "One sentence briefing for the called agents"}
</COUNCIL_CALL>

Agent IDs you can delegate to:
TIER I: sovereign
INNER COUNCIL: chancellor, oracle, scribe, devil, truthteller, inspector, visionary
MINISTERS: war, economics, justice, shadows, people, herald, builder, philosopher, foreign, continuity, pioneer, knowledge
OPERATIVES: tactician, sentinel, trader, auditor, lawmaker, enforcer, analyst, counterintel, recruiter, keeper, writer, historian, architect, engineer, ethicist, inquisitor, envoy, watcher, resilience, crisis, scout, integrator, pedagogue, curator

Rules: Only delegate when genuinely needed. Never delegate to yourself. Always complete your own domain response first, then append the COUNCIL_CALL block if needed.`

  return enriched
}

// ─────────────────────────────────────────────────────────────────────────────
// API HANDLER — exposes context fetch as a standalone endpoint
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Support both agentId (v3) and operativeId (v1 legacy)
  const { agentId, operativeId } = req.body || {}
  const id = agentId || operativeId

  if (!id) return res.status(400).json({ error: 'Missing agentId' })

  const [kingdomCtx, memory] = await Promise.all([
    getKingdomContext(),
    getAgentMemory(id),
  ])

  return res.status(200).json({ kingdomCtx, memory })
}
