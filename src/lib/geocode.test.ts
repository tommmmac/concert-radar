import { describe, expect, it } from 'vitest'
import { distanceKm, parentCityQuery, placeLabel, viewboxAround } from './geocode'

describe('placeLabel', () => {
  it("uses the place's own name", () => {
    expect(
      placeLabel({
        lat: '-38.1',
        lon: '145.28',
        name: 'Cranbourne',
        display_name: 'Cranbourne, Melbourne, Victoria, 3977, Australia',
        address: { suburb: 'Cranbourne', city: 'Melbourne' },
      }),
    ).toBe('Cranbourne')
  })

  it('falls back to the most local address part when there is no name', () => {
    expect(
      placeLabel({
        lat: '0',
        lon: '0',
        display_name: 'Somewhere, Some City, Some State',
        address: { town: 'Sometown', city: 'Some City' },
      }),
    ).toBe('Sometown')
  })

  it('falls back to the first part of display_name as a last resort', () => {
    expect(placeLabel({ lat: '0', lon: '0', display_name: 'Fitzroy, Melbourne, Victoria' })).toBe('Fitzroy')
  })
})

describe('viewboxAround', () => {
  it('returns left,top,right,bottom around the point', () => {
    expect(viewboxAround({ lat: -37.8, lng: 145 })).toBe('143,-35.8,147,-39.8')
  })

  it('rounds to 0.1° so precise coordinates are never sent', () => {
    expect(viewboxAround({ lat: -38.11054, lng: 145.28329 })).toBe('143.3,-36.1,147.3,-40.1')
  })
})

describe('parentCityQuery', () => {
  const base = { lat: '0', lon: '0', display_name: '' }

  it('builds a query for an outer suburb of a bigger city', () => {
    expect(
      parentCityQuery({
        ...base,
        name: 'Cranbourne',
        address: { suburb: 'Cranbourne', city: 'Melbourne', state: 'Victoria', country: 'Australia' },
      }),
    ).toBe('Melbourne, Victoria, Australia')
  })

  it('returns null when the place is the city itself', () => {
    expect(parentCityQuery({ ...base, name: 'Geelong', address: { city: 'Geelong', state: 'Victoria' } })).toBeNull()
  })

  it('returns null when there is no parent city', () => {
    expect(parentCityQuery({ ...base, name: 'Lorne', address: { town: 'Lorne', state: 'Victoria' } })).toBeNull()
  })
})

describe('distanceKm', () => {
  it('matches the known Cranbourne → Melbourne CBD distance (~40km)', () => {
    const km = distanceKm({ lat: -38.108, lng: 145.283 }, { lat: -37.814, lng: 144.963 })
    expect(km).toBeGreaterThan(40)
    expect(km).toBeLessThan(45)
  })

  it('is ~0 for the same point', () => {
    expect(distanceKm({ lat: -37.8, lng: 145 }, { lat: -37.8, lng: 145 })).toBeCloseTo(0)
  })
})
