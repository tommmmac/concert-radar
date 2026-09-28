import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findEventsNear } from './_db.js'

// Serves events preloaded by the daily ingest job (scripts/ingest.ts), so
// searches inside a preloaded city don't each call Ticketmaster.
// src/lib/concerts/coverage.ts decides which searches come here.

// Wider than any search the app makes (25–100km); guards the query.
const MAX_RADIUS_KM = 200

function number(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const lat = number(req.query.lat)
  const lng = number(req.query.lng)
  const radius = number(req.query.radius)

  if (lat === null || lng === null || radius === null) {
    res.status(400).json({ error: 'Expected numeric "lat", "lng" and "radius" query params' })
    return
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || radius <= 0 || radius > MAX_RADIUS_KM) {
    res.status(400).json({ error: `"lat"/"lng" out of range, or "radius" not in (0, ${MAX_RADIUS_KM}]` })
    return
  }

  try {
    const result = await findEventsNear(lat, lng, radius)
    // The data only changes once a day, so let Vercel's edge answer
    // repeat searches (e.g. everyone looking at Melbourne) for an hour.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json(result)
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Event lookup failed' })
  }
}
