import test from 'node:test'
import assert from 'node:assert/strict'
import { applyGateStep, simulate } from './quantum.service.js'

// ─── applyGateStep ───────────────────────────────────────────────────────────

test('H toggles superposition and keeps measurement null', () => {
  assert.deepEqual(applyGateStep(0, false, 'H'), [0, true, null])
  assert.deepEqual(applyGateStep(1, true, 'H'), [1, false, null])
})

test('X flips deterministic value and preserves superposition branch', () => {
  assert.deepEqual(applyGateStep(0, false, 'X'), [1, false, null])
  assert.deepEqual(applyGateStep(1, false, 'X'), [0, false, null])
  assert.deepEqual(applyGateStep(0, true, 'X'), [0, true, null])
})

test('M collapses superposition using randomness and returns measurement', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0.3
    assert.deepEqual(applyGateStep(1, true, 'M'), [0, false, 0])

    Math.random = () => 0.9
    assert.deepEqual(applyGateStep(0, true, 'M'), [1, false, 1])

    assert.deepEqual(applyGateStep(1, false, 'M'), [1, false, 1])
  } finally {
    Math.random = originalRandom
  }
})

// ─── simulate — single-qubit ─────────────────────────────────────────────────

test('simulate returns no-measure bucket when circuit has no M gate', () => {
  const circuit = [
    ['H', null],
    ['X', null],
  ]

  const result = simulate(circuit, 16)
  assert.equal(result.shots, 16)
  assert.deepEqual(result.counts, { '(no measure)': 16 })
})

test('simulate accumulates deterministic counts for X then M', () => {
  const circuit = [['X', 'M']]

  const result = simulate(circuit, 8)
  assert.equal(result.shots, 8)
  assert.equal(result.counts['1'], 8)
})

// ─── simulate — CNOT ─────────────────────────────────────────────────────────

test('CNOT with ctrl=|0⟩ leaves target unchanged', () => {
  // ctrl q[0]=|0⟩, tgt q[1]=|0⟩ → both stay |0⟩
  const circuit = [
    [{ gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
    [{ gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
  ]
  const result = simulate(circuit, 16)
  assert.equal(result.shots, 16)
  assert.equal(result.counts['00'], 16)
})

test('CNOT with ctrl=|1⟩ flips target', () => {
  // q[0] is flipped to |1⟩ by X first, then CNOT flips q[1] to |1⟩
  const circuit = [
    ['X', { gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
    [null, { gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
  ]
  const result = simulate(circuit, 16)
  assert.equal(result.shots, 16)
  assert.equal(result.counts['11'], 16)
})

test('Bell state: H then CNOT then M produces only 00 or 11', () => {
  // Standard Bell state preparation: H on q[0], CNOT q[0]→q[1], measure both
  const circuit = [
    ['H', { gate: 'CNOT', role: 'ctrl', partner: 1 }, 'M'],
    [null, { gate: 'CNOT', role: 'tgt',  partner: 0 }, 'M'],
  ]
  const result = simulate(circuit, 1024)
  assert.equal(result.shots, 1024)
  const keys = Object.keys(result.counts)
  assert.ok(keys.every(k => k === '00' || k === '11'), `Unexpected keys: ${keys}`)
  assert.ok((result.counts['00'] ?? 0) + (result.counts['11'] ?? 0) === 1024)
})
