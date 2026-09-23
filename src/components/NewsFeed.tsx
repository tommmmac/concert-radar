import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ConcertEvent } from '../lib/ticketmaster'
import { distanceKm, type GeocodedLocation } from '../lib/geocode'
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

interface NewsSectionProps {
  title?: string
  events: ConcertEvent[]
  newEventIds: Set<string>
}

// One list of cards with its own "Show more", so a short local section
// can't get buried behind 200 city events.
function NewsSection({ title, events, newEventIds }: NewsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // New announcements first; sort is stable, so each group keeps the API's date order.
  const sortedEvents = [...events].sort(
    (a, b) => Number(newEventIds.has(b.id)) - Number(newEventIds.has(a.id)),
  )

  return (
    <section className="news-section">
      {title && (
        <h2 className="news-section-title">
          {title} <span className="news-section-count">{events.length}</span>
        </h2>
      )}
      <div className="news-feed-items">
        {sortedEvents.slice(0, visibleCount).map((event) => (
          <NewsCard key={event.id} event={event} isNew={newEventIds.has(event.id)} />
        ))}
      </div>
      {visibleCount < sortedEvents.length && (
        <button className="news-feed-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
          Show more ({sortedEvents.length - visibleCount} left)
        </button>
      )}
    </section>
  )
}

function NewsFeed({ loading, error, events, venueCount, newEventIds, location }: NewsFeedProps) {
  const newCount = newEventIds.size
  const ready = !loading && !error

  // City first — for an outer suburb, the city's venues are usually the draw.
  const sections = location.city
    ? [
        { title: `In ${location.city.label}`, events: events.filter((event) => event.area === 'city') },
        { title: `Near ${location.label}`, events: events.filter((event) => event.area !== 'city') },
      ].filter((section) => section.events.length > 0)
    : [{ title: undefined, events }]

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
          <h1>
            What's on {location.city ? 'near' : 'in'} {location.label}
          </h1>
          <p className="news-banner-summary">
            {loading && 'Finding shows…'}
            {!loading && error}
            {ready &&
              (newCount > 0
                ? `${newCount} new ${newCount === 1 ? 'announcement' : 'announcements'} since your last visit — look for the New badge.`
                : "You're all caught up — no new announcements since your last visit.")}
          </p>
          {location.city && (
            <p className="news-banner-summary">
              Including {location.city.label} city venues, about{' '}
              {Math.round(distanceKm(location, location.city))}km away.
            </p>
          )}
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

      {ready &&
        (events.length === 0 ? (
          <p className="news-feed-empty">No upcoming shows found near {location.label}.</p>
        ) : (
          sections.map((section) => (
            <NewsSection
              key={section.title ?? 'all'}
              title={section.title}
              events={section.events}
              newEventIds={newEventIds}
            />
          ))
        ))}
    </div>
  )
}

export default NewsFeed
