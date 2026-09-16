import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'

const COOKIE_NAME = 'mealemon_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

function signingSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return secret
}

function sign(value: string): string {
  return crypto.createHmac('sha256', signingSecret()).update(value).digest('hex')
}

function makeToken(): string {
  const payload = `mealemon:${Date.now()}`
  return `${payload}.${sign(payload)}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { password } = req.body as { password?: string }
  if (!password) {
    res.status(400).json({ error: 'Missing password' })
    return
  }

  const hash = process.env.APP_PASSWORD_HASH
  if (!hash) {
    res.status(500).json({ error: 'Server misconfigured' })
    return
  }

  const valid = await bcrypt.compare(password, hash)
  if (!valid) {
    res.status(401).json({ error: 'Incorrect password' })
    return
  }

  const token = makeToken()
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
  )
  res.status(200).json({ ok: true })
}
