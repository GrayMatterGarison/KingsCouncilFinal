// api/auth.js
// Issues a signed JWT when the correct password is supplied.
// Password is read from APP_PASSWORD env var — never hardcoded.
// Token is verified by the requireAuth() helper imported by all other API routes.

import { SignJWT, jwtVerify } from 'jose'

const ALG    = 'HS256'
const ISSUER = 'kings-council'

function secret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var not set')
  return new TextEncoder().encode(s)
}

// ── exported helper — call this at the top of every protected route ──────────
export async function requireAuth(req, res) {
  const header = req.headers['authorization'] || ''
  const token  = header.replace('Bearer ', '').trim()
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  try {
    await jwtVerify(token, await secret(), { issuer: ISSUER })
    return true
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return false
  }
}

// ── login handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body || {}

  if (!password) {
    return res.status(400).json({ error: 'Password required' })
  }

  const correct = process.env.APP_PASSWORD
  if (!correct) {
    return res.status(500).json({ error: 'APP_PASSWORD not configured' })
  }

  if (password !== correct) {
    // Constant-time-ish comparison to avoid timing attacks
    await new Promise(r => setTimeout(r, 300))
    return res.status(401).json({ error: 'Incorrect password' })
  }

  const token = await new SignJWT({ sub: 'sovereign' })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime('90d')   // 90-day persistent session
    .sign(await secret())

  return res.status(200).json({ token })
}
