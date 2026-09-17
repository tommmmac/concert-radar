import type { ConcertEvent } from '../lib/ticketmaster'
import type { GeocodedLocation } from '../lib/geocode'
import './NewsFeed.css'

interface NewsFeedProps {
  loading: boolean
  error: string | null
  events: ConcertEvent[]
  venueCount: number
  newEventIds: Set<string>
  location: GeocodedLocation
}

function NewsFeed({ loading, error, events, venueCount, newEventIds, location }: NewsFeedProps) {
  const newEvents = events.filter((event) => newEventIds.has(event.id))

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
        <div className="news-feed-items">
          {newEvents.length === 0 ? (
            <p className="news-feed-empty">You're all caught up — check back later for new announcements.</p>
          ) : (
            newEvents.map((event) => (
              <a
                key={event.id}
                className="news-feed-item"
                href={event.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="news-feed-badge">New</span>
                <span>
                  <strong>{event.name}</strong> at {event.venueName}
                  {event.date && <span className="news-feed-date"> — {event.date}</span>}
                </span>
              </a>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default NewsFeed
