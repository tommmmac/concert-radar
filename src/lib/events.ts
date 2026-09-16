import { fetchNearbyConcerts, type ConcertEvent } from './ticketmaster'
import { fetchMockConcerts } from './mockEvents'

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

export function getNearbyConcerts(lat: number, lng: number): Promise<ConcertEvent[]> {
  return USE_MOCK_DATA ? fetchMockConcerts() : fetchNearbyConcerts(lat, lng)
}
