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
  /**
   * When the daily ingest first saw this event (ISO timestamp). Only events
   * served from the database have it, and it's null for ones that were
   * already listed when their city started being tracked.
   */
  announcedAt?: string | null
  /** Ticketmaster's top-level genre ("Rock", "Hip-Hop/Rap"), for the genre filter. */
  genre?: string | null
  /** The headline act as Ticketmaster lists it, a better lookup name than the event title. */
  artistName?: string | null
}

interface DiscoveryVenue {
  // Missing for many European venues (81 of 200 in Berlin) — see venueLabel.
  name?: string
  address?: { line1?: string }
  city?: { name?: string }
  location?: { latitude: string; longitude: string }
}

export interface DiscoveryResponse {
  _embedded?: {
    events?: Array<{
      id: string
      name: string
      url: string
      dates?: { start?: { localDate?: string } }
      classifications?: Array<{ genre?: { name?: string } }>
      _embedded?: {
        venues?: DiscoveryVenue[]
        attractions?: Array<{ name?: string }>
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
    .map((event): ConcertEvent | null => {
      const venue = event._embedded?.venues?.[0]
      if (!venue?.location) return null

      return {
        id: event.id,
        name: event.name,
        url: event.url,
        date: event.dates?.start?.localDate ?? null,
        venueName: venueLabel(venue),
        lat: parseFloat(venue.location.latitude),
        lng: parseFloat(venue.location.longitude),
        genre: genreName(event.classifications?.[0]?.genre?.name),
        artistName: event._embedded?.attractions?.[0]?.name?.trim() || null,
      }
    })
    .filter((e): e is ConcertEvent => e !== null)
}

/** Ticketmaster leaves some venues unnamed (common in Germany and the Netherlands); fall back to where it is. */
function venueLabel(venue: DiscoveryVenue): string {
  return venue.name?.trim() || venue.address?.line1?.trim() || venue.city?.name?.trim() || 'Venue TBA'
}

/** Ticketmaster says "Undefined" when it has no genre; treat that as none. */
function genreName(name: string | undefined): string | null {
  const trimmed = name?.trim()
  return trimmed && trimmed !== 'Undefined' ? trimmed : null
}
