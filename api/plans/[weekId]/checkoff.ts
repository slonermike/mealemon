import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { weekId } = req.query as { weekId: string }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  // TODO: fetch plan blob, toggle checkoff entry, write back to Vercel Blob
  res.status(501).json({ error: 'Not implemented', weekId })
}
