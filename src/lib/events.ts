import { fetchNearbyConcerts, type ConcertEvent } from './ticketmaster'
import { fetchMockConcerts } from './mockEvents'
import { mergeAreaEvents, widenUntilEnough } from './areas'
import type { GeocodedLocation } from './geocode'

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

export async function getNearbyConcerts(location: GeocodedLocation): Promise<NearbyConcerts> {
  if (USE_MOCK_DATA) return { events: await fetchMockConcerts(), widenedToKm: null }

  // Outer suburb of a bigger city: search both, so someone in Cranbourne
  // sees Melbourne's venues as well as what's on locally.
  if (location.city) {
    const [local, city] = await Promise.all([
      fetchNearbyConcerts(location.lat, location.lng),
      fetchNearbyConcerts(location.city.lat, location.city.lng),
    ])
    return { events: mergeAreaEvents(local, city), widenedToKm: null }
  }

  const { events, radiusKm } = await widenUntilEnough(
    (radius) => fetchNearbyConcerts(location.lat, location.lng, radius),
    RADII_KM,
    MIN_EVENTS,
  )
  return { events, widenedToKm: radiusKm > RADII_KM[0] ? radiusKm : null }
}
