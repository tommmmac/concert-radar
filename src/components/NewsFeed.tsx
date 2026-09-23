import { useState } from 'react'
import { Link } from 'react-router-dom'
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
  const ready = !loading && !error

  const stats = [
    { label: events.length === 1 ? 'show' : 'shows', value: events.length },
    { label: venueCount === 1 ? 'venue' : 'venues', value: venueCount },
    { label: 'new', value: newCount, highlight: newCount > 0 },
  ]

  return (
    <div className="news-feed">
      <header className="news-banner">
        <div className="news-banner-text">
          <p className="news-banner-eyebrow">
            <span className="pulse-dot" aria-hidden="true" />
            News feed
          </p>
          <h1>What's on in {location.label}</h1>
          <p className="news-banner-summary">
            {loading && 'Finding shows…'}
            {!loading && error}
            {ready &&
              (newCount > 0
                ? `${newCount} new ${newCount === 1 ? 'announcement' : 'announcements'} since your last visit — they're at the top.`
                : "You're all caught up — no new announcements since your last visit.")}
          </p>
        </div>

        <div className="news-banner-side">
          {ready && (
            <dl className="news-banner-stats">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={stat.highlight ? 'news-banner-stat news-banner-stat--highlight' : 'news-banner-stat'}
                >
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <Link to="/map" className="news-banner-link">
            View on map →
          </Link>
        </div>
      </header>

      {ready && (
        <>
          {events.length === 0 ? (
            <p className="news-feed-empty">No upcoming shows found near {location.label}.</p>
          ) : (
            <div className="news-feed-items">
              {sortedEvents.slice(0, visibleCount).map((event) => (
                <NewsCard key={event.id} event={event} isNew={newEventIds.has(event.id)} />
              ))}
            </div>
          )}
          {visibleCount < sortedEvents.length && (
            <button className="news-feed-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Show more ({sortedEvents.length - visibleCount} left)
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default NewsFeed
