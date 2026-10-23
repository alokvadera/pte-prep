import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useClientReady } from '../../../src/lib/useClientReady'

describe('useClientReady', () => {
  it('reports ready on the client', () => {
    const { result } = renderHook(() => useClientReady())
    expect(result.current).toBe(true)
  })

  it('keeps the same value across re-renders', () => {
    const { result, rerender } = renderHook(() => useClientReady())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})
