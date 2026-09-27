const STORAGE_PREFIX = 'concert-radar:seen-event-ids'

/**
 * One seen-set per area, so searching somewhere new is a first visit there
 * too — otherwise every event in a newly searched city would show as "new".
 * Rounded to 0.1° (~10km): the same place always lands on the same key, even
 * with "use my location" jitter, without storing a precise position.
 */
function storageKey({ lat, lng }: { lat: number; lng: number }): string {
  return `${STORAGE_PREFIX}:${lat.toFixed(1)},${lng.toFixed(1)}`
}

function readSeenIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeSeenIds(key: string, ids: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)))
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) — new-event
    // detection just won't persist across visits, which is fine.
  }
}

/**
 * Compares incoming event IDs against ones seen on a previous visit to this
 * area. Returns which are new, then persists the full set for next time.
 * On a first visit to an area (nothing stored yet) nothing is flagged as
 * new, since every event would otherwise show up as "new" — `isFirstVisit`
 * lets the UI say so, rather than claiming nothing is new "since last visit".
 */
export function findNewEventIds(
  area: { lat: number; lng: number },
  currentIds: string[],
): { newIds: Set<string>; isFirstVisit: boolean } {
  const key = storageKey(area)
  const seen = readSeenIds(key)
  const isFirstVisit = seen.size === 0
  const newIds = isFirstVisit ? new Set<string>() : new Set(currentIds.filter((id) => !seen.has(id)))

  writeSeenIds(key, new Set([...seen, ...currentIds]))

  return { newIds, isFirstVisit }
}
