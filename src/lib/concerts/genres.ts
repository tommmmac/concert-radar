import type { ConcertEvent } from './discovery'

export interface GenreCount {
  genre: string
  count: number
}

/** The genres present in these events, most common first — the filter's chips. */
export function countGenres(events: ConcertEvent[]): GenreCount[] {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.genre) counts.set(event.genre, (counts.get(event.genre) ?? 0) + 1)
  }
  return Array.from(counts, ([genre, count]) => ({ genre, count })).sort(
    (a, b) => b.count - a.count || a.genre.localeCompare(b.genre),
  )
}

/**
 * Events in any of the selected genres. Nothing selected means no filter.
 * Events with no genre only show unfiltered — there's no chip to pick them.
 */
export function filterByGenres(events: ConcertEvent[], selected: string[]): ConcertEvent[] {
  if (selected.length === 0) return events
  return events.filter((event) => event.genre != null && selected.includes(event.genre))
}
