import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useOutletContext } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import '../lib/leafletIconFix'
import type { AppContext } from '../components/Layout'
import './MapPage.css'

const MELBOURNE: [number, number] = [-37.8136, 144.9631]

function MapPage() {
  const { venues } = useOutletContext<AppContext>()

  return (
    <div className="map-card">
      <MapContainer
        center={MELBOURNE}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: '65vh', width: '100%' }}
      >
        <TileLayer
          attribution='Tiles &copy; Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
        <MarkerClusterGroup chunkedLoading>
          {venues.map((venue) => (
            <Marker key={venue.key} position={[venue.lat, venue.lng]}>
              <Popup maxHeight={250}>
                <strong>{venue.venueName}</strong>
                <ul className="venue-event-list">
                  {venue.events.map((event) => (
                    <li key={event.id}>
                      <div>
                        {event.date && <span className="event-date">{event.date}</span>}
                        {' — '}
                        {event.name}
                      </div>
                      <a className="ticket-link" href={event.url} target="_blank" rel="noreferrer">
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
    </div>
  )
}

export default MapPage
