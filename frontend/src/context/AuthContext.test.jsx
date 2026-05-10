/**
 * Unit tests for AuthProvider.
 *
 * What we verify:
 *  - On mount: getMe() is called; user state is set on success, null on failure
 *  - login() calls loginUser() and updates user state
 *  - logout() calls logoutUser() and clears user state
 *  - register() calls registerUser() and updates user state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'

vi.mock('../api/apiClient', () => ({
  getMe:          vi.fn(),
  loginUser:      vi.fn(),
  registerUser:   vi.fn(),
  logoutUser:     vi.fn(),
}))

import * as api from '../api/apiClient'

// ─── helper consumer ──────────────────────────────────────────────────────────

function AuthConsumer() {
  const { user, loading, login, logout, register } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => login('a@b.com', 'Pass1!')}>login</button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={() => register('alice', 'a@b.com', 'Pass1!')}>register</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  )
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('calls getMe on mount and populates user when it succeeds', async () => {
    api.getMe.mockResolvedValue({ user: { id: '1', username: 'alice' } })

    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('alice')
    expect(api.getMe).toHaveBeenCalledTimes(1)
  })

  it('sets user to null and clears loading when getMe fails', async () => {
    api.getMe.mockRejectedValue(new Error('Not authenticated'))

    renderWithProvider()

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('login calls loginUser and sets user state', async () => {
    api.getMe.mockRejectedValue(new Error('not authed'))
    api.loginUser.mockResolvedValue({ user: { id: '2', username: 'bob' } })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await userEvent.click(screen.getByText('login'))

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('bob'))
    expect(api.loginUser).toHaveBeenCalledWith('a@b.com', 'Pass1!')
  })

  it('logout calls logoutUser and clears user state', async () => {
    api.getMe.mockResolvedValue({ user: { id: '1', username: 'alice' } })
    api.logoutUser.mockResolvedValue({})

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'))

    await userEvent.click(screen.getByText('logout'))

    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(api.logoutUser).toHaveBeenCalledTimes(1)
  })

  it('register calls registerUser and sets user state', async () => {
    api.getMe.mockRejectedValue(new Error('not authed'))
    api.registerUser.mockResolvedValue({ user: { id: '3', username: 'carol' } })

    renderWithProvider()
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))

    await userEvent.click(screen.getByText('register'))

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('carol'))
    expect(api.registerUser).toHaveBeenCalledWith('alice', 'a@b.com', 'Pass1!')
  })
})
