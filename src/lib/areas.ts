import type { ConcertEvent } from './ticketmaster'

/**
 * Combines a suburb search with a search around its parent city into one
 * list. Events found by both (where the two circles overlap) appear once.
 * Sorted by date, since each search is only date-ordered within itself.
 */
export function mergeAreaEvents(local: ConcertEvent[], city: ConcertEvent[]): ConcertEvent[] {
  const localIds = new Set(local.map((event) => event.id))
  const merged = [...local, ...city.filter((event) => !localIds.has(event.id))]

  // Undated events last; ISO YYYY-MM-DD strings sort correctly as text.
  return merged.sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
}

export interface WidenedResult {
  events: ConcertEvent[]
  radiusKm: number
}

/**
 * For places without a parent city to fall back on (Evanston, Pasadena, a
 * country town): try each radius in turn and stop at the first with enough
 * events. If none has enough, keep whichever found the most.
 */
export async function widenUntilEnough(
  fetchAt: (radiusKm: number) => Promise<ConcertEvent[]>,
  radiiKm: number[],
  minEvents: number,
): Promise<WidenedResult> {
  let best: WidenedResult = { events: [], radiusKm: radiiKm[0] }

  for (const radiusKm of radiiKm) {
    const events = await fetchAt(radiusKm)
    if (events.length >= minEvents) return { events, radiusKm }
    if (events.length > best.events.length) best = { events, radiusKm }
  }

  return best
}
