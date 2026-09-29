import type { ConcertEvent } from './discovery'

export type { ConcertEvent } from './discovery'

// Outer suburbs reach their city's venues via a second search around the
// city centre (lib/concerts/events.ts), so each search can stay local.
const DEFAULT_RADIUS_KM = 25

/**
 * Live Ticketmaster search, through our own /api/ticketmaster-search so the
 * API key never reaches the browser. Used for places outside the preloaded
 * cities (lib/concerts/coverage.ts), and as the fallback when /api/events
 * can't answer. Needs `npx vercel dev` locally — plain `npm run dev` has no
 * /api (use VITE_USE_MOCK_DATA there instead).
 */
export async function fetchNearbyConcerts(
  lat: number,
  lng: number,
  radiusKm = DEFAULT_RADIUS_KM,
): Promise<ConcertEvent[]> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radiusKm) })
  const res = await fetch(`/api/ticketmaster-search?${params}`)
  if (!res.ok) throw new Error(`Live event search failed: ${res.status}`)

  const data = (await res.json()) as { events: ConcertEvent[] }
  return data.events
}
