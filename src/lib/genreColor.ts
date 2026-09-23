// Deterministic hue per genre name, so the same genre always renders the
// same colour without maintaining a manual palette. Only the hue lives here;
// lightness/saturation are set per theme by `.genre-pill` in index.css.
export function genreHue(genre: string): number {
  let hash = 0
  for (let i = 0; i < genre.length; i++) {
    hash = (hash << 5) - hash + genre.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}
