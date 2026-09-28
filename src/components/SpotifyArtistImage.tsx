interface SpotifyArtistImageProps {
  name: string
  imageUrl: string
  spotifyUrl: string | null
  className: string
}

// Spotify's developer terms require its artwork to link back to Spotify.
// The image itself is decorative (alt="") — the artist's name is always
// shown as text beside it, so the link's label carries the meaning.
function SpotifyArtistImage({ name, imageUrl, spotifyUrl, className }: SpotifyArtistImageProps) {
  const image = <img className={className} src={imageUrl} alt="" />
  if (!spotifyUrl) return image

  return (
    <a
      className="spotify-artist-image-link"
      href={spotifyUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${name} on Spotify`}
    >
      {image}
    </a>
  )
}

export default SpotifyArtistImage
