/**
 * Tests for useSaveCircuit hook.
 * Verifies state transitions: idle → saving → saved | error
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useSaveCircuit } from './useSaveCircuit'

// Mock apiClient
vi.mock('../../api/apiClient', () => ({
  saveCircuit:   vi.fn(),
  updateCircuit: vi.fn(),
}))

import * as apiClient from '../../api/apiClient'

const emptyCircuit = Array.from({ length: 4 }, () => Array(8).fill(null))

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

function renderSaveHook(overrides = {}) {
  const liveStateRef = { current: {} }
  return renderHook(
    () =>
      useSaveCircuit({
        circuit: emptyCircuit,
        user: { id: 'user1', username: 'tester' },
        results: null,
        stepByStepStatus: 'IDLE',
        liveStateRef,
        ...overrides,
      }),
    { wrapper },
  )
}

describe('useSaveCircuit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with idle saveStatus', () => {
    const { result } = renderSaveHook()
    expect(result.current.saveStatus).toBe('idle')
  })

  it('openSaveModal sets saveModalOpen to true', () => {
    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    expect(result.current.saveModalOpen).toBe(true)
  })

  it('openSaveModal seeds draft with savedCircuitName or default', () => {
    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    expect(result.current.saveNameDraft).toBe('My Circuit')
  })

  it('closeSaveModal sets saveModalOpen to false', () => {
    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    act(() => result.current.closeSaveModal())
    expect(result.current.saveModalOpen).toBe(false)
  })

  it('handleSaveConfirm → new circuit → saved status', async () => {
    apiClient.saveCircuit.mockResolvedValue({ circuit: { _id: 'abc123' } })

    const { result } = renderSaveHook()

    act(() => result.current.openSaveModal())
    act(() => result.current.setSaveNameDraft('Bell State'))

    await act(async () => result.current.handleSaveConfirm())

    expect(apiClient.saveCircuit).toHaveBeenCalledWith('Bell State', emptyCircuit)
    expect(result.current.saveStatus).toBe('saved')
    expect(result.current.savedCircuitId).toBe('abc123')
    expect(result.current.savedCircuitName).toBe('Bell State')
  })

  it('handleSaveConfirm → existing circuit → calls updateCircuit', async () => {
    apiClient.updateCircuit.mockResolvedValue({ circuit: { _id: 'existing' } })

    const { result } = renderSaveHook()
    // Manually set savedCircuitId as if it was already saved
    act(() => result.current.setSavedCircuitId('existing'))
    act(() => result.current.openSaveModal())
    act(() => result.current.setSaveNameDraft('Updated Name'))

    await act(async () => result.current.handleSaveConfirm())

    expect(apiClient.updateCircuit).toHaveBeenCalledWith('existing', {
      name: 'Updated Name',
      circuitMatrix: emptyCircuit,
    })
    expect(result.current.saveStatus).toBe('saved')
  })

  it('handleSaveConfirm → API failure → error status', async () => {
    apiClient.saveCircuit.mockRejectedValue(new Error('Network error'))

    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    act(() => result.current.setSaveNameDraft('My Circuit'))

    await act(async () => result.current.handleSaveConfirm())

    expect(result.current.saveStatus).toBe('error')
  })

  it('saved status resets to idle after 2s', async () => {
    apiClient.saveCircuit.mockResolvedValue({ circuit: { _id: 'abc' } })

    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    act(() => result.current.setSaveNameDraft('Test'))

    await act(async () => result.current.handleSaveConfirm())
    expect(result.current.saveStatus).toBe('saved')

    act(() => vi.advanceTimersByTime(2001))
    expect(result.current.saveStatus).toBe('idle')
  })

  it('error status resets to idle after 3s', async () => {
    apiClient.saveCircuit.mockRejectedValue(new Error('fail'))

    const { result } = renderSaveHook()
    act(() => result.current.openSaveModal())
    act(() => result.current.setSaveNameDraft('Test'))

    await act(async () => result.current.handleSaveConfirm())
    expect(result.current.saveStatus).toBe('error')

    act(() => vi.advanceTimersByTime(3001))
    expect(result.current.saveStatus).toBe('idle')
  })

  it('openSaveModal redirects to /login when user is null', () => {
    const { result } = renderHook(
      () =>
        useSaveCircuit({
          circuit: emptyCircuit,
          user: null,
          results: null,
          stepByStepStatus: 'IDLE',
          liveStateRef: { current: {} },
        }),
      { wrapper },
    )

    act(() => result.current.openSaveModal())
    // Modal should stay closed when unauthenticated
    expect(result.current.saveModalOpen).toBe(false)
  })
})
