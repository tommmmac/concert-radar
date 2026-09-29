import type { ConcertEvent } from './discovery'

export interface StoredEventsResponse {
  events: ConcertEvent[]
  updatedAt: string | null
}

/**
 * Events preloaded by the daily ingest job, from our own /api/events
 * rather than Ticketmaster. Only meaningful inside a preloaded city
 * (lib/concerts/coverage.ts); lib/concerts/events.ts decides when to call it.
 */
export async function fetchStoredConcerts(lat: number, lng: number, radiusKm: number): Promise<ConcertEvent[]> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radiusKm) })
  const res = await fetch(`/api/events?${params}`)
  if (!res.ok) throw new Error(`/api/events failed: ${res.status}`)

  const data = (await res.json()) as StoredEventsResponse
  return data.events
}
