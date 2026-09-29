// Shared by the two event search routes (events.ts, ticketmaster-search.ts),
// which take the same ?lat=&lng=&radius= circle. The leading underscore
// tells Vercel this file is not itself a route.

// Wider than any search the app makes (25–100km); guards the query.
const MAX_RADIUS_KM = 200

export interface SearchCircle {
  lat: number
  lng: number
  radius: number
}

function number(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** The search circle from the query string, or an error message for a 400. */
export function parseSearchCircle(query: Record<string, unknown>): SearchCircle | { error: string } {
  const lat = number(query.lat)
  const lng = number(query.lng)
  const radius = number(query.radius)

  if (lat === null || lng === null || radius === null) {
    return { error: 'Expected numeric "lat", "lng" and "radius" query params' }
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || radius <= 0 || radius > MAX_RADIUS_KM) {
    return { error: `"lat"/"lng" out of range, or "radius" not in (0, ${MAX_RADIUS_KM}]` }
  }
  return { lat, lng, radius }
}
