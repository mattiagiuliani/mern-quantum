import { describe, it, expect } from 'vitest'
import { cloneCircuit, isCircuitEmpty, parseTags, buildMiniMeta } from './template.utils'

describe('cloneCircuit', () => {
  it('returns a shallow copy of each row', () => {
    const circuit = [['H', null], [null, 'X']]
    const clone = cloneCircuit(circuit)
    expect(clone).toEqual(circuit)
    clone[0][0] = 'Z'
    expect(circuit[0][0]).toBe('H')
  })
})

describe('isCircuitEmpty', () => {
  it('returns true for all-null matrix', () => {
    expect(isCircuitEmpty([[null, null], [null, null]])).toBe(true)
  })

  it('returns false when any cell has a gate', () => {
    expect(isCircuitEmpty([[null, 'H'], [null, null]])).toBe(false)
  })
})

describe('parseTags', () => {
  it('splits comma-separated tags', () => {
    expect(parseTags('a, b, c')).toEqual(['a', 'b', 'c'])
  })

  it('deduplicates tags', () => {
    expect(parseTags('x, x, y')).toEqual(['x', 'y'])
  })

  it('returns empty array for empty input', () => {
    expect(parseTags('')).toEqual([])
  })

  it('returns empty array for null input', () => {
    expect(parseTags(null)).toEqual([])
  })
})

describe('buildMiniMeta', () => {
  it('counts qubits, steps, and gates', () => {
    const circuit = [['H', null], [null, 'X']]
    expect(buildMiniMeta(circuit)).toEqual({ qubits: 2, steps: 2, gates: 2 })
  })
})
