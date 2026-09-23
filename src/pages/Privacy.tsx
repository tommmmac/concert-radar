import './InfoPage.css'

function Privacy() {
  return (
    <article className="info-page">
      <h1>Privacy</h1>
      <p className="info-page-lede">
        Concert Radar has no accounts, no analytics and no database. Here's everything it does with your data.
      </p>

      <h2>Your location</h2>
      <p>
        If you click "use my location", your browser asks for permission first. Your coordinates are only used to
        search for nearby events. They're sent to Ticketmaster for that search and aren't stored anywhere.
      </p>
      <p>
        When you search for a place, a rough version of the area you're currently viewing (rounded to about 10km) is
        sent to OpenStreetMap along with what you typed, so that a name like "Cranbourne" finds the one near you. Your
        precise location is never sent there.
      </p>

      <h2>Stored in your browser</h2>
      <p>Concert Radar saves a few things in your browser's local storage so it works better next time:</p>
      <ul>
        <li>The IDs of events you've already seen, so new ones can be flagged.</li>
        <li>Cached artist images, genres and bios (kept for 24 hours) to cut down on repeat lookups.</li>
      </ul>
      <p>
        This data never leaves your device. You can clear it at any time by clearing this site's data in your browser
        settings.
      </p>

      <h2>Third-party services</h2>
      <p>
        To show events, maps and artist info, your browser talks to the services below. Like any website, they can see
        your IP address and the request being made, and their own privacy policies apply:
      </p>
      <ul>
        <li>
          <a href="https://privacy.ticketmaster.com/" target="_blank" rel="noreferrer">Ticketmaster</a> (event search)
        </li>
        <li>
          <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noreferrer">Spotify</a> (artist
          images, looked up through Concert Radar's server, so Spotify only sees the artist name)
        </li>
        <li>
          <a href="https://www.last.fm/legal/privacy" target="_blank" rel="noreferrer">Last.fm</a> (genres and bios)
        </li>
        <li>
          <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">OpenStreetMap Nominatim</a>{' '}
          (city search)
        </li>
        <li>
          <a href="https://www.esri.com/en-us/privacy/overview" target="_blank" rel="noreferrer">Esri</a> (map tiles)
        </li>
        <li>
          <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel</a> (hosting)
        </li>
      </ul>

      <h2>Questions</h2>
      <p>
        Open an issue on{' '}
        <a href="https://github.com/tommmmac/concert-radar/issues" target="_blank" rel="noreferrer">GitHub</a>.
      </p>

      <p className="info-page-updated">Last updated September 2026</p>
    </article>
  )
}

export default Privacy
