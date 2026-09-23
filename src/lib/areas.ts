import type { ConcertEvent } from './ticketmaster'

/**
 * Combines a suburb search with a search around its parent city. Events
 * found by both (where the two circles overlap) count as local. The result
 * is sorted by date so date-ordered views still read naturally.
 */
export function mergeAreaEvents(local: ConcertEvent[], city: ConcertEvent[]): ConcertEvent[] {
  const localIds = new Set(local.map((event) => event.id))
  const merged: ConcertEvent[] = [
    ...local.map((event) => ({ ...event, area: 'local' as const })),
    ...city.filter((event) => !localIds.has(event.id)).map((event) => ({ ...event, area: 'city' as const })),
  ]

  // Undated events last; ISO YYYY-MM-DD strings sort correctly as text.
  return merged.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
}
