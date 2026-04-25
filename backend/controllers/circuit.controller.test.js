import test from 'node:test'
import assert from 'node:assert/strict'
import { runCircuit, applyGate, saveCircuit, getMineCircuits, getCircuitById, updateCircuit, deleteCircuit } from './circuit.controller.js'
import Circuit from '../models/Circuit.model.js'

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

// ─── shared fixtures ─────────────────────────────────────────────────────────

const OWNER_ID = '507f191e810c19729de860ea'
const OTHER_ID = '507f191e810c19729de860ff'
const CIRCUIT_ID = '507f191e810c19729de860bb'

function makeFakeCircuit(ownerId = OWNER_ID) {
  return {
    _id: CIRCUIT_ID,
    owner: { toString: () => ownerId },
    name: 'My circuit',
    qubits: 2,
    circuitMatrix: [['H', null], ['X', null]],
    lastResult: null,
    save: async function () { return this },
    deleteOne: async () => {},
  }
}

function makeChainableFindResult(docs) {
  const chain = {
    sort()   { return this },
    skip()   { return this },
    limit()  { return this },
    select() { return this },
    lean: async () => docs,
  }
  return chain
}

// ─── saveCircuit ─────────────────────────────────────────────────────────────

test('saveCircuit rejects missing circuitMatrix', async () => {
  const req = { body: { name: 'test' }, user: { id: OWNER_ID } }
  const res = createRes()
  await saveCircuit(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('saveCircuit creates circuit and returns 201', async (t) => {
  const original = Circuit.create
  const fake = makeFakeCircuit()
  Circuit.create = async () => fake
  t.after(() => { Circuit.create = original })

  const req = {
    body: { name: 'My circuit', circuitMatrix: [['H', null], ['X', null]] },
    user: { id: OWNER_ID },
  }
  const res = createRes()
  await saveCircuit(req, res)
  assert.equal(res.statusCode, 201)
  assert.equal(res.body.success, true)
  assert.ok(res.body.circuit)
})

// ─── getMineCircuits ──────────────────────────────────────────────────────────

test('getMineCircuits returns circuits for authenticated user', async (t) => {
  const originalFind = Circuit.find
  const originalCount = Circuit.countDocuments
  Circuit.find = () => makeChainableFindResult([makeFakeCircuit()])
  Circuit.countDocuments = async () => 1
  t.after(() => {
    Circuit.find = originalFind
    Circuit.countDocuments = originalCount
  })

  const req = { user: { id: OWNER_ID }, query: {} }
  const res = createRes()
  await getMineCircuits(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.ok(Array.isArray(res.body.circuits))
  assert.equal(res.body.circuits.length, 1)
})

test('getMineCircuits returns 500 on DB error', async (t) => {
  const originalFind  = Circuit.find
  const originalCount = Circuit.countDocuments
  Circuit.find = () => { throw new Error('db failure') }
  Circuit.countDocuments = async () => 0
  t.after(() => {
    Circuit.find  = originalFind
    Circuit.countDocuments = originalCount
  })

  const req = { user: { id: OWNER_ID }, query: {} }
  const res = createRes()
  await getMineCircuits(req, res)
  assert.equal(res.statusCode, 500)
  assert.equal(res.body.success, false)
})

// ─── getCircuitById ───────────────────────────────────────────────────────────

test('getCircuitById rejects invalid id format', async () => {
  const req = { params: { id: 'not-an-id' }, user: { id: OWNER_ID } }
  const res = createRes()
  await getCircuitById(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('getCircuitById returns 404 when circuit not found', async (t) => {
  const original = Circuit.findById
  Circuit.findById = () => ({ lean: async () => null })
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await getCircuitById(req, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('getCircuitById returns 403 for non-owner', async (t) => {
  const original = Circuit.findById
  Circuit.findById = () => ({ lean: async () => makeFakeCircuit(OTHER_ID) })
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await getCircuitById(req, res)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('getCircuitById returns circuit for owner', async (t) => {
  const original = Circuit.findById
  Circuit.findById = () => ({ lean: async () => makeFakeCircuit(OWNER_ID) })
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await getCircuitById(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
  assert.ok(res.body.circuit)
})

// ─── updateCircuit ────────────────────────────────────────────────────────────

test('updateCircuit rejects invalid id format', async () => {
  const req = { params: { id: 'bad-id' }, body: {}, user: { id: OWNER_ID } }
  const res = createRes()
  await updateCircuit(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('updateCircuit returns 404 when circuit not found', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => null
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, body: {}, user: { id: OWNER_ID } }
  const res = createRes()
  await updateCircuit(req, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('updateCircuit returns 403 for non-owner', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => makeFakeCircuit(OTHER_ID)
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, body: { name: 'new' }, user: { id: OWNER_ID } }
  const res = createRes()
  await updateCircuit(req, res)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('updateCircuit updates name and returns 200', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => makeFakeCircuit(OWNER_ID)
  t.after(() => { Circuit.findById = original })

  const req = {
    params: { id: CIRCUIT_ID },
    body: { name: 'Updated name' },
    user: { id: OWNER_ID },
  }
  const res = createRes()
  await updateCircuit(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})

// ─── deleteCircuit ────────────────────────────────────────────────────────────

test('deleteCircuit rejects invalid id format', async () => {
  const req = { params: { id: 'bad-id' }, user: { id: OWNER_ID } }
  const res = createRes()
  await deleteCircuit(req, res)
  assert.equal(res.statusCode, 400)
  assert.equal(res.body.success, false)
})

test('deleteCircuit returns 404 when circuit not found', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => null
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await deleteCircuit(req, res)
  assert.equal(res.statusCode, 404)
  assert.equal(res.body.success, false)
})

test('deleteCircuit returns 403 for non-owner', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => makeFakeCircuit(OTHER_ID)
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await deleteCircuit(req, res)
  assert.equal(res.statusCode, 403)
  assert.equal(res.body.success, false)
})

test('deleteCircuit removes circuit and returns 200', async (t) => {
  const original = Circuit.findById
  Circuit.findById = async () => makeFakeCircuit(OWNER_ID)
  t.after(() => { Circuit.findById = original })

  const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
  const res = createRes()
  await deleteCircuit(req, res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.success, true)
})
