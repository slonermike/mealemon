import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const COOKIE_NAME = 'mealemon_session'

function signingSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is not set')
  return secret
}

function sign(value: string): string {
  return crypto.createHmac('sha256', signingSecret()).update(value).digest('hex')
}

function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))
}

function isAuthenticated(req: VercelRequest): boolean {
  const cookieHeader = req.headers.cookie ?? ''
  const token = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1)
  if (!token) return false
  try {
    return verifyToken(token)
  } catch {
    return false
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (isAuthenticated(req)) {
    res.status(200).json({ ok: true })
  } else {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
