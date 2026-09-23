import { fetchNearbyConcerts, type ConcertEvent } from './ticketmaster'
import { fetchMockConcerts } from './mockEvents'
import { mergeAreaEvents } from './areas'
import type { GeocodedLocation } from './geocode'

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export async function getNearbyConcerts(location: GeocodedLocation): Promise<ConcertEvent[]> {
  if (USE_MOCK_DATA) return fetchMockConcerts()

  // Outer suburb of a bigger city: search both, so someone in Cranbourne
  // sees Melbourne's venues as well as what's on locally.
  if (location.city) {
    const [local, city] = await Promise.all([
      fetchNearbyConcerts(location.lat, location.lng),
      fetchNearbyConcerts(location.city.lat, location.city.lng),
    ])
    return mergeAreaEvents(local, city)
  }

  return fetchNearbyConcerts(location.lat, location.lng)
}
