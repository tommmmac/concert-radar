import { useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useOutletContext } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import '../lib/leafletIconFix'
import type { AppContext } from '../components/Layout'
import type { VenueGroup } from '../lib/venues'
import VenuePanel from '../components/VenuePanel'
import LocationSearch from '../components/LocationSearch'
import './MapPage.css'

function MapPage() {
  const { venues, location, setLocation } = useOutletContext<AppContext>()
  const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null)

  return (
    <div className="map-page">
      <LocationSearch location={location} onLocationChange={setLocation} />

      <div className="map-card">
        <MapContainer
          key={`${location.lat},${location.lng}`}
          center={[location.lat, location.lng]}
          zoom={12}
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
