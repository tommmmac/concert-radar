import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import './App.css'
import { fetchNearbyConcerts, type ConcertEvent } from './lib/ticketmaster'

// Leaflet's default marker icon paths break under Vite's bundling; point them at the bundled assets.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const MELBOURNE: [number, number] = [-37.8136, 144.9631]

function App() {
  const [events, setEvents] = useState<ConcertEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNearbyConcerts(MELBOURNE[0], MELBOURNE[1])
      .then(setEvents)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
        {events.map((event) => (
          <Marker key={event.id} position={[event.lat, event.lng]}>
            <Popup>
              <strong>{event.name}</strong>
              <br />
              {event.venueName}
              {event.date && (
                <>
                  <br />
                  {event.date}
                </>
              )}
              <br />
              <a href={event.url} target="_blank" rel="noreferrer">
                Tickets
              </a>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}

export default App
