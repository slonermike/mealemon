import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { weekId } = req.query as { weekId: string }

  if (req.method === 'GET') {
    // TODO: fetch plan blob from Vercel Blob, compute shopping list, return merged result
    res.status(501).json({ error: 'Not implemented', weekId })
    return
  }

  if (req.method === 'POST' || req.method === 'PATCH') {
    // TODO: upsert plan blob in Vercel Blob
    res.status(501).json({ error: 'Not implemented', weekId })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
