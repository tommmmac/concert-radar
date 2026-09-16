import type { ConcertEvent } from './ticketmaster'

// Hand-authored fixtures for UI work without burning Ticketmaster API calls.
// Coordinates are real Melbourne venues; events/dates are made up.
export const MOCK_EVENTS: ConcertEvent[] = [
  {
    id: 'mock-1',
    name: 'James Massiah (UK)',
    url: '#',
    date: '2026-09-24',
    venueName: 'The Night Cat',
    lat: -37.7982,
    lng: 144.9862,
  },
  {
    id: 'mock-2',
    name: 'Clementine Douglas',
    url: '#',
    date: '2026-09-25',
    venueName: 'The Night Cat',
    lat: -37.7982,
    lng: 144.9862,
  },
  {
    id: 'mock-3',
    name: 'Lavern',
    url: '#',
    date: '2026-10-02',
    venueName: 'The Night Cat',
    lat: -37.7982,
    lng: 144.9862,
  },
  {
    id: 'mock-4',
    name: 'Cuban Fire!',
    url: '#',
    date: '2026-10-09',
    venueName: 'The Thornbury Theatre',
    lat: -37.7573,
    lng: 145.0034,
  },
  {
    id: 'mock-5',
    name: 'Iron Maiden',
    url: '#',
    date: '2026-11-14',
    venueName: 'Rod Laver Arena',
    lat: -37.8214,
    lng: 144.9782,
  },
  {
    id: 'mock-6',
    name: 'Fontaines D.C.',
    url: '#',
    date: '2026-10-18',
    venueName: 'Festival Hall',
    lat: -37.8092,
    lng: 144.9339,
  },
  {
    id: 'mock-7',
    name: 'Baker Boy',
    url: '#',
    date: '2026-11-01',
    venueName: 'Forum Melbourne',
    lat: -37.8135,
    lng: 144.9666,
  },
  {
    id: 'mock-8',
    name: 'King Stingray',
    url: '#',
    date: '2026-11-01',
    venueName: 'Forum Melbourne',
    lat: -37.8135,
    lng: 144.9666,
  },
  {
    id: 'mock-9',
    name: 'Tash Sultana',
    url: '#',
    date: '2026-12-05',
    venueName: 'Sidney Myer Music Bowl',
    lat: -37.8281,
    lng: 144.9789,
  },
  {
    id: 'mock-10',
    name: 'The Chats',
    url: '#',
    date: '2026-10-30',
    venueName: '170 Russell',
    lat: -37.8131,
    lng: 144.9689,
  },
]

export function fetchMockConcerts(): Promise<ConcertEvent[]> {
  // Small artificial delay so loading states still get exercised.
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_EVENTS), 300))
}
