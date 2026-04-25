/**
 * Integration tests for circuit routes.
 * Uses mongodb-memory-server — no real DB connection needed.
 *
 * Run: node --test routes/circuit.routes.test.js
 */
import 'dotenv/config'
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app.js'

process.env.JWT_SECRET     = 'integration-test-secret'
process.env.JWT_EXPIRES_IN = '1d'
process.env.CORS_ORIGIN    = 'http://localhost:5173'

let mongod
let app
let authCookie

// Empty 4-qubit × 8-step circuit
const emptyMatrix = Array.from({ length: 4 }, () => Array(8).fill(null))

before(async () => {
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

after(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await mongoose.connection.collections.circuits?.deleteMany({})
})

// ─── POST /api/circuits ───────────────────────────────────────────────────────

test('POST /api/circuits — saves a circuit', async () => {
  const res = await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Bell State', circuitMatrix: emptyMatrix })
    .expect(201)

  assert.equal(res.body.success, true)
  assert.ok(res.body.circuit._id)
  assert.equal(res.body.circuit.name, 'Bell State')
})

test('POST /api/circuits — requires auth', async () => {
  const res = await request(app)
    .post('/api/circuits')
    .send({ name: 'Test', circuitMatrix: emptyMatrix })
    .expect(401)
  assert.equal(res.body.success, false)
})

test('POST /api/circuits — rejects oversized circuit', async () => {
  const bigMatrix = Array.from({ length: 20 }, () => Array(20).fill(null))
  const res = await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Too Big', circuitMatrix: bigMatrix })
    .expect(400)
  assert.equal(res.body.success, false)
})

// ─── GET /api/circuits/mine ───────────────────────────────────────────────────

test('GET /api/circuits/mine — returns saved circuits', async () => {
  await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Circuit A', circuitMatrix: emptyMatrix })

  await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Circuit B', circuitMatrix: emptyMatrix })

  const res = await request(app)
    .get('/api/circuits/mine')
    .set('Cookie', authCookie)
    .expect(200)

  assert.equal(res.body.success, true)
  assert.ok(Array.isArray(res.body.circuits))
  assert.ok(res.body.circuits.length >= 2)
})

test('GET /api/circuits/mine — pagination works', async () => {
  // Create 5 circuits
  for (let i = 0; i < 5; i++) {
    await request(app)
      .post('/api/circuits')
      .set('Cookie', authCookie)
      .send({ name: `Circuit ${i}`, circuitMatrix: emptyMatrix })
  }

  const page1 = await request(app)
    .get('/api/circuits/mine?page=1&limit=2')
    .set('Cookie', authCookie)
    .expect(200)

  assert.equal(page1.body.circuits.length, 2)
  assert.ok(page1.body.total >= 5)
  assert.equal(page1.body.page, 1)
})

// ─── PUT /api/circuits/:id ────────────────────────────────────────────────────

test('PUT /api/circuits/:id — updates circuit name', async () => {
  const createRes = await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Old Name', circuitMatrix: emptyMatrix })
    .expect(201)

  const id = createRes.body.circuit._id

  const updateRes = await request(app)
    .put(`/api/circuits/${id}`)
    .set('Cookie', authCookie)
    .send({ name: 'New Name' })
    .expect(200)

  assert.equal(updateRes.body.success, true)
  assert.equal(updateRes.body.circuit.name, 'New Name')
})

test('PUT /api/circuits/:id — cannot update another user\'s circuit', async () => {
  // Create circuit as quser
  const createRes = await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'Mine', circuitMatrix: emptyMatrix })
    .expect(201)

  const id = createRes.body.circuit._id

  // Register + login a second user
  await request(app).post('/api/auth/register')
    .send({ username: 'hacker', email: 'hacker@example.com', password: 'Abcdef1!' })
  const hackerLogin = await request(app).post('/api/auth/login')
    .send({ email: 'hacker@example.com', password: 'Abcdef1!' })
  const hackerCookie = hackerLogin.headers['set-cookie'][0]

  const res = await request(app)
    .put(`/api/circuits/${id}`)
    .set('Cookie', hackerCookie)
    .send({ name: 'Hijacked' })
    .expect(403)

  assert.equal(res.body.success, false)
})

// ─── DELETE /api/circuits/:id ─────────────────────────────────────────────────

test('DELETE /api/circuits/:id — deletes own circuit', async () => {
  const createRes = await request(app)
    .post('/api/circuits')
    .set('Cookie', authCookie)
    .send({ name: 'ToDelete', circuitMatrix: emptyMatrix })
    .expect(201)

  const id = createRes.body.circuit._id

  const deleteRes = await request(app)
    .delete(`/api/circuits/${id}`)
    .set('Cookie', authCookie)
    .expect(200)

  assert.equal(deleteRes.body.success, true)

  // Confirm it's gone
  const mineRes = await request(app)
    .get('/api/circuits/mine')
    .set('Cookie', authCookie)
    .expect(200)

  const found = mineRes.body.circuits.find(c => c._id === id)
  assert.ok(!found, 'circuit should be deleted')
})

test('DELETE /api/circuits/:id — 404 for nonexistent id', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString()
  const res = await request(app)
    .delete(`/api/circuits/${fakeId}`)
    .set('Cookie', authCookie)
    .expect(404)
  assert.equal(res.body.success, false)
})
