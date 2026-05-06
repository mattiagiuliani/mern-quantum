import { describe, it, expect } from 'vitest'
import { isValidCnotCell, isValidCircuitMatrix } from './circuitValidation.js'

// ─── isValidCnotCell ─────────────────────────────────────────────────────────

describe('isValidCnotCell', () => {
  it('returns false for null', () => {
    expect(isValidCnotCell(null, 0, 2)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isValidCnotCell('H', 0, 2)).toBe(false)
  })

  it('returns false when gate is not CNOT', () => {
    expect(isValidCnotCell({ gate: 'X', role: 'ctrl', partner: 1 }, 0, 2)).toBe(false)
  })

  it('returns false when role is invalid', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'bad', partner: 1 }, 0, 2)).toBe(false)
  })

  it('returns false when partner is not an integer', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'ctrl', partner: 1.5 }, 0, 2)).toBe(false)
  })

  it('returns false when partner is negative', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'ctrl', partner: -1 }, 0, 2)).toBe(false)
  })

  it('returns false when partner >= numQubits', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'ctrl', partner: 2 }, 0, 2)).toBe(false)
  })

  it('returns false when partner equals qubitIdx (self-targeting)', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'ctrl', partner: 0 }, 0, 2)).toBe(false)
  })

  it('returns true for a valid ctrl cell', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'ctrl', partner: 1 }, 0, 2)).toBe(true)
  })

  it('returns true for a valid tgt cell', () => {
    expect(isValidCnotCell({ gate: 'CNOT', role: 'tgt', partner: 0 }, 1, 2)).toBe(true)
  })
})

// ─── isValidCircuitMatrix ────────────────────────────────────────────────────

const cell = (role, partner) => ({ gate: 'CNOT', role, partner })

describe('isValidCircuitMatrix', () => {
  it('returns false for non-array', () => {
    expect(isValidCircuitMatrix(null)).toBe(false)
    expect(isValidCircuitMatrix('string')).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(isValidCircuitMatrix([])).toBe(false)
  })

  it('returns false when rows exceed MAX_QUBITS (10)', () => {
    const matrix = Array.from({ length: 11 }, () => [null])
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when first row is not an array', () => {
    expect(isValidCircuitMatrix([null])).toBe(false)
  })

  it('returns false when stepCount exceeds MAX_STEPS (16)', () => {
    const matrix = [Array(17).fill(null)]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when a row has wrong length', () => {
    const matrix = [
      ['H', null],
      [null],        // shorter row
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false for an unknown gate string', () => {
    expect(isValidCircuitMatrix([['Z', null]])).toBe(false)
  })

  it('returns true for a valid single-gate circuit', () => {
    expect(isValidCircuitMatrix([['H', 'X', 'M', 'S', null]])).toBe(true)
  })

  it('returns true for an all-null circuit', () => {
    expect(isValidCircuitMatrix([[null, null], [null, null]])).toBe(true)
  })

  it('returns false for an invalid CNOT cell object', () => {
    // gate key missing — not a valid CNOT
    const matrix = [[{ gate: 'X', role: 'ctrl', partner: 1 }, null], [null, null]]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner row is missing', () => {
    const matrix = [
      [cell('ctrl', 5), null],  // partner index 5 doesn't exist
      [null, null],
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner cell is null', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      [null, null],             // partner step 0 is null
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner is not an object', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      ['H', null],              // partner step 0 is a string
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner gate is not CNOT', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      [{ gate: 'X', role: 'tgt', partner: 0 }, null],
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner does not point back', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      [{ gate: 'CNOT', role: 'tgt', partner: 99 }, null],
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns false when CNOT partner role is wrong (ctrl-ctrl)', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      [{ gate: 'CNOT', role: 'ctrl', partner: 0 }, null],  // should be tgt
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(false)
  })

  it('returns true for a valid 2-qubit CNOT', () => {
    const matrix = [
      [cell('ctrl', 1), null],
      [cell('tgt', 0),  null],
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(true)
  })

  it('returns true for tgt→ctrl pair', () => {
    const matrix = [
      [cell('tgt',  1), null],
      [cell('ctrl', 0), null],
    ]
    expect(isValidCircuitMatrix(matrix)).toBe(true)
  })

  it('returns false for an unexpected cell type (number)', () => {
    expect(isValidCircuitMatrix([[42]])).toBe(false)
  })
})
