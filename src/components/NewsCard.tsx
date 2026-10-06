import type { CSSProperties } from 'react'
import { useLookup } from '../hooks/useLookup'
import { fetchArtistInfo } from '../lib/artistInfo/spotify'
import { fetchArtistDetails } from '../lib/artistInfo/lastfm'
import { genreHue } from '../lib/artistInfo/genreColor'
import { formatEventDate } from '../lib/formatDate'
import { isJustAnnounced } from '../lib/concerts/announced'
import { lookupArtistName } from '../lib/artistInfo/artistName'
import type { ConcertEvent } from '../lib/concerts/ticketmaster'
import SpotifyArtistImage from './SpotifyArtistImage'
import './NewsCard.css'

interface NewsCardProps {
  event: ConcertEvent
  isNew: boolean
}

function NewsCard({ event, isNew }: NewsCardProps) {
  // Display the full Ticketmaster title, but look the artist up by name.
  const artistName = lookupArtistName(event)
  const { data: artist, loading: artistLoading } = useLookup(artistName, fetchArtistInfo)
  const { data: details, loading: detailsLoading } = useLookup(artistName, fetchArtistDetails)

  return (
    <article className={isNew ? 'news-card news-card--new' : 'news-card'}>
      {artistLoading ? (
        <div className="news-card-image skeleton" />
      ) : artist?.imageUrl ? (
        <SpotifyArtistImage
          name={artist.name}
          imageUrl={artist.imageUrl}
          spotifyUrl={artist.spotifyUrl}
          className="news-card-image"
        />
      ) : (
        // No photo: a blank sleeve with the record peeking out (pure CSS).
        <div className="news-card-image news-card-image--placeholder" aria-hidden="true" />
      )}

      <div className="news-card-body">
        <p className="news-card-date mono">{formatEventDate(event.date)}</p>
        <div className="news-card-heading">
          {/* "New" is personal (since your last visit), so it wins over the
              shared "Just announced" when both apply. */}
          {isNew ? (
            <span className="sticker">New</span>
          ) : (
            isJustAnnounced(event) && <span className="sticker sticker--announced">Just announced</span>
          )}
          <h3>{event.name}</h3>
        </div>
        <p className="news-card-meta">{event.venueName}</p>

        {details && details.tags.length > 0 && (
          <div className="news-card-genres">
            {details.tags.map((tag) => (
              <span key={tag} className="genre-pill" style={{ '--genre-hue': genreHue(tag) } as CSSProperties}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {detailsLoading ? (
          <div className="news-card-bio news-card-bio--skeleton skeleton" />
        ) : details?.bio ? (
          <p className="news-card-bio">{details.bio}</p>
        ) : (
          // Small/local acts often aren't on Last.fm — say something useful
          // from the listing itself rather than leaving a blank gap.
          <p className="news-card-bio news-card-bio--fallback">
            Catch {artistName} live at {event.venueName}. No artist bio yet — check the Ticketmaster listing for
            lineup and set times.
          </p>
        )}

        <div className="news-card-footer">
          <span className="news-card-source">
            Listed on Ticketmaster
            {artist?.imageUrl && artist.spotifyUrl && (
              <>
                {' · '}
                <a href={artist.spotifyUrl} target="_blank" rel="noreferrer">
                  Photo: Spotify
                </a>
              </>
            )}
            {details?.bio && details.url && (
              <>
                {' · '}
                <a href={details.url} target="_blank" rel="noreferrer">
                  Bio: Last.fm
                </a>
              </>
            )}
          </span>
          <a className="btn btn--small btn--solid" href={event.url} target="_blank" rel="noreferrer">
            Tickets →
          </a>
        </div>
      </div>
    </article>
  )
}

export default NewsCard
