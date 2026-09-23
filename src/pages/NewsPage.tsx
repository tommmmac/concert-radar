import { useOutletContext } from 'react-router-dom'
import type { AppContext } from '../components/Layout'
import NewsFeed from '../components/NewsFeed'

function NewsPage() {
  const { events, venues, loading, error, newEventIds, widenedToKm, location } = useOutletContext<AppContext>()

  return (
    <NewsFeed
      // Remount on a new search so "Show more" starts back at the first page.
      key={`${location.lat},${location.lng}`}
      loading={loading}
      error={error}
      events={events}
      venueCount={venues.length}
      newEventIds={newEventIds}
      widenedToKm={widenedToKm}
      location={location}
    />
  )
}

export default NewsPage
