import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { AppContext } from '../components/Layout'
import GenreFilter from '../components/GenreFilter'
import NewsFeed from '../components/NewsFeed'
import { filterByGenres } from '../lib/concerts/genres'
import { groupByVenue } from '../lib/concerts/venues'

function NewsPage() {
  const { events, loading, error, newEventIds, isFirstVisit, widenedToKm, location, selectedGenres, setSelectedGenres } =
    useOutletContext<AppContext>()
  const filtered = useMemo(() => filterByGenres(events, selectedGenres), [events, selectedGenres])
  const venueCount = useMemo(() => groupByVenue(filtered).length, [filtered])

  return (
    <NewsFeed
      // Remount on a new search so "Show more" starts back at the first page.
      key={`${location.lat},${location.lng}`}
      loading={loading}
      error={error}
      events={filtered}
      venueCount={venueCount}
      filter={<GenreFilter events={events} selected={selectedGenres} onChange={setSelectedGenres} />}
      isFiltered={selectedGenres.length > 0}
      newEventIds={newEventIds}
      isFirstVisit={isFirstVisit}
      widenedToKm={widenedToKm}
      location={location}
    />
  )
}

export default NewsPage
