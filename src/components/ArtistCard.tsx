import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useLookup } from '../hooks/useLookup'
import { fetchArtistInfo } from '../lib/artistInfo/spotify'
import { fetchArtistDetails } from '../lib/artistInfo/lastfm'
import { genreHue } from '../lib/artistInfo/genreColor'
import { formatEventDate } from '../lib/formatDate'
import { lookupArtistName } from '../lib/artistInfo/artistName'
import type { ArtistGroup } from '../lib/concerts/artists'
import SpotifyArtistImage from './SpotifyArtistImage'
import './ArtistCard.css'

interface ArtistCardProps {
  artist: ArtistGroup
}

function ArtistCard({ artist }: ArtistCardProps) {
  // A group is one event title, so its first event speaks for all of them.
  const lookupName = lookupArtistName(artist.events[0])
  const { data: spotifyArtist, loading: artistLoading } = useLookup(lookupName, fetchArtistInfo)
  const { data: details, loading: detailsLoading } = useLookup(lookupName, fetchArtistDetails)
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="artist-card">
      {artistLoading ? (
        <div className="artist-card-image skeleton" />
      ) : (
        spotifyArtist?.imageUrl && (
          <SpotifyArtistImage
            name={spotifyArtist.name}
            imageUrl={spotifyArtist.imageUrl}
            spotifyUrl={spotifyArtist.spotifyUrl}
            className="artist-card-image"
          />
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
            {/* Last.fm bios are CC BY-SA wiki text, so credit and link the source. */}
            {details?.bio && details.url && (
              <>
                {' '}
                <a href={details.url} target="_blank" rel="noreferrer">
                  Bio from Last.fm
                </a>
              </>
            )}
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
