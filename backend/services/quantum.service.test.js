import { describe, it, expect, vi } from 'vitest'
import { applyGateStep, simulate } from './quantum.service.js'

// --- applyGateStep -----------------------------------------------------------

describe('applyGateStep', () => {
  it('H toggles superposition and keeps measurement null', () => {
    expect(applyGateStep(0, false, 'H')).toEqual([0, true, null])
    expect(applyGateStep(1, true, 'H')).toEqual([1, false, null])
  })

  it('X flips deterministic value and preserves superposition branch', () => {
    expect(applyGateStep(0, false, 'X')).toEqual([1, false, null])
    expect(applyGateStep(1, false, 'X')).toEqual([0, false, null])
    expect(applyGateStep(0, true, 'X')).toEqual([0, true, null])
  })

  it('M collapses superposition using randomness and returns measurement', () => {
    const spy = vi.spyOn(Math, 'random')

    spy.mockReturnValue(0.3)
    expect(applyGateStep(1, true, 'M')).toEqual([0, false, 0])

    spy.mockReturnValue(0.9)
    expect(applyGateStep(0, true, 'M')).toEqual([1, false, 1])

    // deterministic -- Math.random not called
    expect(applyGateStep(1, false, 'M')).toEqual([1, false, 1])

    vi.restoreAllMocks()
  })
})

// --- simulate -- single-qubit ------------------------------------------------

describe('simulate -- single-qubit', () => {
  it('returns no-measure bucket when circuit has no M gate', () => {
    const circuit = [
      ['H', null],
      ['X', null],
    ]
    const result = simulate(circuit, 16)
    expect(result.shots).toBe(16)
    expect(result.counts).toEqual({ '(no measure)': 16 })
  })

  it('accumulates deterministic counts for X then M', () => {
    const circuit = [['X', 'M']]
    const result = simulate(circuit, 8)
    expect(result.shots).toBe(8)
    expect(result.counts['1']).toBe(8)
  })
})

// --- simulate -- CNOT --------------------------------------------------------

describe('simulate -- CNOT', () => {
  it('CNOT with ctrl=|0> leaves target unchanged', () => {
    const circuit = [
      [{ gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
      [{ gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
    ]
    const result = simulate(circuit, 16)
    expect(result.shots).toBe(16)
    expect(result.counts['00']).toBe(16)
  })

  it('CNOT with ctrl=|1> flips target', () => {
    const circuit = [
      ['X', { gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
      [null, { gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
    ]
    const result = simulate(circuit, 16)
    expect(result.shots).toBe(16)
    expect(result.counts['11']).toBe(16)
  })

  it('Bell state: H then CNOT then M produces only 00 or 11', () => {
    const circuit = [
      ['H', { gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
      [null, { gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
    ]
    const result = simulate(circuit, 1024)
    expect(result.shots).toBe(1024)
    const keys = Object.keys(result.counts)
    expect(keys.every(k => k === '00' || k === '11')).toBe(true)
    expect((result.counts['00'] ?? 0) + (result.counts['11'] ?? 0)).toBe(1024)
  })
})
