import { describe, expect, it } from 'vitest'
import { genreHue } from './genreColor'

describe('genreHue', () => {
  it('is stable for the same genre', () => {
    expect(genreHue('Indie Rock')).toBe(genreHue('Indie Rock'))
  })

  it('stays within 0–359', () => {
    for (const genre of ['Punk', 'Hip-Hop', 'Heavy Metal', 'Electronic', 'NWOBHM', '']) {
      const hue = genreHue(genre)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })

  it('spreads different genres across the wheel', () => {
    expect(genreHue('Punk')).not.toBe(genreHue('Jazz'))
  })
})
