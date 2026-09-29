import type { ConcertEvent } from './discovery'

/** How long an event keeps its "Just announced" badge after the ingest first sees it. */
export const JUST_ANNOUNCED_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True for events the daily ingest first found in the last week. Unlike
 * "New" (lib/concerts/seenEvents.ts), this is the same for every visitor and
 * works on a first visit, but only for events served from the database —
 * live Ticketmaster results have no announcedAt.
 */
export function isJustAnnounced(event: Pick<ConcertEvent, 'announcedAt'>, now = new Date()): boolean {
  if (!event.announcedAt) return false
  const age = now.getTime() - new Date(event.announcedAt).getTime()
  return age >= 0 && age < JUST_ANNOUNCED_DAYS * DAY_MS
}
