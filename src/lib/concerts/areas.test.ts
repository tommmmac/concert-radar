import { describe, expect, it } from 'vitest'
import { mergeAreaEvents, widenUntilEnough } from './areas'
import type { ConcertEvent } from './ticketmaster'

function event(id: string, date: string | null): ConcertEvent {
  return { id, name: id, url: '#', date, venueName: 'Venue', lat: 0, lng: 0 }
}

describe('mergeAreaEvents', () => {
  it('combines both searches', () => {
    const merged = mergeAreaEvents([event('a', '2026-10-01')], [event('b', '2026-10-02')])
    expect(merged.map((e) => e.id)).toEqual(['a', 'b'])
  })

  it('keeps an event found by both searches once', () => {
    const merged = mergeAreaEvents([event('a', '2026-10-01')], [event('a', '2026-10-01')])
    expect(merged).toHaveLength(1)
  })

  it('sorts by date across both areas, undated last', () => {
    const merged = mergeAreaEvents(
      [event('late', '2026-12-01'), event('tba', null)],
      [event('early', '2026-10-01')],
    )
    expect(merged.map((e) => e.id)).toEqual(['early', 'late', 'tba'])
  })
})

describe('widenUntilEnough', () => {
  const eventsFor = (counts: Record<number, number>) => {
    const calls: number[] = []
    const fetchAt = async (radiusKm: number) => {
      calls.push(radiusKm)
      return Array.from({ length: counts[radiusKm] ?? 0 }, (_, i) => event(`${radiusKm}-${i}`, null))
    }
    return { fetchAt, calls }
  }

  it('stops at the first radius with enough events', async () => {
    const { fetchAt, calls } = eventsFor({ 25: 30, 50: 90 })
    const result = await widenUntilEnough(fetchAt, [25, 50, 100], 20)
    expect(result.radiusKm).toBe(25)
    expect(calls).toEqual([25])
  })

  it('widens until the minimum is reached', async () => {
    const { fetchAt, calls } = eventsFor({ 25: 4, 50: 25 })
    const result = await widenUntilEnough(fetchAt, [25, 50, 100], 20)
    expect(result.radiusKm).toBe(50)
    expect(result.events).toHaveLength(25)
    expect(calls).toEqual([25, 50])
  })

  it('keeps the best result when no radius has enough', async () => {
    const { fetchAt } = eventsFor({ 25: 1, 50: 6, 100: 6 })
    const result = await widenUntilEnough(fetchAt, [25, 50, 100], 20)
    expect(result.radiusKm).toBe(50)
    expect(result.events).toHaveLength(6)
  })
})
