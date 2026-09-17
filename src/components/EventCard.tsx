import { useSpotifyArtist } from '../hooks/useSpotifyArtist'
import type { ConcertEvent } from '../lib/ticketmaster'
import './EventCard.css'

interface EventCardProps {
  event: ConcertEvent
}

function EventCard({ event }: EventCardProps) {
  const artist = useSpotifyArtist(event.name)

  return (
    <div className="event-card">
      {artist?.imageUrl && (
        <img className="event-card-artist-image" src={artist.imageUrl} alt="" />
      )}
      <div className="event-card-body">
        {event.date && <span className="event-card-date">{event.date}</span>}
        <h3 className="event-card-name">{event.name}</h3>
        {artist?.previewUrl && <audio className="event-card-preview" controls src={artist.previewUrl} />}
        <a className="event-card-link" href={event.url} target="_blank" rel="noreferrer">
          Tickets
        </a>
      </div>
    </div>
  )
}

export default EventCard
