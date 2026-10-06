import { Link, useOutletContext } from 'react-router-dom'
import type { AppContext } from '../components/Layout'
import RadarPing from '../components/RadarPing'
import './LandingPage.css'

// Laid out like the tracklist on the back of a sleeve.
const TRACKS = [
  {
    side: 'A1',
    title: 'Every venue on one map',
    body: 'Shows are grouped by venue, so you can scan a whole city at a glance and click through to see what’s on.',
  },
  {
    side: 'A2',
    title: 'Fresh announcements',
    body: 'The news feed flags shows that have appeared since your last visit, so new gigs never slip past you.',
  },
  {
    side: 'A3',
    title: 'Know who you’re seeing',
    body: 'Artist photos, genre tags and short bios on every event, pulled from Spotify and Last.fm.',
  },
]

function LandingPage() {
  const { events, venues, loading, error, newEventIds, location } = useOutletContext<AppContext>()

  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-radar">
          <RadarPing />
        </div>
        <p className="landing-catalogue mono">CR–001 · Live music near {location.label}</p>
        <h1 className="landing-title">Find your next show.</h1>
        <p className="landing-lede">
          Concert Radar maps upcoming gigs near you and keeps an eye out for newly announced ones.
        </p>

        <div className="landing-actions">
          <Link to="/map" className="btn btn--solid">
            Open the map
          </Link>
          <Link to="/news" className="btn">
            See what's new
          </Link>
        </div>

        <p className="landing-stats mono" aria-live="polite">
          {loading
            ? `Scanning ${location.label}…`
            : error
              ? `Couldn't load shows for ${location.label} right now.`
              : `${events.length} upcoming shows · ${venues.length} venues` +
                (newEventIds.size > 0 ? ` · ${newEventIds.size} new since your last visit` : '')}
        </p>
      </section>

      <section className="landing-tracklist" aria-labelledby="landing-tracklist-title">
        <h2 id="landing-tracklist-title" className="landing-tracklist-title mono">
          Side A
        </h2>
        <ol>
          {TRACKS.map((track) => (
            <li key={track.side} className="landing-track">
              <span className="landing-track-side mono" aria-hidden="true">
                {track.side}
              </span>
              <h3>{track.title}</h3>
              <p>{track.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default LandingPage
