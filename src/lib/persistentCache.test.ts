import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cachedLookup } from './persistentCache'

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  }
}

describe('cachedLookup', () => {
  beforeEach(() => vi.stubGlobal('localStorage', fakeStorage()))
  afterEach(() => vi.unstubAllGlobals())

  it('looks each name up once per session, ignoring case and whitespace', async () => {
    const lookup = vi.fn(async (name: string) => ({ name }))
    const fetchArtist = cachedLookup('test', lookup)

    await fetchArtist('Tash Sultana')
    await fetchArtist('  tash sultana ')

    expect(lookup).toHaveBeenCalledTimes(1)
  })

  it('shares one request between concurrent callers', async () => {
    const lookup = vi.fn(async (name: string) => ({ name }))
    const fetchArtist = cachedLookup('test', lookup)

    const [a, b] = await Promise.all([fetchArtist('Baker Boy'), fetchArtist('Baker Boy')])

    expect(a).toBe(b)
    expect(lookup).toHaveBeenCalledTimes(1)
  })

  it('persists answers across page loads, including "not found"', async () => {
    await cachedLookup('test', async () => null)('Unknown Act')
    await cachedLookup('test', async () => ({ found: true }))('Lavern')

    // A fresh cachedLookup has an empty memory tier, like a reload.
    const lookup = vi.fn(async () => ({ found: false }))
    const afterReload = cachedLookup('test', lookup)

    expect(await afterReload('Unknown Act')).toBeNull()
    expect(await afterReload('Lavern')).toEqual({ found: true })
    expect(lookup).not.toHaveBeenCalled()
  })

  it('resolves failures to null without persisting them, so a reload retries', async () => {
    const failing = cachedLookup('test', async () => {
      throw new Error('503')
    })
    expect(await failing('The Chats')).toBeNull()

    const lookup = vi.fn(async () => ({ found: true }))
    expect(await cachedLookup('test', lookup)('The Chats')).toEqual({ found: true })
    expect(lookup).toHaveBeenCalledTimes(1)
  })

  it('still works when localStorage is unavailable', async () => {
    vi.stubGlobal('localStorage', undefined)
    const lookup = vi.fn(async (name: string) => ({ name }))
    const fetchArtist = cachedLookup('test', lookup)

    expect(await fetchArtist('Cuban Fire!')).toEqual({ name: 'Cuban Fire!' })
    await fetchArtist('Cuban Fire!')
    expect(lookup).toHaveBeenCalledTimes(1)
  })
})
