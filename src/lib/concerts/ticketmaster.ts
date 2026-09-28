import { DISCOVERY_URL, discoveryParams, parseDiscoveryEvents, type DiscoveryResponse } from './discovery'

export type { ConcertEvent } from './discovery'

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY

// Outer suburbs reach their city's venues via a second search around the
// city centre (lib/concerts/events.ts), so each search can stay local.
const DEFAULT_RADIUS_KM = 25

/**
 * Live search, straight from the browser. Used for places outside the
 * preloaded cities (lib/concerts/coverage.ts), and as the fallback when
 * /api/events can't answer.
 */
export async function fetchNearbyConcerts(lat: number, lng: number, radiusKm = DEFAULT_RADIUS_KM) {
  if (!API_KEY || API_KEY === 'your_key_here') {
    throw new Error('Missing VITE_TICKETMASTER_API_KEY — set it in .env')
  }

  const res = await fetch(`${DISCOVERY_URL}?${discoveryParams(API_KEY, lat, lng, radiusKm)}`)
  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`)
  }

  return parseDiscoveryEvents((await res.json()) as DiscoveryResponse)
}
