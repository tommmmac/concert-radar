import { useSpotifyArtist } from '../hooks/useSpotifyArtist'
import { useArtistDetails } from '../hooks/useArtistDetails'
import { genreColor } from '../lib/genreColor'
import { formatEventDate } from '../lib/formatDate'
import type { ConcertEvent } from '../lib/ticketmaster'
import './NewsCard.css'

interface NewsCardProps {
  event: ConcertEvent
  isNew: boolean
}

function NewsCard({ event, isNew }: NewsCardProps) {
  const { artist, loading: artistLoading } = useSpotifyArtist(event.name)
  const { details, loading: detailsLoading } = useArtistDetails(event.name)

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
        ) : (
          details?.bio && <p className="news-card-bio">{details.bio}</p>
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
