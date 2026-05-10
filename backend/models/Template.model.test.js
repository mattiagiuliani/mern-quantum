/**
 * Tests for the Template Mongoose model.
 * Covers the internal isValidCircuitMatrix validator and the pre-validate tag hook.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import Template from './Template.model.js'

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

// ─── isValidCircuitMatrix (via Mongoose validation) ──────────────────────────

function authorId() {
  return new mongoose.Types.ObjectId()
}

async function attemptCreate(circuit) {
  const doc = new Template({ name: 'Tst', circuit, author: authorId(), isPublic: false })
  return doc.validate()
}

describe('Template.model — circuit validation', () => {
  it('accepts a valid 2-qubit H+M circuit', async () => {
    await expect(attemptCreate([['H', 'M'], ['H', 'M']])).resolves.toBeUndefined()
  })

  it('accepts a circuit with null cells', async () => {
    await expect(attemptCreate([[null, 'H'], [null, null]])).resolves.toBeUndefined()
  })

  it('rejects a non-array circuit', async () => {
    await expect(attemptCreate('not-array')).rejects.toThrow()
  })

  it('rejects an empty array', async () => {
    await expect(attemptCreate([])).rejects.toThrow()
  })

  it('rejects a circuit exceeding MAX_QUBITS (10)', async () => {
    const big = Array.from({ length: 11 }, () => ['H'])
    await expect(attemptCreate(big)).rejects.toThrow()
  })

  it('rejects a circuit exceeding MAX_STEPS (16)', async () => {
    await expect(attemptCreate([Array(17).fill('H')])).rejects.toThrow()
  })

  it('rejects a row with mismatched length', async () => {
    await expect(attemptCreate([['H', null], ['H']])).rejects.toThrow()
  })

  it('rejects an unknown gate', async () => {
    await expect(attemptCreate([['Z', null]])).rejects.toThrow()
  })
})

// ─── pre-validate tag hook ───────────────────────────────────────────────────

describe('Template.model — tag normalization', () => {
  it('deduplicates tags', async () => {
    const doc = new Template({
      name: 'Dedup',
      circuit: [['H']],
      author: authorId(),
      tags: ['bell', 'bell', 'quantum'],
    })
    await doc.validate()
    expect(doc.tags).toEqual(['bell', 'quantum'])
  })

  it('trims whitespace from tags', async () => {
    const doc = new Template({
      name: 'Trim',
      circuit: [['H']],
      author: authorId(),
      tags: ['  ghz  ', 'teleport '],
    })
    await doc.validate()
    expect(doc.tags).toEqual(['ghz', 'teleport'])
  })

  it('filters out blank/empty tags', async () => {
    const doc = new Template({
      name: 'Filter',
      circuit: [['H']],
      author: authorId(),
      tags: ['valid', '', '   '],
    })
    await doc.validate()
    expect(doc.tags).toEqual(['valid'])
  })
})
