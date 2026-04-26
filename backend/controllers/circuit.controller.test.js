import { describe, it, expect } from 'vitest'
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

describe('runCircuit', () => {
  it('rejects non-rectangular or invalid-gate circuits', () => {
    const badShapeReq = { body: { circuit: [['H', null], ['M']] } }
    const badGateReq = { body: { circuit: [['H', 'Z']] } }

    const res1 = createRes()
    runCircuit(badShapeReq, res1)
    expect(res1.statusCode).toBe(400)
    expect(res1.body.success).toBe(false)

    const res2 = createRes()
    runCircuit(badGateReq, res2)
    expect(res2.statusCode).toBe(400)
    expect(res2.body.success).toBe(false)
  })

  it('success response shape is preserved', () => {
    const req = { body: { circuit: [['X', 'M']], shots: 8 } }
    const res = createRes()
    runCircuit(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.shots).toBe(8)
    expect(typeof res.body.counts).toBe('object')
  })
})

describe('applyGate', () => {
  it('validates qubitStates and qubitIndex', () => {
    const badStatesReq = {
      body: { qubitStates: [{ value: 2, superposition: false }], gate: 'X', qubitIndex: 0 },
    }
    const badIndexReq = {
      body: { qubitStates: [{ value: 0, superposition: false }], gate: 'X', qubitIndex: 0.5 },
    }

    const res1 = createRes()
    applyGate(badStatesReq, res1)
    expect(res1.statusCode).toBe(400)
    expect(res1.body.success).toBe(false)

    const res2 = createRes()
    applyGate(badIndexReq, res2)
    expect(res2.statusCode).toBe(400)
    expect(res2.body.success).toBe(false)
  })

  it('success path remains compatible', () => {
    const req = {
      body: {
        qubitStates: [{ value: 0, superposition: false }],
        gate: 'X',
        qubitIndex: 0,
      },
    }
    const res = createRes()
    applyGate(req, res)
    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.measurement).toBeNull()
    expect(res.body.qubitStates).toEqual([{ value: 1, superposition: false }])
  })
})

// â”€â”€â”€ shared fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ saveCircuit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('saveCircuit', () => {
  it('rejects missing circuitMatrix', async () => {
    const req = { body: { name: 'test' }, user: { id: OWNER_ID } }
    const res = createRes()
    await saveCircuit(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('creates circuit and returns 201', async () => {
    const original = Circuit.create
    const fake = makeFakeCircuit()
    Circuit.create = async () => fake
    try {
      const req = {
        body: { name: 'My circuit', circuitMatrix: [['H', null], ['X', null]] },
        user: { id: OWNER_ID },
      }
      const res = createRes()
      await saveCircuit(req, res)
      expect(res.statusCode).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.circuit).toBeTruthy()
    } finally {
      Circuit.create = original
    }
  })
})

// â”€â”€â”€ getMineCircuits â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('getMineCircuits', () => {
  it('returns circuits for authenticated user', async () => {
    const originalFind  = Circuit.find
    const originalCount = Circuit.countDocuments
    Circuit.find = () => makeChainableFindResult([makeFakeCircuit()])
    Circuit.countDocuments = async () => 1
    try {
      const req = { user: { id: OWNER_ID }, query: {} }
      const res = createRes()
      await getMineCircuits(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.circuits)).toBe(true)
      expect(res.body.circuits.length).toBe(1)
    } finally {
      Circuit.find = originalFind
      Circuit.countDocuments = originalCount
    }
  })

  it('returns 500 on DB error', async () => {
    const originalFind  = Circuit.find
    const originalCount = Circuit.countDocuments
    Circuit.find = () => { throw new Error('db failure') }
    Circuit.countDocuments = async () => 0
    try {
      const req = { user: { id: OWNER_ID }, query: {} }
      const res = createRes()
      await getMineCircuits(req, res)
      expect(res.statusCode).toBe(500)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.find = originalFind
      Circuit.countDocuments = originalCount
    }
  })
})

// â”€â”€â”€ getCircuitById â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('getCircuitById', () => {
  it('rejects invalid id format', async () => {
    const req = { params: { id: 'not-an-id' }, user: { id: OWNER_ID } }
    const res = createRes()
    await getCircuitById(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 when circuit not found', async () => {
    const original = Circuit.findById
    Circuit.findById = () => ({ lean: async () => null })
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await getCircuitById(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('returns 403 for non-owner', async () => {
    const original = Circuit.findById
    Circuit.findById = () => ({ lean: async () => makeFakeCircuit(OTHER_ID) })
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await getCircuitById(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('returns circuit for owner', async () => {
    const original = Circuit.findById
    Circuit.findById = () => ({ lean: async () => makeFakeCircuit(OWNER_ID) })
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await getCircuitById(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.circuit).toBeTruthy()
    } finally {
      Circuit.findById = original
    }
  })
})

// â”€â”€â”€ updateCircuit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('updateCircuit', () => {
  it('rejects invalid id format', async () => {
    const req = { params: { id: 'bad-id' }, body: {}, user: { id: OWNER_ID } }
    const res = createRes()
    await updateCircuit(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 when circuit not found', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => null
    try {
      const req = { params: { id: CIRCUIT_ID }, body: {}, user: { id: OWNER_ID } }
      const res = createRes()
      await updateCircuit(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('returns 403 for non-owner', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => makeFakeCircuit(OTHER_ID)
    try {
      const req = { params: { id: CIRCUIT_ID }, body: { name: 'new' }, user: { id: OWNER_ID } }
      const res = createRes()
      await updateCircuit(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('updates name and returns 200', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => makeFakeCircuit(OWNER_ID)
    try {
      const req = {
        params: { id: CIRCUIT_ID },
        body: { name: 'Updated name' },
        user: { id: OWNER_ID },
      }
      const res = createRes()
      await updateCircuit(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    } finally {
      Circuit.findById = original
    }
  })
})

// â”€â”€â”€ deleteCircuit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('deleteCircuit', () => {
  it('rejects invalid id format', async () => {
    const req = { params: { id: 'bad-id' }, user: { id: OWNER_ID } }
    const res = createRes()
    await deleteCircuit(req, res)
    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 404 when circuit not found', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => null
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await deleteCircuit(req, res)
      expect(res.statusCode).toBe(404)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('returns 403 for non-owner', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => makeFakeCircuit(OTHER_ID)
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await deleteCircuit(req, res)
      expect(res.statusCode).toBe(403)
      expect(res.body.success).toBe(false)
    } finally {
      Circuit.findById = original
    }
  })

  it('removes circuit and returns 200', async () => {
    const original = Circuit.findById
    Circuit.findById = async () => makeFakeCircuit(OWNER_ID)
    try {
      const req = { params: { id: CIRCUIT_ID }, user: { id: OWNER_ID } }
      const res = createRes()
      await deleteCircuit(req, res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    } finally {
      Circuit.findById = original
    }
  })
})

