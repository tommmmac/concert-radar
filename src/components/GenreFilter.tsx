import { useMemo } from 'react'
import type { ConcertEvent } from '../lib/concerts/discovery'
import { countGenres } from '../lib/concerts/genres'
import './GenreFilter.css'

interface GenreFilterProps {
  /** Every event in the search, unfiltered — the chips and counts come from these. */
  events: ConcertEvent[]
  selected: string[]
  onChange: (selected: string[]) => void
}

// Chips for Ticketmaster's top-level genres, shared by the News and Map
// pages (the selection lives in Layout, so it carries across both).
function GenreFilter({ events, selected, onChange }: GenreFilterProps) {
  const genres = useMemo(() => countGenres(events), [events])
  if (genres.length === 0) return null

  const toggle = (genre: string) =>
    onChange(selected.includes(genre) ? selected.filter((g) => g !== genre) : [...selected, genre])

  return (
    <div className="genre-filter" role="group" aria-label="Filter by genre">
      <button
        type="button"
        className="genre-filter-chip"
        aria-pressed={selected.length === 0}
        onClick={() => onChange([])}
      >
        All
      </button>
      {genres.map(({ genre, count }) => (
        <button
          key={genre}
          type="button"
          className="genre-filter-chip"
          aria-pressed={selected.includes(genre)}
          onClick={() => toggle(genre)}
        >
          {genre} <span className="genre-filter-count">{count}</span>
        </button>
      ))}
    </div>
  )
}

export default GenreFilter
