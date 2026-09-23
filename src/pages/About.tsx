import { Link } from 'react-router-dom'
import './InfoPage.css'

function About() {
  return (
    <article className="info-page">
      <h1>About Concert Radar</h1>
      <p className="info-page-lede">
        A map of upcoming live music near you, built for finding the next show without digging through ticketing
        sites.
      </p>

      <h2>What it does</h2>
      <ul>
        <li>
          <Link to="/map">Map</Link>: every venue with upcoming shows, grouped so each venue gets one marker. Click one
          to see what's on there.
        </li>
        <li>
          <Link to="/news">News</Link>: a feed of upcoming shows, with anything announced since your last visit
          flagged as new.
        </li>
        <li>Search any city, or use your current location.</li>
        <li>Artist photos, genre tags and short bios on each event.</li>
      </ul>

      <h2>Where the data comes from</h2>
      <ul>
        <li>
          Events and venues: <a href="https://developer.ticketmaster.com/" target="_blank" rel="noreferrer">Ticketmaster Discovery API</a>
        </li>
        <li>
          Artist images: <a href="https://developer.spotify.com/" target="_blank" rel="noreferrer">Spotify</a>
        </li>
        <li>
          Genres and bios: <a href="https://www.last.fm/api" target="_blank" rel="noreferrer">Last.fm</a>
        </li>
        <li>
          City search: <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap Nominatim</a>
        </li>
        <li>
          Map tiles: <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> World Dark Gray Canvas
        </li>
      </ul>
      <p>
        Concert Radar isn't affiliated with any of these services. Show details can change, so check the ticket page
        before you head out.
      </p>

      <h2>Open source</h2>
      <p>
        Built with React, TypeScript and Leaflet. The code is on{' '}
        <a href="https://github.com/tommmmac/concert-radar" target="_blank" rel="noreferrer">GitHub</a> under the MIT
        licence. See the <Link to="/privacy">privacy page</Link> for how your data is handled.
      </p>
    </article>
  )
}

export default About
