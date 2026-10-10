import { describe, expect, it } from 'vitest'
import { stripQuery } from './analytics'

describe('stripQuery', () => {
  it('drops the query string and hash', () => {
    expect(stripQuery({ type: 'pageview', url: 'https://example.com/map?lat=-37.8&lng=144.9#venue' })).toEqual({
      type: 'pageview',
      url: 'https://example.com/map',
    })
  })

  it('leaves a plain path alone', () => {
    expect(stripQuery({ type: 'pageview', url: 'https://example.com/news' }).url).toBe('https://example.com/news')
  })
})
