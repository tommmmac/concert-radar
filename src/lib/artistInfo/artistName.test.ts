import { describe, expect, it } from 'vitest'
import { cleanArtistName } from './artistName'

describe('cleanArtistName', () => {
  it('strips trailing bracketed tags', () => {
    expect(cleanArtistName('James Massiah (UK)')).toBe('James Massiah')
    expect(cleanArtistName('Lavern (DJ Set) [18+]')).toBe('Lavern')
  })

  it('drops tour names after a spaced dash or colon', () => {
    expect(cleanArtistName('Iron Maiden - Run For Your Lives World Tour')).toBe('Iron Maiden')
    expect(cleanArtistName('Baker Boy – Australian Tour 2026')).toBe('Baker Boy')
    expect(cleanArtistName('Tash Sultana: Return to the Roots')).toBe('Tash Sultana')
  })

  it('drops support acts and features', () => {
    expect(cleanArtistName('The Chats with special guests')).toBe('The Chats')
    expect(cleanArtistName('King Stingray w/ Pacific Avenue')).toBe('King Stingray')
    expect(cleanArtistName('Clementine Douglas feat. Someone')).toBe('Clementine Douglas')
  })

  it('leaves names that are already clean alone', () => {
    expect(cleanArtistName('Fontaines D.C.')).toBe('Fontaines D.C.')
    expect(cleanArtistName('Cuban Fire!')).toBe('Cuban Fire!')
  })

  it('does not split on + or & or unspaced hyphens', () => {
    expect(cleanArtistName('Florence + the Machine')).toBe('Florence + the Machine')
    expect(cleanArtistName('Simon & Garfunkel')).toBe('Simon & Garfunkel')
    expect(cleanArtistName('Jay-Z')).toBe('Jay-Z')
  })

  it('falls back to the original if cleaning would leave nothing', () => {
    expect(cleanArtistName('(Secret Show)')).toBe('(Secret Show)')
  })
})
