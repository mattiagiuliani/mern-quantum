/**
 * Unit tests for useAuth hook.
 *
 * What we verify:
 *  - Returns the full context value when wrapped inside AuthProvider
 *  - Returns null (createContext default) when used outside any provider
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'
import { AuthContext } from '../context/AuthContextDefinition'

const mockValue = {
  user:     { id: '1', username: 'alice' },
  loading:  false,
  login:    vi.fn(),
  logout:   vi.fn(),
  register: vi.fn(),
}

function makeWrapper(value) {
  return ({ children }) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

describe('useAuth', () => {
  it('returns the full context value when inside a provider', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(mockValue),
    })

    expect(result.current.user).toBe(mockValue.user)
    expect(result.current.loading).toBe(false)
    expect(result.current.login).toBe(mockValue.login)
    expect(result.current.logout).toBe(mockValue.logout)
    expect(result.current.register).toBe(mockValue.register)
  })

  it('returns null when used outside any provider', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current).toBeNull()
  })
})
