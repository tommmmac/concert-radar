// Ticketmaster Discovery API shapes and parsing, shared by the browser's
// live search (ticketmaster.ts) and the daily ingest job (scripts/). Keep
// this file free of imports and of import.meta.env, so the ingest script
// can load it in plain Node.

export interface ConcertEvent {
  id: string
  name: string
  url: string
  date: string | null
  venueName: string
  lat: number
  lng: number
}

export interface DiscoveryResponse {
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
  page?: { size: number; totalElements: number; totalPages: number; number: number }
}

export const DISCOVERY_URL = 'https://app.ticketmaster.com/discovery/v2/events.json'

/** Music events within `radiusKm` of a point, soonest first. */
export function discoveryParams(apiKey: string, lat: number, lng: number, radiusKm: number): URLSearchParams {
  return new URLSearchParams({
    apikey: apiKey,
    latlong: `${lat},${lng}`,
    radius: String(radiusKm),
    unit: 'km',
    classificationName: 'music',
    size: '200',
    sort: 'date,asc',
  })
}

/** Maps a response to the fields the app uses, dropping events with no venue coordinates (they can't go on the map). */
export function parseDiscoveryEvents(data: DiscoveryResponse): ConcertEvent[] {
  return (data._embedded?.events ?? [])
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
