import { useSpotifyArtist } from '../hooks/useSpotifyArtist'
import { useArtistDetails } from '../hooks/useArtistDetails'
import { genreColor } from '../lib/genreColor'
import { formatEventDate } from '../lib/formatDate'
import { cleanArtistName } from '../lib/artistName'
import type { ConcertEvent } from '../lib/ticketmaster'
import './NewsCard.css'

interface NewsCardProps {
  event: ConcertEvent
  isNew: boolean
}

function NewsCard({ event, isNew }: NewsCardProps) {
  // Display the full Ticketmaster title, but look the artist up by the cleaned name.
  const artistName = cleanArtistName(event.name)
  const { artist, loading: artistLoading } = useSpotifyArtist(artistName)
  const { details, loading: detailsLoading } = useArtistDetails(artistName)

  return (
    <article className={isNew ? 'news-card news-card--new' : 'news-card'}>
      {artistLoading ? (
        <div className="news-card-image news-card-image--skeleton" />
      ) : artist?.imageUrl ? (
        <img className="news-card-image" src={artist.imageUrl} alt="" />
      ) : (
        <div className="news-card-image news-card-image--placeholder" aria-hidden="true">
          🎵
        </div>
      )}

      <div className="news-card-body">
        <div className="news-card-heading">
          {isNew && <span className="news-card-badge">New</span>}
          <h3>{event.name}</h3>
        </div>
        <p className="news-card-meta">
          {event.venueName} · {formatEventDate(event.date)}
        </p>

        {details && details.tags.length > 0 && (
          <div className="news-card-genres">
            {details.tags.map((tag) => {
              const color = genreColor(tag)
              return (
                <span key={tag} className="genre-pill" style={{ background: color.background, color: color.text }}>
                  {tag}
                </span>
              )
            })}
          </div>
        )}

        {detailsLoading ? (
          <div className="news-card-bio news-card-bio--skeleton" />
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
            Listed on Ticketmaster{details?.bio && ' · Bio from Last.fm'}
          </span>
          <a href={event.url} target="_blank" rel="noreferrer">
            Tickets →
          </a>
        </div>
      </div>
    </article>
  )
}

export default NewsCard
