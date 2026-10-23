import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { safeStateStorage, throttledStateStorage } from '../../../src/lib/storage'

/* ---------------------------------------------------------------------------
   The storage wrapper every persisted store sits on.

   localStorage throws during prerendering, and it throws again in private
   mode and when the quota is exhausted. The wrapper has to keep working in
   all three cases, and it has to prefer its in-memory copy when a write to
   disk failed — otherwise a read would return the value from before the
   failure.
   --------------------------------------------------------------------------- */

describe('safeStateStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('reads back what it wrote', () => {
    const storage = safeStateStorage()
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
  })

  it('returns null for a key it has never seen', () => {
    expect(safeStateStorage().getItem('missing')).toBeNull()
  })

  it('clears a value', () => {
    const storage = safeStateStorage()
    storage.setItem('key', 'value')
    storage.removeItem('key')
    expect(storage.getItem('key')).toBeNull()
  })

  it('writes through to localStorage', () => {
    safeStateStorage().setItem('key', 'value')
    expect(localStorage.getItem('key')).toBe('value')
  })

  it('reads a value another tab wrote', () => {
    localStorage.setItem('key', 'from elsewhere')
    expect(safeStateStorage().getItem('key')).toBe('from elsewhere')
  })

  it('falls back to memory when localStorage throws on read', () => {
    const storage = safeStateStorage()
    storage.setItem('key', 'value')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(storage.getItem('key')).toBe('value')
  })

  it('falls back to memory when localStorage throws on write', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = safeStateStorage()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
    expect(warn).toHaveBeenCalled()
  })

  it('prefers the in-memory copy after a failed write', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = safeStateStorage()
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    storage.setItem('key', 'first')
    setItem.mockRestore()

    // The write that failed is the current value, even though localStorage
    // still holds nothing for this key.
    storage.setItem('key', 'second')
    expect(storage.getItem('key')).toBe('second')
    warn.mockRestore()
  })

  it('ignores a failure while removing a key', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = safeStateStorage()
    storage.setItem('key', 'value')
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    // The removal could not happen, so it must not take the app down with it.
    expect(() => storage.removeItem('key')).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })

  it('returns null when a failing read has nothing in memory either', () => {
    const storage = safeStateStorage()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    expect(storage.getItem('never-written')).toBeNull()
  })

  it('treats an unavailable localStorage as no localStorage', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = safeStateStorage()
    const original = window.localStorage

    // Some browsers throw a SecurityError on touching localStorage at all,
    // when cookies are blocked for the origin.
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError: access denied')
      },
    })

    try {
      expect(() => storage.setItem('key', 'value')).not.toThrow()
      expect(storage.getItem('key')).toBe('value')
    } finally {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: original,
        writable: true,
      })
    }
    warn.mockRestore()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })
})

describe('throttledStateStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns a pending write before it has been flushed', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    expect(storage.getItem('key')).toBe('value')
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('flushes a pending write after the delay', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    vi.advanceTimersByTime(1000)
    expect(localStorage.getItem('key')).toBe('value')
  })

  it('keeps only the last of several rapid writes', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'first')
    vi.advanceTimersByTime(500)
    storage.setItem('key', 'second')
    vi.advanceTimersByTime(1000)
    expect(localStorage.getItem('key')).toBe('second')
  })

  it('drops a pending write when the key is removed', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    storage.removeItem('key')
    vi.advanceTimersByTime(2000)
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('reads through to the underlying storage when nothing is pending', () => {
    localStorage.setItem('key', 'stored')
    expect(throttledStateStorage(1000).getItem('key')).toBe('stored')
  })

  it('flushes pending writes when the page is hidden', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(localStorage.getItem('key')).toBe('value')
  })

  it('leaves pending writes alone while the page is visible', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('removes a key that has no pending write', () => {
    const storage = throttledStateStorage(1000)
    localStorage.setItem('key', 'stored')
    storage.removeItem('key')
    expect(localStorage.getItem('key')).toBeNull()
  })

  it('flushes pending writes when the page is unloaded', () => {
    const storage = throttledStateStorage(1000)
    storage.setItem('key', 'value')
    window.dispatchEvent(new Event('beforeunload'))
    expect(localStorage.getItem('key')).toBe('value')
  })
})
