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

  it('GHZ state: H + CNOT(0→1) + CNOT(0→2) + M produces only 000 or 111', () => {
    const circuit = [
      ['H', { gate: 'CNOT', role: 'ctrl', partner: 1 }, null,                                    'M'],
      [null, { gate: 'CNOT', role: 'tgt',  partner: 0 }, { gate: 'CNOT', role: 'ctrl', partner: 2 }, 'M'],
      [null, null,                                         { gate: 'CNOT', role: 'tgt',  partner: 1 }, 'M'],
    ]
    const result = simulate(circuit, 1024)
    expect(result.shots).toBe(1024)
    const keys = Object.keys(result.counts)
    expect(keys.every(k => k === '000' || k === '111')).toBe(true)
    expect((result.counts['000'] ?? 0) + (result.counts['111'] ?? 0)).toBe(1024)
  })
})

// --- simulate -- H² idempotency ----------------------------------------------

describe('simulate -- H\u00b2 idempotency', () => {
  it('H applied twice returns qubit to |0\u27e9 with certainty', () => {
    // H|0\u27e9 = |+\u27e9, H|+\u27e9 = |0\u27e9 — deterministic after double Hadamard
    const circuit = [['H', 'H', 'M']]
    const result = simulate(circuit, 64)
    expect(result.counts['0']).toBe(64)
    expect(result.counts['1']).toBeUndefined()
  })

  it('H applied twice to |1\u27e9 returns qubit to |1\u27e9 with certainty', () => {
    // X puts qubit in |1\u27e9, then H\u00b2 returns to |1\u27e9
    const circuit = [['X', 'H', 'H', 'M']]
    const result = simulate(circuit, 64)
    expect(result.counts['1']).toBe(64)
    expect(result.counts['0']).toBeUndefined()
  })
})

// --- simulate -- S gate ------------------------------------------------------

describe('simulate -- S gate', () => {
  it('S on |0\u27e9 leaves state unchanged (phase on |0\u27e9 amplitude has no observable effect)', () => {
    const circuit = [['S', 'M']]
    const result = simulate(circuit, 32)
    expect(result.counts['0']).toBe(32)
  })

  it('S on |1\u27e9 leaves measurement unchanged (phase on |1\u27e9 is not observable alone)', () => {
    const circuit = [['X', 'S', 'M']]
    const result = simulate(circuit, 32)
    expect(result.counts['1']).toBe(32)
  })

  it('S\u00b2 = Z: H \u2192 S \u2192 S \u2192 H produces |1\u27e9 (H\u00b7Z\u00b7H = X)', () => {
    // The sequence H-S-S-H is equivalent to H-Z-H = X, so |0\u27e9 \u2192 |1\u27e9
    const circuit = [['H', 'S', 'S', 'H', 'M']]
    const result = simulate(circuit, 64)
    expect(result.counts['1']).toBe(64)
    expect(result.counts['0']).toBeUndefined()
  })
})

// --- simulate -- norm conservation -------------------------------------------

describe('simulate -- norm conservation (physical invariant)', () => {
  it('X gate preserves total probability', () => {
    // X is unitary: measurement outcome must sum to 100% over enough shots
    const circuit = [['X', 'M']]
    const result = simulate(circuit, 512)
    const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(512)
  })

  it('H gate preserves total probability', () => {
    const circuit = [['H', 'M']]
    const result = simulate(circuit, 512)
    const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(512)
  })

  it('CNOT gate preserves total probability', () => {
    const circuit = [
      [{ gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
      [{ gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
    ]
    const result = simulate(circuit, 512)
    const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(512)
  })

  it('S gate preserves total probability', () => {
    const circuit = [['H', 'S', 'M']]
    const result = simulate(circuit, 512)
    const total = Object.values(result.counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(512)
  })
})
