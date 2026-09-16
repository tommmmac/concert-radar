export interface ConcertEvent {
  id: string
  name: string
  url: string
  date: string | null
  venueName: string
  lat: number
  lng: number
}

interface DiscoveryResponse {
  _embedded?: {
    events?: Array<{
      id: string
      name: string
      url: string
      dates?: { start?: { localDate?: string } }
      _embedded?: {
        venues?: Array<{
          name: string
          location?: { latitude: string; longitude: string }
        }>
      }
    }>
  }
}

const API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY
const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'

export async function fetchNearbyConcerts(
  lat: number,
  lng: number,
  radiusKm = 25,
): Promise<ConcertEvent[]> {
  if (!API_KEY || API_KEY === 'your_key_here') {
    throw new Error('Missing VITE_TICKETMASTER_API_KEY — set it in .env.local')
  }

  const params = new URLSearchParams({
    apikey: API_KEY,
    latlong: `${lat},${lng}`,
    radius: String(radiusKm),
    unit: 'km',
    classificationName: 'music',
    size: '200',
    sort: 'date,asc',
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`)
  }

  const data: DiscoveryResponse = await res.json()
  const events = data._embedded?.events ?? []

  return events
    .map((event) => {
      const venue = event._embedded?.venues?.[0]
      if (!venue?.location) return null

      return {
        id: event.id,
        name: event.name,
        url: event.url,
        date: event.dates?.start?.localDate ?? null,
        venueName: venue.name,
        lat: parseFloat(venue.location.latitude),
        lng: parseFloat(venue.location.longitude),
      }
    })
    .filter((e): e is ConcertEvent => e !== null)
}
