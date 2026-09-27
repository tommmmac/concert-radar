import type { ConcertEvent } from './ticketmaster'

export interface ArtistGroup {
  key: string
  name: string
  events: ConcertEvent[]
}

// Multiple listings for the same artist at a venue (e.g. two different
// dates on the same tour) show as one card with multiple dates, rather
// than duplicate near-identical cards.
export function groupByArtist(events: ConcertEvent[]): ArtistGroup[] {
  const groups = new Map<string, ArtistGroup>()

  for (const event of events) {
    const existing = groups.get(event.name)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(event.name, { key: event.name, name: event.name, events: [event] })
    }
  }

  return Array.from(groups.values())
}
