// api/royal-engineer.js
// Royal Engineer — reads the codebase from GitHub, plans implementation via
// the Architect agent, generates actual code via the Engineer agent.
// Output: a BUILD_PROPOSAL with file contents ready for Sovereign review.

import { requireAuth } from './auth.js'

const GITHUB_REPO = process.env.GITHUB_REPO || 'GrayMatterGarison/KingsCouncilFinal'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

// ─── AGENTS ───────────────────────────────────────────────────────────────────

const ARCHITECT = {
  name: 'ROYAL ARCHITECT',
  prompt: `You are the Royal Architect. Design before building. For any system: what are the requirements, what are the constraints, what is the most elegant design that meets both? You produce clear implementation plans the Engineer can execute without ambiguity.

You are operating inside the King's Council codebase — a React + Vite frontend deployed on Vercel with Node.js serverless API routes. The codebase uses:
- ES modules (import/export, never require/module.exports)
- CORS headers on every route
- JWT auth via requireAuth() from ./auth.js
- Anthropic Claude API for AI calls
- Notion API for knowledge base storage
- Supabase for process storage
- The existing dark-gold aesthetic (no new colors or fonts)`,
}

const ENGINEER = {
  name: 'ROYAL ENGINEER',
  prompt: `You are the Royal Engineer. You build what the Architect designs. Reliable execution is your craft.

You are implementing code inside the King's Council codebase — a React + Vite frontend on Vercel with Node.js serverless API routes.

STRICT RULES:
- ES modules only: import/export. Never require() or module.exports.
- Every API file needs CORS headers and requireAuth() from './auth.js' (unless it's public)
- Match the exact code style of existing files
- The frontend palette: GOLD="#D4970C", CYAN="#00C8F0", AMBER="#E06A0A", GREEN="#60C890", PURPLE="#8855CC", TPRI="#F2ECD8", TSUB="#B0A888", TDIM="#6A6258", BG="#060606", BORDER="#2E2E2E", BGOLD="#5A4418"
- mono font: fontFamily: "'Courier New', monospace"
- Output ONLY the complete file content. No explanation, no markdown fences, no commentary. Just the raw code.`,
}

// ─── GITHUB FILE READER ───────────────────────────────────────────────────────

async function readGitHubFile(path) {
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' }
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`

  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, { headers })
  if (!res.ok) return null
  const data = await res.json()
  if (!data.content) return null
  return Buffer.from(data.content, 'base64').toString('utf-8')
}

// ─── CLAUDE CALL ──────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await requireAuth(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { codeSpec } = req.body
  if (!codeSpec) return res.status(400).json({ error: 'codeSpec required' })
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)

  try {

    // ── PHASE 1: Read referenced files from GitHub ────────────────────────────
    send('status', { phase: 'reading', message: 'Reading codebase from GitHub...' })

    const filesToRead = [
      ...(codeSpec.files_to_modify || []).map(f => f.path),
      'api/auth.js', // always include auth as baseline context
    ]

    const fileContents = {}
    for (const path of [...new Set(filesToRead)]) {
      send('status', { phase: 'reading', message: `Reading ${path}...` })
      const content = await readGitHubFile(path)
      if (content) {
        fileContents[path] = content
        send('file_read', { path, lines: content.split('\n').length })
      }
    }


    // ── PHASE 2: Architect plans the implementation ───────────────────────────
    send('status', { phase: 'planning', message: 'Architect is planning the implementation...' })

    const existingFilesContext = Object.entries(fileContents)
      .map(([path, content]) => `=== ${path} ===\n${content}`)
      .join('\n\n')

    const architectUserMessage = `You are about to implement this feature spec inside the King's Council codebase.

CODE SPEC:
${JSON.stringify(codeSpec, null, 2)}

EXISTING FILE CONTENTS:
${existingFilesContext}

Produce a precise implementation plan:
1. For each file to CREATE: describe the complete structure, all functions, their signatures, and logic
2. For each file to MODIFY: describe exactly what lines/functions change and how — be surgical
3. Flag any hidden dependencies or integration points not mentioned in the spec
4. List any patterns from existing files the Engineer must match exactly

Be detailed enough that the Engineer can generate each file without questions.`

    const architectPlan = await callClaude(ARCHITECT.prompt, architectUserMessage, 2000)
    send('plan', { content: architectPlan })


    // ── PHASE 3: Engineer generates each file ─────────────────────────────────
    send('status', { phase: 'engineering', message: 'Engineer is writing the code...' })

    const generatedFiles = []

    // Generate new files
    for (const fileSpec of (codeSpec.files_to_create || [])) {
      send('file_start', { path: fileSpec.path, action: 'create' })

      const engineerUserMessage = `Implement this new file completely.

FILE TO CREATE: ${fileSpec.path}

WHAT IT DOES: ${fileSpec.purpose}

IMPLEMENTATION SPEC:
${fileSpec.implementation}

DEPENDENCIES: ${JSON.stringify(fileSpec.dependencies || [])}

ARCHITECT'S PLAN (follow this exactly):
${architectPlan}

EXISTING AUTH PATTERN (match this exactly):
${fileContents['api/auth.js'] || ''}

Output ONLY the complete file content. No markdown fences. No commentary. Raw code only.`

      const content = await callClaude(ENGINEER.prompt, engineerUserMessage, 4000)
      generatedFiles.push({ path: fileSpec.path, action: 'create', content })
      send('file_complete', { path: fileSpec.path, action: 'create', content })
    }

    // Generate modified files
    for (const fileSpec of (codeSpec.files_to_modify || [])) {
      send('file_start', { path: fileSpec.path, action: 'modify' })

      const currentContent = fileContents[fileSpec.path]

      const engineerUserMessage = `Modify this existing file according to the spec.

FILE TO MODIFY: ${fileSpec.path}

CHANGE SUMMARY: ${fileSpec.change_summary}

SPECIFIC CHANGES REQUIRED:
${(fileSpec.specific_changes || []).map((c, i) => `${i + 1}. ${c}`).join('\n')}

FUNCTIONS TO MODIFY: ${(fileSpec.functions_to_modify || []).join(', ')}

ARCHITECT'S PLAN:
${architectPlan}

CURRENT FILE CONTENT:
${currentContent || '(file not found — write it fresh)'}

Output the COMPLETE modified file. Every line. Not just the changed parts — the full file.
No markdown fences. No commentary. Raw code only.`

      const content = await callClaude(ENGINEER.prompt, engineerUserMessage, 8000)
      generatedFiles.push({ path: fileSpec.path, action: 'modify', content })
      send('file_complete', { path: fileSpec.path, action: 'modify', content })
    }


    // ── DONE: Send build proposal ─────────────────────────────────────────────
    send('build_proposal', {
      files: generatedFiles,
      newEnvVars: codeSpec.new_env_vars || [],
      title: codeSpec.title,
    })
    send('done', {})
    res.end()

  } catch (err) {
    send('error', { message: err.message })
    res.end()
  }
}
