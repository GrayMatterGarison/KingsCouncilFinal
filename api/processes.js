// api/processes.js
// Supabase CRUD for the Sovereign's Process Library

import { requireAuth } from './auth.js'

const SUPA_URL = process.env.SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

function supaFetch(path, method = 'GET', body = null) {
  return fetch(`${SUPA_URL}/rest/v1/${path}`, {
    method,
    headers: {
      'apikey': SUPA_KEY,
      'Authorization': `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    ...(body !== null ? { body: JSON.stringify(body) } : {}),
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!await requireAuth(req, res)) return

  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({ error: 'Supabase not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY.' })
  }

  const { id, action } = req.query

  try {

    // ── List all active processes ─────────────────────────────────────────────
    if (req.method === 'GET' && !id) {
      const r = await supaFetch('processes?select=id,title,type,domain,problem,status,venture,created_at&status=eq.active&order=created_at.desc')
      const data = await r.json()
      return res.status(200).json(Array.isArray(data) ? data : [])
    }

    // ── Get single process with run history ──────────────────────────────────
    if (req.method === 'GET' && id) {
      const [procRes, runsRes] = await Promise.all([
        supaFetch(`processes?id=eq.${id}&select=*`),
        supaFetch(`process_runs?process_id=eq.${id}&select=*&order=started_at.desc`),
      ])
      const [proc, runs] = await Promise.all([procRes.json(), runsRes.json()])
      if (!proc?.[0]) return res.status(404).json({ error: 'Process not found' })
      return res.status(200).json({ ...proc[0], runs: runs || [] })
    }

    // ── Log a process run ─────────────────────────────────────────────────────
    if (req.method === 'POST' && action === 'run') {
      const { process_id, step_logs, notes } = req.body
      if (!process_id) return res.status(400).json({ error: 'process_id required' })
      const r = await supaFetch('process_runs', 'POST', {
        process_id,
        step_logs: step_logs || [],
        notes: notes || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      const data = await r.json()
      return res.status(200).json({ success: true, run: data?.[0] })
    }

    // ── Create a process + council session ────────────────────────────────────
    if (req.method === 'POST') {
      const { title, type, domain, problem, artifact, transcript, venture } = req.body
      if (!title || !type || !artifact) {
        return res.status(400).json({ error: 'title, type, and artifact are required' })
      }

      const procRes = await supaFetch('processes', 'POST', {
        title,
        type,
        domain: domain || null,
        problem: problem || null,
        artifact,
        venture: venture || 'Kingdom Alpha',
        status: 'active',
      })
      const proc = await procRes.json()
      const processId = proc?.[0]?.id

      if (processId && transcript) {
        await supaFetch('council_sessions', 'POST', {
          process_id: processId,
          problem: problem || null,
          transcript,
        })
      }

      return res.status(200).json({ success: true, id: processId, process: proc?.[0] })
    }

    // ── Archive a process ─────────────────────────────────────────────────────
    if (req.method === 'PATCH' && id) {
      const { status } = req.body
      await supaFetch(`processes?id=eq.${id}`, 'PATCH', {
        status: status || 'archived',
        updated_at: new Date().toISOString(),
      })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
