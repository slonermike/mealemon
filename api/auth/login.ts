import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { setSessionCookie } from '../_auth'

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

  setSessionCookie(res)
  res.status(200).json({ ok: true })
}
