import type { ConcertEvent } from './ticketmaster'

export interface VenueGroup {
  key: string
  lat: number
  lng: number
  venueName: string
  events: ConcertEvent[]
}

export function groupByVenue(events: ConcertEvent[]): VenueGroup[] {
  const groups = new Map<string, VenueGroup>()

  for (const event of events) {
    // Round to ~11m precision so venues with tiny coordinate jitter still merge.
    const key = `${event.lat.toFixed(4)},${event.lng.toFixed(4)}`
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, {
        key,
        lat: event.lat,
        lng: event.lng,
        venueName: event.venueName,
        events: [event],
      })
    }
  }

  return Array.from(groups.values())
}
