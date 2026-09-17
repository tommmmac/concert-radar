// Deterministic pastel color per genre name, so the same genre always
// renders the same color without maintaining a manual palette.
export function genreColor(genre: string): { background: string; text: string } {
  let hash = 0
  for (let i = 0; i < genre.length; i++) {
    hash = (hash << 5) - hash + genre.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash) % 360
  return {
    background: `hsl(${hue}, 70%, 92%)`,
    text: `hsl(${hue}, 55%, 32%)`,
  }
}
