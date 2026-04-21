import test from 'node:test'
import assert from 'node:assert/strict'
import { applyGateStep, simulate } from './quantum.service.js'

test('H toggles superposition and keeps measurement null', () => {
  assert.deepEqual(applyGateStep(0, false, 'H', 'v2'), [0, true, null])
  assert.deepEqual(applyGateStep(1, true, 'H', 'v2'), [1, false, null])
})

test('X flips deterministic value and preserves superposition branch', () => {
  assert.deepEqual(applyGateStep(0, false, 'X', 'v2'), [1, false, null])
  assert.deepEqual(applyGateStep(1, false, 'X', 'v2'), [0, false, null])
  assert.deepEqual(applyGateStep(0, true, 'X', 'v2'), [0, true, null])
})

test('M collapses superposition using randomness and returns measurement', () => {
  const originalRandom = Math.random
  try {
    Math.random = () => 0.3
    assert.deepEqual(applyGateStep(1, true, 'M', 'v2'), [0, false, 0])

    Math.random = () => 0.9
    assert.deepEqual(applyGateStep(0, true, 'M', 'v2'), [1, false, 1])

    assert.deepEqual(applyGateStep(1, false, 'M', 'v2'), [1, false, 1])
  } finally {
    Math.random = originalRandom
  }
})

test('v1 mode preserves legacy H/X behavior for rollback', () => {
  assert.deepEqual(applyGateStep(1, false, 'H', 'v1'), [1, true, null])
  assert.deepEqual(applyGateStep(0, true, 'H', 'v1'), [0, true, null])
  assert.deepEqual(applyGateStep(1, true, 'X', 'v1'), [0, true, null])
})

test('simulate returns no-measure bucket when circuit has no M gate', () => {
  const circuit = [
    ['H', null],
    ['X', null],
  ]

  const result = simulate(circuit, 16, 'v2')
  assert.equal(result.shots, 16)
  assert.deepEqual(result.counts, { '(no measure)': 16 })
})

test('simulate accumulates deterministic counts for X then M', () => {
  const circuit = [
    ['X', 'M'],
  ]

  const result = simulate(circuit, 8, 'v2')
  assert.equal(result.shots, 8)
  assert.equal(result.counts['1'], 8)
})
