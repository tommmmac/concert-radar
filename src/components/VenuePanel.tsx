import { useMemo } from 'react'
import type { VenueGroup } from '../lib/venues'
import { groupByArtist } from '../lib/artists'
import ArtistCard from './ArtistCard'
import './VenuePanel.css'

interface VenuePanelProps {
  venue: VenueGroup | null
  onClose: () => void
}

function VenuePanel({ venue, onClose }: VenuePanelProps) {
  const artists = useMemo(() => (venue ? groupByArtist(venue.events) : []), [venue])

  if (!venue) {
    return (
      <aside className="venue-panel venue-panel--empty">
        <p>Click a pin on the map to see what's on there.</p>
      </aside>
    )
  }

  return (
    <aside className="venue-panel">
      <div className="venue-panel-header">
        <h2>{venue.venueName}</h2>
        <button className="venue-panel-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="venue-panel-list">
        {artists.map((artist) => (
          <ArtistCard key={artist.key} artist={artist} />
        ))}
      </div>
    </aside>
  )
}

export default VenuePanel
