import { describe, it, expect } from 'vitest'
import {
  isValidGate,
  normalizeTemplateCircuit,
  buildGateSequenceFromCircuit,
  emptyCircuit,
} from './circuitBuilder.utils'
import { NUM_QUBITS, MAX_STEPS } from './circuitBuilder.constants'

describe('isValidGate', () => {
  it('accepts null', () => expect(isValidGate(null)).toBe(true))
  it('accepts H', () => expect(isValidGate('H')).toBe(true))
  it('accepts X', () => expect(isValidGate('X')).toBe(true))
  it('accepts M', () => expect(isValidGate('M')).toBe(true))
  it('rejects unknown gate', () => expect(isValidGate('Z')).toBe(false))
  it('rejects empty string', () => expect(isValidGate('')).toBe(false))
})

describe('normalizeTemplateCircuit', () => {
  it('returns correct dimensions', () => {
    const result = normalizeTemplateCircuit([])
    expect(result).toHaveLength(NUM_QUBITS)
    expect(result[0]).toHaveLength(MAX_STEPS)
  })

  it('copies valid gates', () => {
    const input = [['H', null, 'X', null, null, null, null, null]]
    const result = normalizeTemplateCircuit(input)
    expect(result[0][0]).toBe('H')
    expect(result[0][2]).toBe('X')
  })

  it('drops invalid gates', () => {
    const input = [['Z', null, null, null, null, null, null, null]]
    const result = normalizeTemplateCircuit(input)
    expect(result[0][0]).toBeNull()
  })
})

describe('buildGateSequenceFromCircuit', () => {
  it('returns empty array for empty circuit', () => {
    const result = buildGateSequenceFromCircuit(emptyCircuit())
    expect(result).toHaveLength(0)
  })

  it('emits operations in column-major (step-first) order', () => {
    const circuit = emptyCircuit()
    circuit[1][0] = 'H'
    circuit[0][1] = 'X'
    const ops = buildGateSequenceFromCircuit(circuit)
    expect(ops[0].gate).toBe('H')
    expect(ops[0].qubit).toBe(1)
    expect(ops[1].gate).toBe('X')
    expect(ops[1].qubit).toBe(0)
  })
})
