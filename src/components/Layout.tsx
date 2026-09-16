import { useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getNearbyConcerts } from '../lib/events'
import { findNewEventIds } from '../lib/seenEvents'
import { groupByVenue, type VenueGroup } from '../lib/venues'
import type { ConcertEvent } from '../lib/ticketmaster'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

const MELBOURNE: [number, number] = [-37.8136, 144.9631]

export interface AppContext {
  events: ConcertEvent[]
  venues: VenueGroup[]
  loading: boolean
  error: string | null
  newEventIds: Set<string>
}

function Layout() {
  const [events, setEvents] = useState<ConcertEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getNearbyConcerts(MELBOURNE[0], MELBOURNE[1])
      .then((fetched) => {
        setEvents(fetched)
        setNewEventIds(findNewEventIds(fetched.map((event) => event.id)))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const venues = useMemo(() => groupByVenue(events), [events])

  const context: AppContext = { events, venues, loading, error, newEventIds }

  return (
    <div className="page">
      <Header />
      <main className="page-content">
        <Outlet context={context} />
      </main>
      <Footer />
    </div>
  )
}

export default Layout
