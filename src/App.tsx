import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './App.css'
import { getNearbyConcerts } from './lib/events'
import type { ConcertEvent } from './lib/ticketmaster'

// Leaflet's default marker icon paths break under Vite's bundling; point them at the bundled assets.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const MELBOURNE: [number, number] = [-37.8136, 144.9631]

interface VenueGroup {
  key: string
  lat: number
  lng: number
  venueName: string
  events: ConcertEvent[]
}

function groupByVenue(events: ConcertEvent[]): VenueGroup[] {
  const groups = new Map<string, VenueGroup>()

  for (const event of events) {
    // Round to ~11m precision so venues with tiny coordinate jitter still merge.
    const key = `${event.lat.toFixed(4)},${event.lng.toFixed(4)}`
    const existing = groups.get(key)
    if (existing) {
      existing.events.push(event)
    } else {
      groups.set(key, {
        key,
        lat: event.lat,
        lng: event.lng,
        venueName: event.venueName,
        events: [event],
      })
    }
  }

  return Array.from(groups.values())
}

function App() {
  const [events, setEvents] = useState<ConcertEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNearbyConcerts(MELBOURNE[0], MELBOURNE[1])
      .then(setEvents)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const venues = useMemo(() => groupByVenue(events), [events])

  return (
    <>
      {(loading || error) && (
        <div className="status-banner">
          {loading ? 'Loading concerts…' : error}
        </div>
      )}
      <MapContainer center={MELBOURNE} zoom={12} style={{ height: '100vh', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading>
          {venues.map((venue) => (
            <Marker key={venue.key} position={[venue.lat, venue.lng]}>
              <Popup maxHeight={250}>
                <strong>{venue.venueName}</strong>
                <ul className="venue-event-list">
                  {venue.events.map((event) => (
                    <li key={event.id}>
                      {event.date && <span className="event-date">{event.date}</span>}
                      {' — '}
                      {event.name}
                      {' '}
                      <a href={event.url} target="_blank" rel="noreferrer">
                        Tickets
                      </a>
                    </li>
                  ))}
                </ul>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  )
}

export default App
