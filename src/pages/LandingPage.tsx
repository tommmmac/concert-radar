import { Link, useOutletContext } from 'react-router-dom'
import type { AppContext } from '../components/Layout'
import './LandingPage.css'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Every venue on one map',
    body: 'Shows are grouped by venue, so you can scan a whole city at a glance and click through to see what’s on.',
  },
  {
    icon: '📰',
    title: 'Fresh announcements',
    body: 'The news feed flags shows that have appeared since your last visit, so new gigs never slip past you.',
  },
  {
    icon: '🎧',
    title: 'Know who you’re seeing',
    body: 'Artist photos, genre tags and short bios on every event, pulled from Spotify and Last.fm.',
  },
]

function LandingPage() {
  const { events, venues, loading, error, newEventIds, location } = useOutletContext<AppContext>()

  return (
    <div className="landing">
      <section className="landing-hero">
        <p className="landing-eyebrow">
          <span className="pulse-dot" aria-hidden="true" />
          Live music radar
        </p>
        <h1 className="landing-title">
          Find your next show <span className="landing-title-accent">tonight.</span>
        </h1>
        <p className="landing-lede">
          Concert Radar maps upcoming gigs near you and keeps an eye out for newly announced ones.
        </p>

        <div className="landing-actions">
          <Link to="/map" className="landing-btn landing-btn--primary">
            Open the map
          </Link>
          <Link to="/news" className="landing-btn landing-btn--ghost">
            See what's new
          </Link>
        </div>

        <p className="landing-stats" aria-live="polite">
          {loading
            ? `Scanning ${location.label}…`
            : error
              ? `Couldn't load shows for ${location.label} right now.`
              : `${events.length} upcoming shows across ${venues.length} venues in ${location.label}` +
                (newEventIds.size > 0 ? ` · ${newEventIds.size} new since your last visit` : '')}
        </p>
      </section>

      <section className="landing-features">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="landing-feature">
            <span className="landing-feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default LandingPage
