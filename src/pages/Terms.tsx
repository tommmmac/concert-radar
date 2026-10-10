import { Link } from 'react-router-dom'
import './InfoPage.css'

function Terms() {
  return (
    <article className="info-page">
      <h1>Terms of use</h1>
      <p className="info-page-lede">
        Concert Radar is a free hobby project. By using it you agree to the short terms below.
      </p>

      <h2>Show details can be wrong</h2>
      <p>
        Event listings come from Ticketmaster, and artist photos, genres and bios come from Spotify and Last.fm.
        Concert Radar shows them as they are and doesn't check them. Dates, times, venues and lineups can change, and
        shows get cancelled. Always check the ticket page before you buy tickets or travel to a show.
      </p>

      <h2>Not affiliated</h2>
      <p>
        Concert Radar isn't affiliated with or endorsed by Ticketmaster, Spotify, Last.fm, OpenStreetMap, Esri or any
        artist or venue shown. Their names and content belong to their owners. Tickets are bought from the ticket
        seller, on their terms, not from Concert Radar.
      </p>

      <h2>No warranty</h2>
      <p>
        The site is provided "as is", with no guarantee that it's accurate, complete or always available. As far as
        the law allows, Concert Radar isn't liable for any loss that comes from relying on it, such as a missed,
        moved or cancelled show. Nothing here limits rights you have under consumer law that can't be excluded,
        including the Australian Consumer Law.
      </p>

      <h2>Fair use</h2>
      <p>
        Please don't scrape the site or use it to hammer the services it relies on. The source code is open under the
        MIT licence on{' '}
        <a href="https://github.com/tommmmac/concert-radar" target="_blank" rel="noreferrer">
          GitHub
        </a>
        , if you'd like to build your own.
      </p>

      <h2>Your data</h2>
      <p>
        See the <Link to="/privacy">privacy page</Link>.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may change. The date below shows the latest version. Questions go to{' '}
        <a href="https://github.com/tommmmac/concert-radar/issues" target="_blank" rel="noreferrer">
          GitHub issues
        </a>
        .
      </p>

      <p className="info-page-updated">Last updated September 2026</p>
    </article>
  )
}

export default Terms
