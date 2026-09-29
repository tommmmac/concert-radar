import { fetchNearbyConcerts, type ConcertEvent } from './ticketmaster'
import { fetchStoredConcerts } from './storedEvents'
import { isCovered } from './coverage'
import { fetchMockConcerts } from './mockEvents'
import { mergeAreaEvents, widenUntilEnough } from './areas'
import type { GeocodedLocation } from '../geocode'

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// A place with no parent city and fewer than this many shows nearby gets a
// wider search, so small towns and "cities" like Evanston still reach the
// venues of the big city next door.
const MIN_EVENTS = 20
const RADII_KM = [25, 50, 100]

export interface NearbyConcerts {
  events: ConcertEvent[]
  /** Set when the search had to go beyond the default radius to find enough shows. */
  widenedToKm: number | null
}

/**
 * One search circle. Inside a preloaded city it's answered from the
 * database (/api/events); anywhere else, or if /api/events can't answer,
 * Ticketmaster is searched live (/api/ticketmaster-search). Both are /api
 * routes, so plain `npm run dev` needs mock mode or `npx vercel dev`.
 */
async function fetchAt(lat: number, lng: number, radiusKm = RADII_KM[0]): Promise<ConcertEvent[]> {
  if (isCovered(lat, lng, radiusKm)) {
    try {
      return await fetchStoredConcerts(lat, lng, radiusKm)
    } catch (err) {
      console.warn('Stored events unavailable, searching Ticketmaster live instead:', err)
    }
  }
  return fetchNearbyConcerts(lat, lng, radiusKm)
}

export async function getNearbyConcerts(location: GeocodedLocation): Promise<NearbyConcerts> {
  if (USE_MOCK_DATA) return { events: await fetchMockConcerts(), widenedToKm: null }

  // Outer suburb of a bigger city: search both, so someone in Cranbourne
  // sees Melbourne's venues as well as what's on locally.
  if (location.city) {
    const [local, city] = await Promise.all([
      fetchAt(location.lat, location.lng),
      fetchAt(location.city.lat, location.city.lng),
    ])
    return { events: mergeAreaEvents(local, city), widenedToKm: null }
  }

  const { events, radiusKm } = await widenUntilEnough(
    (radius) => fetchAt(location.lat, location.lng, radius),
    RADII_KM,
    MIN_EVENTS,
  )
  return { events, widenedToKm: radiusKm > RADII_KM[0] ? radiusKm : null }
}
