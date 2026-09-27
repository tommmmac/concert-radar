import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findNewEventIds } from './seenEvents'

const MELBOURNE = { lat: -37.8136, lng: 144.9631 }
const SYDNEY = { lat: -33.8688, lng: 151.2093 }
const MELBOURNE_KEY = 'concert-radar:seen-event-ids:-37.8,145.0'

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    keys: () => [...data.keys()],
  }
}

let storage: ReturnType<typeof fakeStorage>
const storedIds = (key = MELBOURNE_KEY) => JSON.parse(storage.getItem(key) ?? '[]') as string[]

describe('findNewEventIds', () => {
  beforeEach(() => {
    storage = fakeStorage()
    vi.stubGlobal('localStorage', storage)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('flags nothing on a first-ever visit, but remembers what was shown', () => {
    expect(findNewEventIds(MELBOURNE, ['a', 'b', 'c'])).toEqual(new Set())
    expect(storedIds().sort()).toEqual(['a', 'b', 'c'])
  })

  it('flags only events that were not there last visit', () => {
    findNewEventIds(MELBOURNE, ['a', 'b'])

    expect(findNewEventIds(MELBOURNE, ['a', 'b', 'c', 'd'])).toEqual(new Set(['c', 'd']))
  })

  it('stops flagging an event once it has been seen', () => {
    findNewEventIds(MELBOURNE, ['a'])
    findNewEventIds(MELBOURNE, ['a', 'b'])

    expect(findNewEventIds(MELBOURNE, ['a', 'b'])).toEqual(new Set())
  })

  it('does not re-flag an event that dropped out of the results and came back', () => {
    findNewEventIds(MELBOURNE, ['a', 'b'])
    findNewEventIds(MELBOURNE, ['a']) // b missing, e.g. briefly delisted

    expect(findNewEventIds(MELBOURNE, ['a', 'b'])).toEqual(new Set())
    expect(storedIds().sort()).toEqual(['a', 'b'])
  })

  it('treats the first search of a different city as a first visit there', () => {
    findNewEventIds(MELBOURNE, ['mel-1', 'mel-2'])

    expect(findNewEventIds(SYDNEY, ['syd-1', 'syd-2', 'syd-3'])).toEqual(new Set())
  })

  it('keeps each area’s history when switching back and forth', () => {
    findNewEventIds(MELBOURNE, ['mel-1'])
    findNewEventIds(SYDNEY, ['syd-1'])

    expect(findNewEventIds(MELBOURNE, ['mel-1', 'mel-2'])).toEqual(new Set(['mel-2']))
    expect(findNewEventIds(SYDNEY, ['syd-1', 'syd-2'])).toEqual(new Set(['syd-2']))
  })

  it('shares history between nearby positions, so "use my location" jitter still matches', () => {
    findNewEventIds(MELBOURNE, ['a'])

    const aFewHundredMetresAway = { lat: -37.8102, lng: 144.9667 }
    expect(findNewEventIds(aFewHundredMetresAway, ['a', 'b'])).toEqual(new Set(['b']))
  })

  it('stores only a rounded (~10km) position, never the precise one', () => {
    findNewEventIds(MELBOURNE, ['a'])

    expect(storage.keys()).toEqual([MELBOURNE_KEY])
  })

  it('treats corrupt stored data as a first visit rather than crashing', () => {
    storage.setItem(MELBOURNE_KEY, '{not json')

    expect(findNewEventIds(MELBOURNE, ['a', 'b'])).toEqual(new Set())
    expect(storedIds().sort()).toEqual(['a', 'b'])
  })

  it('flags nothing, without throwing, when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)

    expect(findNewEventIds(MELBOURNE, ['a'])).toEqual(new Set())
    expect(findNewEventIds(MELBOURNE, ['a', 'b'])).toEqual(new Set())
  })
})
