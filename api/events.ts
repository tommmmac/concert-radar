import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findEventsNear } from './_db.js'
import { parseSearchCircle } from './_searchParams.js'

// Serves events preloaded by the daily ingest job (scripts/ingest.ts), so
// searches inside a preloaded city don't each call Ticketmaster.
// src/lib/concerts/coverage.ts decides which searches come here.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const circle = parseSearchCircle(req.query)
  if ('error' in circle) {
    res.status(400).json(circle)
    return
  }

  try {
    const result = await findEventsNear(circle.lat, circle.lng, circle.radius)
    // The data only changes once a day, so let Vercel's edge answer
    // repeat searches (e.g. everyone looking at Melbourne) for an hour.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Event lookup failed' })
  }
}
