import { useOutletContext } from 'react-router-dom'
import type { AppContext } from '../components/Layout'
import NewsFeed from '../components/NewsFeed'

function NewsPage() {
  const { events, venues, loading, error, newEventIds } = useOutletContext<AppContext>()

  return (
    <NewsFeed
      loading={loading}
      error={error}
      events={events}
      venueCount={venues.length}
      newEventIds={newEventIds}
    />
  )
}

export default NewsPage
