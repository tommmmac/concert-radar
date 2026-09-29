import { describe, expect, it } from 'vitest'
import type { ConcertEvent } from './discovery'
import { countGenres, filterByGenres } from './genres'

const event = (id: string, genre: string | null): ConcertEvent => ({
  id,
  name: id,
  url: '#',
  date: null,
  venueName: 'Venue',
  lat: 0,
  lng: 0,
  genre,
})

const EVENTS = [event('a', 'Rock'), event('b', 'Pop'), event('c', 'Rock'), event('d', null), event('e', 'Jazz')]

describe('countGenres', () => {
  it('counts each genre, most common first, ties alphabetical, skipping unknowns', () => {
    expect(countGenres(EVENTS)).toEqual([
      { genre: 'Rock', count: 2 },
      { genre: 'Jazz', count: 1 },
      { genre: 'Pop', count: 1 },
    ])
  })
})

describe('filterByGenres', () => {
  it('keeps every event when nothing is selected', () => {
    expect(filterByGenres(EVENTS, [])).toBe(EVENTS)
  })

  it('keeps events in any selected genre, and drops ones with no genre', () => {
    expect(filterByGenres(EVENTS, ['Rock', 'Jazz']).map((e) => e.id)).toEqual(['a', 'c', 'e'])
  })
})
