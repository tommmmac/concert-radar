import { describe, expect, it } from 'vitest'
import { CITIES, INGEST_RADIUS_KM } from './cities'
import { isCovered } from './coverage'

describe('isCovered', () => {
  it('covers a normal search around a preloaded city centre', () => {
    expect(isCovered(-37.8136, 144.9631, 25)).toBe(true) // Melbourne
  })

  it('covers an inner suburb whose search stays inside the city area', () => {
    expect(isCovered(-37.7986, 144.9784, 25)).toBe(true) // Fitzroy, ~2km out
  })

  it('does not cover a search that pokes past the edge of the stored area', () => {
    // Pakenham is ~55km from Melbourne, so a 25km search reaches ~80km out.
    expect(isCovered(-38.0714, 145.4878, 25)).toBe(false)
  })

  it('does not cover a widened search that outgrows the stored area', () => {
    expect(isCovered(-37.8136, 144.9631, 100)).toBe(false)
  })

  it('does not cover places far from every preloaded city', () => {
    expect(isCovered(-36.7570, 144.2794, 25)).toBe(false) // Bendigo
  })
})

describe('CITIES', () => {
  it('has unique slugs, since each stored event is tagged with one', () => {
    const slugs = CITIES.map((city) => city.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('leaves room for the default 25km search around each centre', () => {
    expect(INGEST_RADIUS_KM).toBeGreaterThanOrEqual(25)
  })
})
