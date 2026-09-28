import { describe, expect, it } from 'vitest'
import { parseDiscoveryEvents } from './discovery'

function withVenue(venue: Record<string, unknown>) {
  return {
    _embedded: {
      events: [
        {
          id: 'e1',
          name: 'Show',
          url: '#',
          _embedded: { venues: [{ location: { latitude: '52.5', longitude: '13.4' }, ...venue }] },
        },
      ],
    },
  }
}

const venueName = (venue: Record<string, unknown>) => parseDiscoveryEvents(withVenue(venue))[0].venueName

describe('parseDiscoveryEvents venue names', () => {
  it("uses the venue's name when it has one", () => {
    expect(venueName({ name: 'Columbiahalle', address: { line1: 'Columbiadamm 13-21' } })).toBe('Columbiahalle')
  })

  it('falls back to the street address for unnamed venues (common in Berlin and Amsterdam)', () => {
    expect(venueName({ address: { line1: 'Paul-Heyse-Straße 26' }, city: { name: 'Berlin' } })).toBe(
      'Paul-Heyse-Straße 26',
    )
  })

  it('then to the city, then a placeholder — never an empty or missing name', () => {
    expect(venueName({ name: ' ', city: { name: 'Berlin' } })).toBe('Berlin')
    expect(venueName({})).toBe('Venue TBA')
  })
})
