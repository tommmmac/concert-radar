import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  DISCOVERY_URL,
  discoveryParams,
  parseDiscoveryEvents,
  type DiscoveryResponse,
} from '../src/lib/concerts/discovery.js'
import { parseSearchCircle } from './_searchParams.js'

// Live Ticketmaster search for places outside the preloaded cities (and the
// fallback when /api/events can't answer). It runs here rather than in the
// browser so the API key stays server-side: a VITE_ variable is bundled
// into the public JavaScript, where anyone could copy it and use up the
// daily quota. Returns only the parsed fields, not Ticketmaster's ~30x
// larger raw response.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const circle = parseSearchCircle(req.query)
  if ('error' in circle) {
    res.status(400).json(circle)
    return
  }

  const apiKey = process.env.TICKETMASTER_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Ticketmaster API key not configured on the server' })
    return
  }

  try {
    const tmRes = await fetch(`${DISCOVERY_URL}?${discoveryParams(apiKey, circle.lat, circle.lng, circle.radius)}`)
    if (!tmRes.ok) throw new Error(`Ticketmaster API error: ${tmRes.status}`)

    const events = parseDiscoveryEvents((await tmRes.json()) as DiscoveryResponse)
    // Listings change slowly; an hour at the edge means everyone searching
    // the same town shares one Ticketmaster call (and one unit of quota).
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ events })
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : 'Ticketmaster search failed' })
  }
}
