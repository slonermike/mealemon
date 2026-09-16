import * as crypto from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const COOKIE_NAME = 'mealemon_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

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

function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return false
  const payload = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(sign(payload)))
}

export function setSessionCookie(res: VercelResponse): void {
  const token = makeToken()
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}; Path=/`,
  )
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`,
  )
}

export function isAuthenticated(req: VercelRequest): boolean {
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

export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
  if (isAuthenticated(req)) return true
  res.status(401).json({ error: 'Unauthorized' })
  return false
}
