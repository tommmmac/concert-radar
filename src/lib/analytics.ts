import type { BeforeSendEvent } from '@vercel/analytics/react'

// Page views record the path only. Query strings and hashes are dropped so a
// future URL that carries a location (or anything else) never reaches
// analytics — the privacy page promises it doesn't.
export function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url)
  return { ...event, url: url.origin + url.pathname }
}
