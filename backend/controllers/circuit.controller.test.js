import test from 'node:test'
import assert from 'node:assert/strict'
import { runCircuit, applyGate } from './circuit.controller.js'

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

test('runCircuit rejects non-rectangular or invalid-gate circuits', () => {
  const badShapeReq = { body: { circuit: [['H', null], ['M']] } }
  const badGateReq = { body: { circuit: [['H', 'Z']] } }

  const res1 = createRes()
  runCircuit(badShapeReq, res1)
  assert.equal(res1.statusCode, 400)
  assert.equal(res1.body.success, false)

  const res2 = createRes()
  runCircuit(badGateReq, res2)
  assert.equal(res2.statusCode, 400)
  assert.equal(res2.body.success, false)
})

test('runCircuit success response shape is preserved', () => {
  const req = { body: { circuit: [['X', 'M']], shots: 8 } }
  const res = createRes()

  runCircuit(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.shots, 8)
  assert.equal(typeof res.body.counts, 'object')
})

test('applyGate validates qubitStates and qubitIndex', () => {
  const badStatesReq = {
    body: { qubitStates: [{ value: 2, superposition: false }], gate: 'X', qubitIndex: 0 },
  }
  const badIndexReq = {
    body: { qubitStates: [{ value: 0, superposition: false }], gate: 'X', qubitIndex: 0.5 },
  }

  const res1 = createRes()
  applyGate(badStatesReq, res1)
  assert.equal(res1.statusCode, 400)
  assert.equal(res1.body.success, false)

  const res2 = createRes()
  applyGate(badIndexReq, res2)
  assert.equal(res2.statusCode, 400)
  assert.equal(res2.body.success, false)
})

test('applyGate success path remains compatible', () => {
  const req = {
    body: {
      qubitStates: [{ value: 0, superposition: false }],
      gate: 'X',
      qubitIndex: 0,
    },
  }
  const res = createRes()

  applyGate(req, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.equal(res.body.measurement, null)
  assert.deepEqual(res.body.qubitStates, [{ value: 1, superposition: false }])
})
