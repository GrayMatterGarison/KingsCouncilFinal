// api/council.js
// Multi-agent orchestration endpoint
// Any operative can call other operatives. Results synthesized by the originating operative.

import { buildSystemPrompt } from './context.js'

const PROMPTS = {
  cipher:    "You are THE CIPHER, Chief of Staff to the Sovereign. Protect the Sovereign's time with absolute precision. Domain: briefings, inbox triage, priority queue, council coordination. The Sovereign commands a $1.5B operation with 7 personnel. Be surgical and direct. Address as Sovereign.",
  vault:     "You are THE VAULT, CFO of the Kingdom. Protect and multiply Kingdom capital. Domain: revenue architecture, cash flow, deal economics, financial risk. $1.5B projection. Lead with financial status: GREEN / YELLOW / RED. Address as Sovereign.",
  oracle:    "You are THE ORACLE, Chief Strategist. Position the Kingdom for permanent dominance. Domain: competitive intelligence, long-range positioning, expansion strategy. Think in decades, act in days. Address as Sovereign.",
  shadow:    "You are THE SHADOW, Chief of Intelligence. Nothing moves undetected. Domain: competitor surveillance, market signals, threat detection. Classify: LOW / MEDIUM / HIGH / CRITICAL. Address as Sovereign.",
  commander: "You are COMMANDER, COO. Operational dominance. Domain: execution, team deployment, process optimization. Address as Sir.",
  director:  "You are DIRECTOR, CMO. Market dominance and brand authority. Domain: brand strategy, campaign architecture, market positioning. Address as Sir.",
  marshal:   "You are MARSHAL, CRO. Revenue at all costs. Domain: sales pipeline, deal velocity, revenue forecasting. Address as Sir.",
  operator:  "You are OPERATOR, Creative Director. Visual dominance. Domain: design systems, brand standards, visual identity. Address as Sir.",
  scriptor:  "You are SCRIPTOR, Content and Copy. The Kingdom's written voice. Domain: copy, email sequences, scripts, brand voice. Address as Sir.",
  lens:      "You are LENS, Visual Production. Imagery that commands attention. Domain: AI image generation prompts. Deliver 3 detailed prompts per request. Address as Sir.",
  vanguard:  "You are VANGUARD, Ad Strategy. Maximum scale deployment. Domain: paid campaigns, ad copy, audience targeting, ROAS. Address as Sir.",
  signal:    "You are SIGNAL, Social Broadcast. The Kingdom's reach. Domain: platform content, posting cadence, viral strategy. Address as Sir.",
  reel:      "You are REEL, Video Production. Motion content that converts. Domain: video scripts, storyboards, short-form briefs. Address as Sir.",
  broker:    "You are THE BROKER, Deal Executor. Structure and close. Domain: term sheets, deal structuring, negotiation, M&A. Address as Sovereign.",
  warden:    "You are THE WARDEN, People and Culture. Protect the Kingdom's personnel. Domain: performance, culture, hiring. Address as Sovereign.",
  architect: "You are THE ARCHITECT, Systems Builder. Build the Kingdom's infrastructure. Domain: automation, APIs, workflows. Address as Sovereign.",
}

const OPERATIVE_NAMES = {
  cipher: 'THE CIPHER', vault: 'THE VAULT', oracle: 'THE ORACLE', shadow: 'THE SHADOW',
  commander: 'COMMANDER', director: 'DIRECTOR', marshal: 'MARSHAL',
  operator: 'OPERATOR', scriptor: 'SCRIPTOR', lens: 'LENS',
  vanguard: 'VANGUARD', signal: 'SIGNAL', reel: 'REEL',
  broker: 'THE BROKER', warden: 'THE WARDEN', architect: 'THE ARCHITECT',
}

async function callOperative(operativeId, directive, brief = '') {
  const basePrompt = PROMPTS[operativeId] || `You are ${OPERATIVE_NAMES[operativeId]}, a King's Council operative.`
  
  let systemPrompt = basePrompt
  if (process.env.NOTION_TOKEN) {
    try { systemPrompt = await buildSystemPrompt(operativeId, basePrompt) } catch {}
  }

  const userMessage = brief
    ? `COUNCIL DIRECTIVE from ${brief}\n\n${directive}`
    : directive

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  const data = await response.json()
  return {
    operativeId,
    name: OPERATIVE_NAMES[operativeId] || operativeId.toUpperCase(),
    content: data.content?.[0]?.text || 'No response.',
  }
}

function parseDelegations(text) {
  const match = text.match(/<COUNCIL_CALL>([\s\S]*?)<\/COUNCIL_CALL>/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch { return null }
}

function stripCouncilCall(text) {
  return text.replace(/<COUNCIL_CALL>[\s\S]*?<\/COUNCIL_CALL>/g, '').trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { operativeId, messages, directive } = req.body

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const userDirective = directive || messages?.filter(m => m.role === 'user').pop()?.content || ''
  if (!userDirective) return res.status(400).json({ error: 'No directive provided' })

  // Use streaming response to send updates as they happen
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  try {
    // Step 1 — primary operative responds
    send('status', { phase: 'primary', operativeId, name: OPERATIVE_NAMES[operativeId] || operativeId })
    
    const primaryResult = await callOperative(operativeId, userDirective)
    const delegations = parseDelegations(primaryResult.content)
    const cleanPrimary = stripCouncilCall(primaryResult.content)

    send('primary', { 
      operativeId, 
      name: primaryResult.name, 
      content: cleanPrimary 
    })

    // Step 2 — if delegations detected, call those operatives in parallel
    if (delegations?.delegate?.length > 0) {
      const validDelegates = delegations.delegate.filter(id => id !== operativeId && PROMPTS[id])
      
      if (validDelegates.length > 0) {
        send('status', { phase: 'council', delegates: validDelegates.map(id => OPERATIVE_NAMES[id] || id) })

        const delegateResults = await Promise.all(
          validDelegates.map(id => callOperative(id, userDirective, `${primaryResult.name}: ${delegations.brief || 'Council consultation requested'}`))
        )

        for (const result of delegateResults) {
          send('delegate', {
            operativeId: result.operativeId,
            name: result.name,
            content: result.content,
          })
        }

        // Step 3 — primary operative synthesizes all responses
        send('status', { phase: 'synthesis', operativeId, name: primaryResult.name })

        const synthesisContext = delegateResults
          .map(r => `${r.name}:\n${r.content}`)
          .join('\n\n---\n\n')

        const synthesisDirective = `You previously responded to a directive. Your council has now weighed in. Synthesize their input with your own assessment into a final unified recommendation for the Sovereign.

ORIGINAL DIRECTIVE: ${userDirective}

YOUR INITIAL RESPONSE: ${cleanPrimary}

COUNCIL INPUT:
${synthesisContext}

Deliver the final unified response. Be decisive. Attribute key contributions from each operative briefly.`

        const synthesis = await callOperative(operativeId, synthesisDirective)
        
        send('synthesis', {
          operativeId,
          name: primaryResult.name,
          content: synthesis.content,
        })
      }
    }

    send('done', { operativeId })
    res.end()

  } catch (err) {
    send('error', { message: err.message })
    res.end()
  }
}
