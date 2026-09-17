import { useState } from 'react'
import { useSpotifyArtist } from '../hooks/useSpotifyArtist'
import { useArtistDetails } from '../hooks/useArtistDetails'
import { genreColor } from '../lib/genreColor'
import type { ConcertEvent } from '../lib/ticketmaster'
import './EventCard.css'

interface EventCardProps {
  event: ConcertEvent
}

function EventCard({ event }: EventCardProps) {
  const artist = useSpotifyArtist(event.name)
  const details = useArtistDetails(event.name)
  const [bioOpen, setBioOpen] = useState(false)

  return (
    <div className="event-card">
      {artist?.imageUrl && (
        <img className="event-card-artist-image" src={artist.imageUrl} alt="" />
      )}
      <div className="event-card-body">
        {event.date && <span className="event-card-date">{event.date}</span>}

        {details?.bio ? (
          <button
            className="event-card-name event-card-name--clickable"
            onClick={() => setBioOpen((open) => !open)}
            aria-expanded={bioOpen}
          >
            {event.name}
          </button>
        ) : (
          <h3 className="event-card-name">{event.name}</h3>
        )}

        {details && details.tags.length > 0 && (
          <div className="event-card-genres">
            {details.tags.map((tag) => {
              const color = genreColor(tag)
              return (
                <span
                  key={tag}
                  className="genre-pill"
                  style={{ background: color.background, color: color.text }}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        {bioOpen && details?.bio && <p className="event-card-bio">{details.bio}</p>}

        {artist?.previewUrl && <audio className="event-card-preview" controls src={artist.previewUrl} />}
        <a className="event-card-link" href={event.url} target="_blank" rel="noreferrer">
          Tickets
        </a>
      </div>
    </div>
  )
}

export default EventCard
