import type { VenueGroup } from '../lib/venues'
import './VenuePanel.css'

interface VenuePanelProps {
  venue: VenueGroup | null
  onClose: () => void
}

function VenuePanel({ venue, onClose }: VenuePanelProps) {
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
        {venue.events.map((event) => (
          <div key={event.id} className="event-card">
            {event.date && <span className="event-card-date">{event.date}</span>}
            <h3 className="event-card-name">{event.name}</h3>
            <a className="event-card-link" href={event.url} target="_blank" rel="noreferrer">
              Tickets
            </a>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default VenuePanel
