// api/sovereign-council.js
// Sovereign's Council — 5-phase process intelligence session
// Activates the full Inner Council to think-tank a problem and produce
// a structured, storable process artifact.

import { requireAuth } from './auth.js'

// ─── AGENT REGISTRY (Inner Council + synthesis agents) ───────────────────────

const AGENTS = {
  chancellor: {
    name: "LORD CHANCELLOR",
    prompt: "You are the Lord Chancellor, Chief of Staff. Translate sovereign vision into coordinated action. Route tasks, synthesize input across ministers, maintain the decision log. Structure: Situation → Recommendation → Next steps. Nothing falls through the cracks.",
  },
  oracle: {
    name: "THE ORACLE",
    prompt: "You are the Oracle. No agenda except truth. For any decision: 1) Current landscape, 2) Three scenarios (optimistic/realistic/pessimistic), 3) Key unknowns, 4) Recommendation with confidence level. Challenge assumptions. Distinguish confirmed fact from inference.",
  },
  scribe: {
    name: "ROYAL SCRIBE",
    prompt: "You are the Royal Scribe. Institutional memory is your purpose. Log decisions made, reasons, owner, outcome. When asked what was decided about X — answer precisely. Flag when a new decision contradicts a previous one. Nothing is forgotten.",
  },
  devil: {
    name: "DEVIL'S ADVOCATE",
    prompt: "You are the Devil's Advocate. Find everything wrong with any plan. For every plan: 1) Top 3 failure modes, 2) The assumption that, if wrong, sinks this entirely, 3) Worst realistic outcome. Be constructively adversarial. Most uncomfortable voice — most valuable.",
  },
  truthteller: {
    name: "TRUTH-TELLER",
    prompt: "You are the Truth-Teller. Ensure the Sovereign is never deceived — especially by well-meaning people softening bad news. Ignore official reports first. What does the evidence on the ground actually show? Where is the gap between plan and reality? Speak when others go quiet.",
  },
  inspector: {
    name: "INSPECTOR GENERAL",
    prompt: "You are the Inspector General. You audit the governance system itself. No agent is exempt. For any agent: Are they doing what their mandate says? Are they drifting? Are they effective? Report with evidence. Loyalty only to the integrity of the system.",
  },
  visionary: {
    name: "THE VISIONARY",
    prompt: "You are the Visionary. Question the kingdom itself. Every institution eventually optimizes what no longer matters. When assessing strategy: don't improve it — reimagine it. What would a fresh founder build instead? Be the voice of reinvention.",
  },
  builder: {
    name: "MASTER BUILDER",
    prompt: "You are the Master Builder. Ideas without execution are dreams. Turn vision into concrete systems and infrastructure. For any goal: milestones, dependencies, risks, resources needed. What needs to be built, in what order, by when.",
  },
  knowledge: {
    name: "MINISTER OF KNOWLEDGE",
    prompt: "You are the Minister of Knowledge. The kingdom's cognitive edge is your domain. Capture what works, organize it so it can be found, teach it so it spreads, ensure lessons learned are never lost.",
  },
}

const COUNCIL_MEMBERS = ['oracle', 'scribe', 'devil', 'truthteller', 'inspector', 'visionary']

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

// ─── ARTIFACT JSON EXTRACTOR ──────────────────────────────────────────────────

function extractArtifactJSON(text) {
  // Try ```json ... ``` fence first
  const fenceMatch = text.match(/```json\s*([\s\S]+?)\s*```/)
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]) } catch {}
  }
  // Try raw JSON parse
  try { return JSON.parse(text.trim()) } catch {}
  // Try to find a JSON object anywhere in the text
  const objMatch = text.match(/\{[\s\S]+\}/)
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) } catch {}
  }
  return null
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await requireAuth(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { problem, artifactType } = req.body
  if (!problem?.trim()) return res.status(400).json({ error: 'problem is required' })
  // artifactType can be explicitly passed ('code_spec', 'sop', 'automation_spec', 'executable_code')
  // to override AI classification
  const forcedType = ['code_spec', 'sop', 'automation_spec', 'executable_code'].includes(artifactType)
    ? artifactType : null

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  }

  // Holds the full session transcript for storage
  const transcript = []

  try {

    // ── PHASE 1: Lord Chancellor frames the problem ───────────────────────────
    send('status', { phase: 'framing', message: 'Lord Chancellor is framing the session...' })

    const frameSystemPrompt = `${AGENTS.chancellor.prompt}

You are opening a Sovereign's Council session. Your job is to frame the problem clearly so the full Inner Council can deliberate effectively. Be concise and structured.`

    const frameUserMessage = `SOVEREIGN DIRECTIVE — CONVENE THE COUNCIL:

${problem}

Frame this as a structured brief for the full Inner Council. Include:
1. Exact goal (what success looks like)
2. Key constraints and requirements
3. What each council member should specifically address
4. Any critical context the council needs

Keep it tight — this brief drives everything that follows.`

    const frameContent = await callClaude(frameSystemPrompt, frameUserMessage, 600)

    transcript.push({ phase: 'frame', agent: 'chancellor', name: AGENTS.chancellor.name, content: frameContent })
    send('frame', { agent: 'chancellor', name: AGENTS.chancellor.name, content: frameContent })


    // ── PHASE 2: Inner Council deliberates in parallel ────────────────────────
    send('status', {
      phase: 'deliberation',
      message: 'Inner Council deliberating...',
      agents: COUNCIL_MEMBERS.map(id => AGENTS[id].name),
    })

    const deliberationUserMessage = `COUNCIL SESSION BRIEF from LORD CHANCELLOR:

${frameContent}

ORIGINAL DIRECTIVE: ${problem}

Respond from your specific domain. What perspective, risks, requirements, or insights does your role bring to designing this process? Be specific and actionable. Give 3-4 key points.`

    const deliberationResults = await Promise.all(
      COUNCIL_MEMBERS.map(agentId =>
        callClaude(AGENTS[agentId].prompt, deliberationUserMessage, 800)
          .then(content => ({ agentId, name: AGENTS[agentId].name, content }))
      )
    )

    for (const result of deliberationResults) {
      transcript.push({ phase: 'council', agent: result.agentId, name: result.name, content: result.content })
      send('council', { agent: result.agentId, name: result.name, content: result.content })
    }


    // ── PHASE 3: Master Builder synthesizes into a process architecture ───────
    send('status', { phase: 'synthesis', message: 'Master Builder is architecting the process...' })

    const councilSummary = deliberationResults
      .map(r => `${r.name}:\n${r.content}`)
      .join('\n\n---\n\n')

    const synthesisSystemPrompt = `${AGENTS.builder.prompt}

You are synthesizing Inner Council input into a concrete, executable process architecture. Be specific and actionable. Name real tools and platforms. Structure output as numbered phases with concrete steps.`

    const synthesisUserMessage = `PROBLEM: ${problem}

CHANCELLOR'S BRIEF:
${frameContent}

INNER COUNCIL INPUT:
${councilSummary}

Design the complete step-by-step process from A to B. Structure as phases, each with numbered steps. For each step specify:
- What action happens
- Who executes it (human or automated system)
- What tool/platform is used
- What the output is

Be specific. Name real tools. Do not be vague.`

    const synthesisContent = await callClaude(synthesisSystemPrompt, synthesisUserMessage, 1500)

    transcript.push({ phase: 'synthesis', agent: 'builder', name: AGENTS.builder.name, content: synthesisContent })
    send('synthesis', { agent: 'builder', name: AGENTS.builder.name, content: synthesisContent })


    // ── PHASE 4: Minister of Knowledge generates the artifact ─────────────────
    send('status', { phase: 'artifact', message: 'Minister of Knowledge generating the process artifact...' })

    const isBuildTask = forcedType === 'code_spec' ||
      /\b(build|create|add|implement|develop|write|generate|make|design|integrate)\b.{0,60}\b(feature|component|api|route|endpoint|page|screen|ui|interface|function|module|service|integration|button|form|modal|dashboard|table|chart|widget|hook|handler|middleware|spec|codebase|app|application)\b/i.test(problem)

    const artifactSystemPrompt = `You are the Minister of Knowledge. You produce structured artifacts that can be stored and executed without an AI model.

CRITICAL RULES:
- Output ONLY a JSON object wrapped in \`\`\`json ... \`\`\` fences. Nothing else.
- No preamble, no explanation, no text before or after the JSON block.
- Choose the correct type:
  * 'sop' — human-executed workflows and standard operating procedures
  * 'automation_spec' — no-code automation (Zapier/Make.com/n8n)
  * 'executable_code' — scripts, CLI tools, standalone API integrations
  * 'code_spec' — features to build INSIDE an existing software codebase (React, Node.js, Vercel, etc.)
- Use 'code_spec' when the directive asks to BUILD, CREATE, ADD, IMPLEMENT, or DEVELOP a feature, component, API route, UI element, or any code inside an existing application.
- NEVER use 'sop' for software build tasks. If someone says "build X", "add X feature", "create X component" — that is ALWAYS 'code_spec'.
- Use 'sop' only for human-executed business processes (hiring, onboarding, patient intake, etc.).
- Use 'automation_spec' only for connecting existing tools via no-code platforms.
- Use 'executable_code' only for standalone scripts that run outside an existing codebase.
- Be specific with tool names (e.g. "Make.com", "Python script", "Notion API", "Gmail", "Slack").`

    const typeInstruction = forcedType
      ? `⚠ TYPE LOCKED BY SOVEREIGN: You MUST output type '${forcedType}'. Do not use any other type. ${forcedType === 'code_spec' ? 'Use FORMAT B.' : 'Use FORMAT A.'}`
      : isBuildTask
        ? `⚠ CLASSIFICATION OVERRIDE: This is a SOFTWARE BUILD TASK. You MUST output type 'code_spec' using FORMAT B. Do not output any other type.`
        : `Choose the correct type (sop/automation_spec/executable_code/code_spec) based on the problem. If the directive is to build or modify software, use 'code_spec' FORMAT B. Otherwise use FORMAT A.`

    const artifactUserMessage = `Convert this process architecture into a structured JSON artifact.

ORIGINAL PROBLEM: ${problem}

${typeInstruction}

MASTER BUILDER'S ARCHITECTURE:
${synthesisContent}

FORMAT A — Process artifact (sop / automation_spec / executable_code):

\`\`\`json
{
  "title": "Short process name (5 words max)",
  "type": "sop|automation_spec|executable_code",
  "domain": "Operations|Sales|Marketing|Technical|Finance|People|Strategy",
  "problem": "One sentence problem statement",
  "trigger": "What initiates this process",
  "phases": [
    {
      "id": 1,
      "name": "Phase name",
      "objective": "What this phase accomplishes",
      "steps": [
        {
          "id": "1.1",
          "action": "Specific action to take",
          "owner": "human|automated",
          "tool": "Exact tool or platform name",
          "inputs": ["what goes in"],
          "outputs": ["what comes out"],
          "decision": null
        }
      ]
    }
  ],
  "automations": [
    {
      "step": "1.2",
      "platform": "zapier|make|n8n|script|api",
      "description": "What gets automated",
      "trigger": "What fires it",
      "action": "What it does",
      "spec": "Detailed implementation notes"
    }
  ],
  "success_criteria": ["measurable outcome"],
  "estimated_time": "e.g. 2 hours/week",
  "resources": ["required resource or access"]
}
\`\`\`

FORMAT B — Code spec artifact (code_spec):
\`\`\`json
{
  "title": "Feature name (5 words max)",
  "type": "code_spec",
  "domain": "Technical",
  "problem": "One sentence: what needs to be built",
  "tech_stack": ["React", "Node.js", "Vercel"],
  "files_to_create": [
    {
      "path": "api/example.js",
      "purpose": "What this file does",
      "implementation": "Detailed description of all functions, logic, API calls, and patterns to follow from existing files",
      "dependencies": ["./auth.js"]
    }
  ],
  "files_to_modify": [
    {
      "path": "src/App.jsx",
      "change_summary": "Brief: what changes",
      "specific_changes": ["Specific change 1", "Specific change 2"],
      "functions_to_modify": ["FunctionName"]
    }
  ],
  "new_env_vars": [
    { "name": "NEW_VAR", "description": "What it's for" }
  ],
  "acceptance_criteria": ["measurable criterion"],
  "estimated_complexity": "low|medium|high"
}
\`\`\``

    const artifactRaw = await callClaude(artifactSystemPrompt, artifactUserMessage, 3500)
    const artifactJSON = extractArtifactJSON(artifactRaw)

    transcript.push({ phase: 'artifact', agent: 'knowledge', name: AGENTS.knowledge.name, content: artifactRaw })

    if (artifactJSON) {
      send('artifact', {
        type: artifactJSON.type,
        title: artifactJSON.title,
        domain: artifactJSON.domain,
        content: artifactJSON,
      })
    } else {
      // Couldn't parse — send raw so the UI can still show something
      send('artifact', {
        type: 'sop',
        title: 'Process Artifact',
        domain: 'Operations',
        content: null,
        raw: artifactRaw,
        parseError: true,
      })
    }


    // ── DONE ─────────────────────────────────────────────────────────────────
    send('done', { transcript })
    res.end()

  } catch (err) {
    send('error', { message: err.message })
    res.end()
  }
}
