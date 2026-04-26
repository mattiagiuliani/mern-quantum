/**
 * Integration tests for circuit routes.
 * Uses mongodb-memory-server -- no real DB connection needed.
 */
import 'dotenv/config'
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app.js'

process.env.JWT_SECRET         = 'integration-test-secret-aaaaaaaaaa'
process.env.JWT_REFRESH_SECRET = 'integration-test-refresh-bbbbbbbbbb'
process.env.JWT_EXPIRES_IN     = '1d'
process.env.CORS_ORIGIN        = 'http://localhost:5173'

let mongod
let app
let authCookie

// Empty 4-qubit x 8-step circuit
const emptyMatrix = Array.from({ length: 4 }, () => Array(8).fill(null))

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()

  // Register + login a test user once
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'quser', email: 'quser@example.com', password: 'Abcdef1!' })

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'quser@example.com', password: 'Abcdef1!' })

  authCookie = loginRes.headers['set-cookie'][0]
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await mongoose.connection.collections.circuits?.deleteMany({})
})

// --- POST /api/circuits -------------------------------------------------------

describe('POST /api/circuits', () => {
  it('saves a circuit', async () => {
    const res = await request(app)
      .post('/api/circuits')
      .set('Cookie', authCookie)
      .send({ name: 'Bell State', circuitMatrix: emptyMatrix })
      .expect(201)
    expect(res.body.success).toBe(true)
    expect(res.body.circuit._id).toBeTruthy()
    expect(res.body.circuit.name).toBe('Bell State')
  })

  it('requires auth', async () => {
    const res = await request(app)
      .post('/api/circuits')
      .send({ name: 'Test', circuitMatrix: emptyMatrix })
      .expect(401)
    expect(res.body.success).toBe(false)
  })

  it('rejects oversized circuit', async () => {
    const bigMatrix = Array.from({ length: 20 }, () => Array(20).fill(null))
    const res = await request(app)
      .post('/api/circuits')
      .set('Cookie', authCookie)
      .send({ name: 'Too Big', circuitMatrix: bigMatrix })
      .expect(400)
    expect(res.body.success).toBe(false)
  })
})

// --- GET /api/circuits/mine ---------------------------------------------------

describe('GET /api/circuits/mine', () => {
  it('returns saved circuits', async () => {
    await request(app).post('/api/circuits').set('Cookie', authCookie)
      .send({ name: 'Circuit A', circuitMatrix: emptyMatrix })
    await request(app).post('/api/circuits').set('Cookie', authCookie)
      .send({ name: 'Circuit B', circuitMatrix: emptyMatrix })

    const res = await request(app).get('/api/circuits/mine').set('Cookie', authCookie).expect(200)
    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.circuits)).toBe(true)
    expect(res.body.circuits.length).toBeGreaterThanOrEqual(2)
  })

  it('pagination works', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/circuits').set('Cookie', authCookie)
        .send({ name: `Circuit ${i}`, circuitMatrix: emptyMatrix })
    }
    const page1 = await request(app)
      .get('/api/circuits/mine?page=1&limit=2')
      .set('Cookie', authCookie)
      .expect(200)
    expect(page1.body.circuits.length).toBe(2)
    expect(page1.body.total).toBeGreaterThanOrEqual(5)
    expect(page1.body.page).toBe(1)
  })
})

// --- PUT /api/circuits/:id ---------------------------------------------------

describe('PUT /api/circuits/:id', () => {
  it('updates circuit name', async () => {
    const createRes = await request(app).post('/api/circuits').set('Cookie', authCookie)
      .send({ name: 'Old Name', circuitMatrix: emptyMatrix }).expect(201)
    const id = createRes.body.circuit._id

    const updateRes = await request(app).put(`/api/circuits/${id}`)
      .set('Cookie', authCookie).send({ name: 'New Name' }).expect(200)
    expect(updateRes.body.success).toBe(true)
    expect(updateRes.body.circuit.name).toBe('New Name')
  })

  it("cannot update another user's circuit", async () => {
    const createRes = await request(app).post('/api/circuits').set('Cookie', authCookie)
      .send({ name: 'Mine', circuitMatrix: emptyMatrix }).expect(201)
    const id = createRes.body.circuit._id

    await request(app).post('/api/auth/register')
      .send({ username: 'hacker', email: 'hacker@example.com', password: 'Abcdef1!' })
    const hackerLogin = await request(app).post('/api/auth/login')
      .send({ email: 'hacker@example.com', password: 'Abcdef1!' })
    const hackerCookie = hackerLogin.headers['set-cookie'][0]

    const res = await request(app).put(`/api/circuits/${id}`)
      .set('Cookie', hackerCookie).send({ name: 'Hijacked' }).expect(403)
    expect(res.body.success).toBe(false)
  })
})

// --- DELETE /api/circuits/:id ------------------------------------------------

describe('DELETE /api/circuits/:id', () => {
  it('deletes own circuit', async () => {
    const createRes = await request(app).post('/api/circuits').set('Cookie', authCookie)
      .send({ name: 'ToDelete', circuitMatrix: emptyMatrix }).expect(201)
    const id = createRes.body.circuit._id

    const deleteRes = await request(app).delete(`/api/circuits/${id}`)
      .set('Cookie', authCookie).expect(200)
    expect(deleteRes.body.success).toBe(true)

    const mineRes = await request(app).get('/api/circuits/mine').set('Cookie', authCookie).expect(200)
    expect(mineRes.body.circuits.find(c => c._id === id)).toBeFalsy()
  })

  it('404 for nonexistent id', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const res = await request(app).delete(`/api/circuits/${fakeId}`)
      .set('Cookie', authCookie).expect(404)
    expect(res.body.success).toBe(false)
  })
})
