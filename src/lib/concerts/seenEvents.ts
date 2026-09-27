const STORAGE_KEY = 'concert-radar:seen-event-ids'

function readSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // Storage unavailable (private browsing, blocked, etc.) — new-event
    // detection just won't persist across visits, which is fine.
  }
}

/**
 * Compares incoming event IDs against ones seen on a previous visit.
 * Returns which are new, then persists the full set for next time.
 * On a first-ever visit (nothing stored yet) nothing is flagged as new,
 * since every event would otherwise show up as "new".
 */
export function findNewEventIds(currentIds: string[]): Set<string> {
  const seen = readSeenIds()
  const isFirstVisit = seen.size === 0
  const newIds = isFirstVisit ? new Set<string>() : new Set(currentIds.filter((id) => !seen.has(id)))

  writeSeenIds(new Set([...seen, ...currentIds]))

  return newIds
}
