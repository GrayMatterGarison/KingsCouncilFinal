// api/royal-engineer-deploy.js
// Pushes Royal Engineer-generated files to a GitHub preview branch.
// Creates the branch off main, writes each file, returns the branch name.

import { requireAuth } from './auth.js'

const GITHUB_REPO = process.env.GITHUB_REPO || 'GrayMatterGarison/KingsCouncilFinal'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

function ghHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

async function ghGet(path) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, { headers: ghHeaders() })
  return res.json()
}

async function ghPost(path, body) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    method: 'POST', headers: ghHeaders(), body: JSON.stringify(body),
  })
  return res.json()
}

async function ghPut(path, body) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body),
  })
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await requireAuth(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not configured. Add it to Vercel env vars.' })
  }

  const { files, title } = req.body
  if (!files?.length) return res.status(400).json({ error: 'files array required' })

  try {
    // ── Get the latest commit SHA on main ─────────────────────────────────────
    const mainRef = await ghGet('/git/refs/heads/main')
    const mainSha = mainRef?.object?.sha
    if (!mainSha) return res.status(500).json({ error: 'Could not get main branch SHA' })

    // ── Create preview branch ─────────────────────────────────────────────────
    const slug = (title || 'feature')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    const branch = `preview/${slug}-${Date.now()}`

    const branchResult = await ghPost('/git/refs', {
      ref: `refs/heads/${branch}`,
      sha: mainSha,
    })

    if (branchResult.message && !branchResult.ref) {
      return res.status(500).json({ error: `Branch creation failed: ${branchResult.message}` })
    }

    // ── Push each file to the branch ──────────────────────────────────────────
    const pushed = []

    for (const file of files) {
      // For modifications, get the current file's SHA (required by GitHub API)
      let existingSha = null
      if (file.action === 'modify') {
        const existing = await ghGet(`/contents/${file.path}?ref=${branch}`)
        existingSha = existing?.sha || null
      }

      const payload = {
        message: `[Royal Engineer] ${file.action === 'create' ? 'Add' : 'Update'} ${file.path}`,
        content: Buffer.from(file.content, 'utf-8').toString('base64'),
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }

      const result = await ghPut(`/contents/${file.path}`, payload)

      if (result.content) {
        pushed.push({ path: file.path, action: file.action, url: result.content.html_url })
      } else {
        pushed.push({ path: file.path, action: file.action, error: result.message })
      }
    }

    // ── Return branch info ────────────────────────────────────────────────────
    const failed = pushed.filter(f => f.error)

    return res.status(200).json({
      success: failed.length === 0,
      branch,
      branchUrl: `https://github.com/${GITHUB_REPO}/tree/${branch}`,
      pushed,
      failed: failed.length,
      message: failed.length === 0
        ? `All ${pushed.length} files pushed to ${branch}. Check Vercel for your preview URL.`
        : `${pushed.length - failed.length} files pushed, ${failed.length} failed.`,
    })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
