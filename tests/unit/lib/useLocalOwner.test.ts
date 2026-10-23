import { beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLocalOwnerId } from '../../../src/lib/useLocalOwner'
import { getGuestOwnerId } from '../../../src/lib/guestOwner'
import { useAuth } from '../../../src/store/useAuth'

describe('useLocalOwnerId', () => {
  beforeEach(() => {
    useAuth.setState({ user: null, token: null })
    localStorage.clear()
  })

  it('resolves the guest owner id when nobody is signed in', () => {
    const { result } = renderHook(() => useLocalOwnerId())
    expect(result.current).toBe(getGuestOwnerId())
    expect(result.current).toMatch(/^guest:/)
  })

  it('prefers the account id when someone is signed in', () => {
    useAuth.setState({
      user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 },
      token: 'tok',
    })
    const { result } = renderHook(() => useLocalOwnerId())
    expect(result.current).toBe('usr_1')
  })

  it('falls back to the guest id when the session has no token', () => {
    // A persisted user can outlive its token: the session may have expired or
    // been revoked while the tab was closed. Without a token there is no
    // session, so the account does not own anything on this device.
    useAuth.setState({ user: { id: 'usr_1', email: 'a@b.c', targetScore: 60 }, token: null })
    const { result } = renderHook(() => useLocalOwnerId())
    expect(result.current).toBe(getGuestOwnerId())
  })
})
