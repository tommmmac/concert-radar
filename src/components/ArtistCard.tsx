import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useLookup } from '../hooks/useLookup'
import { fetchArtistInfo } from '../lib/spotify'
import { fetchArtistDetails } from '../lib/lastfm'
import { genreHue } from '../lib/genreColor'
import { formatEventDate } from '../lib/formatDate'
import { cleanArtistName } from '../lib/artistName'
import type { ArtistGroup } from '../lib/artists'
import './ArtistCard.css'

interface ArtistCardProps {
  artist: ArtistGroup
}

function ArtistCard({ artist }: ArtistCardProps) {
  const lookupName = cleanArtistName(artist.name)
  const { data: spotifyArtist, loading: artistLoading } = useLookup(lookupName, fetchArtistInfo)
  const { data: details, loading: detailsLoading } = useLookup(lookupName, fetchArtistDetails)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="artist-card">
      {artistLoading ? (
        <div className="artist-card-image skeleton" />
      ) : (
        spotifyArtist?.imageUrl && (
          <img className="artist-card-image" src={spotifyArtist.imageUrl} alt="" />
        )
      )}
      <div className="artist-card-body">
        <button
          className="artist-card-name"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
        >
          {artist.name}
        </button>

        {details && details.tags.length > 0 && (
          <div className="artist-card-genres">
            {details.tags.map((tag) => (
              <span key={tag} className="genre-pill" style={{ '--genre-hue': genreHue(tag) } as CSSProperties}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {detailsOpen && (
          <p className="artist-card-bio">
            {detailsLoading
              ? 'Loading…'
              : details?.bio ?? 'No extra info available for this artist yet.'}
          </p>
        )}

        <ul className="artist-card-dates">
          {artist.events.map((event) => (
            <li key={event.id}>
              <span>{formatEventDate(event.date)}</span>
              <a href={event.url} target="_blank" rel="noreferrer">
                Tickets
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ArtistCard
