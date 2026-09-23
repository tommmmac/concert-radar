import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useOutletContext } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { venueIcon } from '../lib/venueIcon'
import type { AppContext } from '../components/Layout'
import type { VenueGroup } from '../lib/venues'
import VenuePanel from '../components/VenuePanel'
import './MapPage.css'

function MapPage() {
  const { venues, location } = useOutletContext<AppContext>()
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null)

  return (
    <div className="map-page">
      <div className="map-card">
        <MapContainer
          key={`${location.lat},${location.lng}`}
          // Outer suburb + its city: frame both. Otherwise centre on the place.
          {...(location.city
            ? {
                bounds: [
                  [location.lat, location.lng],
                  [location.city.lat, location.city.lng],
                ],
                boundsOptions: { padding: [60, 60] },
              }
            : { center: [location.lat, location.lng], zoom: 12 })}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
          <MarkerClusterGroup chunkedLoading>
            {venues.map((venue) => (
              <Marker
                key={venue.key}
                position={[venue.lat, venue.lng]}
                icon={venueIcon}
                eventHandlers={{ click: () => setSelectedVenue(venue) }}
              />
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <VenuePanel venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </div>
  )
}

export default MapPage
