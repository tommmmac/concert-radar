import { useState } from 'react'
import type { ConcertEvent } from '../lib/ticketmaster'
import type { GeocodedLocation } from '../lib/geocode'
import NewsCard from './NewsCard'
import './NewsFeed.css'

// Each card triggers a Spotify + Last.fm lookup, so reveal the feed in pages
// rather than firing hundreds of requests for a 200-event city at once.
const PAGE_SIZE = 12

interface NewsFeedProps {
  loading: boolean
  error: string | null
  events: ConcertEvent[]
  venueCount: number
  newEventIds: Set<string>
  location: GeocodedLocation
}

function NewsFeed({ loading, error, events, venueCount, newEventIds, location }: NewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // New announcements first; sort is stable, so each group keeps the API's date order.
  const sortedEvents = [...events].sort(
    (a, b) => Number(newEventIds.has(b.id)) - Number(newEventIds.has(a.id)),
  )
  const newCount = newEventIds.size

  return (
    <section className="news-feed">
      <div className="news-feed-status">
        {loading && (
          <span className="status-pill status-pill--loading">
            <span className="pulse-dot" />
            Finding shows…
          </span>
        )}
        {!loading && error && <span className="status-pill status-pill--error">{error}</span>}
        {!loading && !error && (
          <span className="status-pill">
            {events.length} {events.length === 1 ? 'show' : 'shows'} · {venueCount}{' '}
            {venueCount === 1 ? 'venue' : 'venues'} near {location.label}
          </span>
        )}
      </div>

      {!loading && !error && (
        <>
          {events.length > 0 && (
            <p className="news-feed-summary">
              {newCount > 0
                ? `${newCount} new ${newCount === 1 ? 'announcement' : 'announcements'} since your last visit`
                : "You're all caught up — no new announcements since your last visit."}
            </p>
          )}
          <div className="news-feed-items">
            {events.length === 0 ? (
              <p className="news-feed-empty">No upcoming shows found near {location.label}.</p>
            ) : (
              sortedEvents
                .slice(0, visibleCount)
                .map((event) => <NewsCard key={event.id} event={event} isNew={newEventIds.has(event.id)} />)
            )}
          </div>
          {visibleCount < sortedEvents.length && (
            <button className="news-feed-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show more ({sortedEvents.length - visibleCount} left)
            </button>
          )}
        </>
      )}
    </section>
  )
}

export default NewsFeed
