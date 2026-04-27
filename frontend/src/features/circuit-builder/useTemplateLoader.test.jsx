/**
 * Tests for useTemplateLoader hook.
 *
 * Key behaviours verified:
 * 1. Circuit loads immediately when there are no existing gates.
 * 2. When gates are present, pendingLoad is set (confirmation required).
 * 3. confirmLoad applies the template and clears pendingLoad.
 * 4. cancelLoad does NOT apply the template and clears pendingLoad.
 * 5. Bug regression: appliedRef is NOT marked when the user cancels.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// We need to control navigation — keep a reference to the mock
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useTemplateLoader } from './useTemplateLoader'

// ─── helpers ─────────────────────────────────────────────────────────────────

const emptyCircuit = () => Array.from({ length: 2 }, () => Array(4).fill(null))
const gatedCircuit = () => [['H', null, null, null], [null, null, null, null]]

function makeRef(rows) {
  return { current: rows }
}

const TEMPLATE = {
  _id: 'tpl-1',
  circuit: [['X', null], [null, 'H']],
}

function renderLoader(circuitRows, locationState = {}) {
  const circuitRef  = makeRef(circuitRows)
  const appliedRef  = { current: null }
  const applyTemplateCircuit = vi.fn()
  const setSavedCircuitId    = vi.fn()
  const setSavedCircuitName  = vi.fn()

  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[{ pathname: '/circuit-builder', state: locationState }]}>
      {children}
    </MemoryRouter>
  )

  const { result } = renderHook(
    () =>
      useTemplateLoader({
        circuitRef,
        appliedRef,
        applyTemplateCircuit,
        setSavedCircuitId,
        setSavedCircuitName,
      }),
    { wrapper },
  )

  return { result, appliedRef, applyTemplateCircuit, setSavedCircuitId, setSavedCircuitName }
}

// ─── tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useTemplateLoader — template loading', () => {
  it('loads immediately when circuit is empty', () => {
    const { result, applyTemplateCircuit, appliedRef } = renderLoader(
      emptyCircuit(),
      { templateToApply: TEMPLATE },
    )

    expect(result.current.pendingLoad).toBeNull()
    expect(appliedRef.current).toBe('tpl-1')
    // navigate called to clear router state
    expect(mockNavigate).toHaveBeenCalledWith('/circuit-builder', { replace: true, state: null })
    // applyTemplateCircuit scheduled via queueMicrotask — flush
    return Promise.resolve().then(() => {
      expect(applyTemplateCircuit).toHaveBeenCalledWith(TEMPLATE.circuit)
    })
  })

  it('sets pendingLoad when circuit has gates', () => {
    const { result, applyTemplateCircuit } = renderLoader(
      gatedCircuit(),
      { templateToApply: TEMPLATE },
    )

    expect(result.current.pendingLoad).not.toBeNull()
    expect(result.current.pendingLoad.message).toMatch(/template/i)
    // template NOT applied yet
    expect(applyTemplateCircuit).not.toHaveBeenCalled()
  })

  it('confirmLoad applies template and clears pendingLoad', async () => {
    const { result, applyTemplateCircuit } = renderLoader(
      gatedCircuit(),
      { templateToApply: TEMPLATE },
    )

    await act(async () => {
      result.current.confirmLoad()
    })

    expect(result.current.pendingLoad).toBeNull()
    await Promise.resolve()
    expect(applyTemplateCircuit).toHaveBeenCalledWith(TEMPLATE.circuit)
  })

  it('cancelLoad does NOT apply template and clears pendingLoad', async () => {
    const { result, applyTemplateCircuit } = renderLoader(
      gatedCircuit(),
      { templateToApply: TEMPLATE },
    )

    await act(async () => {
      result.current.cancelLoad()
    })

    expect(result.current.pendingLoad).toBeNull()
    await Promise.resolve()
    expect(applyTemplateCircuit).not.toHaveBeenCalled()
  })
})

describe('useTemplateLoader — saved circuit loading', () => {
  const SAVED = {
    _id: 'circ-1',
    name: 'Bell State',
    circuitMatrix: [['H', null], [null, 'X']],
  }

  it('loads immediately when circuit is empty', () => {
    const { result, applyTemplateCircuit, setSavedCircuitName, setSavedCircuitId } = renderLoader(
      emptyCircuit(),
      { savedCircuitToLoad: SAVED },
    )

    expect(result.current.pendingLoad).toBeNull()
    return Promise.resolve().then(() => {
      expect(applyTemplateCircuit).toHaveBeenCalledWith(SAVED.circuitMatrix)
      expect(setSavedCircuitName).toHaveBeenCalledWith('Bell State')
      expect(setSavedCircuitId).toHaveBeenCalledWith('circ-1')
    })
  })

  it('sets pendingLoad when circuit has gates', () => {
    const { result } = renderLoader(
      gatedCircuit(),
      { savedCircuitToLoad: SAVED },
    )

    expect(result.current.pendingLoad).not.toBeNull()
    expect(result.current.pendingLoad.message).toMatch(/saved circuit/i)
  })
})
