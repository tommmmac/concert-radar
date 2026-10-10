import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ConcertEvent } from '../lib/concerts/ticketmaster'
import { distanceKm, type GeocodedLocation } from '../lib/geocode'
import { isJustAnnounced } from '../lib/concerts/announced'
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
  isFirstVisit: boolean
  widenedToKm: number | null
  location: GeocodedLocation
  /** The genre filter, shown between the banner and the cards. */
  filter?: ReactNode
  /** A genre filter is narrowing `events`, so an empty list means "none in those genres". */
  isFiltered?: boolean
}

function NewsFeed({
  loading,
  error,
  events,
  venueCount,
  newEventIds,
  isFirstVisit,
  widenedToKm,
  location,
  filter,
  isFiltered = false,
}: NewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // New since your last visit first, then just announced, then the rest;
  // sort is stable, so each group keeps date order.
  const rank = (event: ConcertEvent) => (newEventIds.has(event.id) ? 2 : isJustAnnounced(event) ? 1 : 0)
  const sortedEvents = [...events].sort((a, b) => rank(b) - rank(a))
  const newCount = newEventIds.size
  const announcedCount = events.filter((event) => isJustAnnounced(event)).length
  const ready = !loading && !error

  // A first visit to an area has no "last visit" to compare against, so say
  // tracking starts now rather than claiming nothing is new.
  const newsSummary = isFirstVisit
    ? announcedCount > 0
      ? `First look at ${location.label}. ${announcedCount} ${announcedCount === 1 ? 'show was' : 'shows were'} announced in the past week, and from your next visit on we'll flag anything new.`
      : `First look at ${location.label}. From your next visit on, we'll flag newly announced shows.`
    : newCount > 0
      ? `${newCount} ${newCount === 1 ? 'show' : 'shows'} announced since your last visit, marked New.`
      : 'Nothing new since your last visit.'

  const stats = [
    { label: events.length === 1 ? 'show' : 'shows', value: events.length },
    { label: venueCount === 1 ? 'venue' : 'venues', value: venueCount },
    { label: 'new', value: newCount, highlight: newCount > 0 },
  ]

  return (
    <div className="news-feed">
      <header className="news-banner">
        <div className="news-banner-text">
          <p className="news-banner-eyebrow mono">News feed</p>
          <h1>
            What's on {location.city ? 'near' : 'in'} {location.label}
          </h1>
          <p className="news-banner-summary">
            {loading && 'Finding shows…'}
            {!loading && error}
            {ready && events.length > 0 && newsSummary}
          </p>
          {ready && widenedToKm && (
            <p className="news-banner-summary">
              Not many shows close by, so we've widened the search to {widenedToKm}km.
            </p>
          )}
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
          <Link to="/map" className="btn btn--small">
            View on map →
          </Link>
        </div>
      </header>

      {ready && filter}

      {ready &&
        (events.length === 0 ? (
          <p className="news-feed-empty">
            {isFiltered
              ? `No upcoming shows in those genres near ${location.label}.`
              : `No upcoming shows found near ${location.label}.`}
          </p>
        ) : (
          <>
            <div className="news-feed-items">
              {sortedEvents.slice(0, visibleCount).map((event) => (
                <NewsCard key={event.id} event={event} isNew={newEventIds.has(event.id)} />
              ))}
            </div>
            {visibleCount < sortedEvents.length && (
              <button className="btn news-feed-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Show more ({sortedEvents.length - visibleCount} left)
              </button>
            )}
          </>
        ))}
    </div>
  )
}

export default NewsFeed
