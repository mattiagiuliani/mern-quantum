/**
 * Integration tests for auth routes.
 * Uses mongodb-memory-server so no real DB connection is needed.
 *
 * Run: node --test routes/auth.routes.test.js
 */
import 'dotenv/config'
import test, { before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createApp } from '../app.js'

process.env.JWT_SECRET    = 'integration-test-secret'
process.env.JWT_EXPIRES_IN = '1d'
process.env.CORS_ORIGIN   = 'http://localhost:5173'

let mongod
let app

before(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
})

after(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

// Clean users between tests
beforeEach(async () => {
  await mongoose.connection.collections.users?.deleteMany({})
})

// ─── /api/auth/register ───────────────────────────────────────────────────────

test('POST /api/auth/register — success', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'alice', email: 'alice@example.com', password: 'Abcdef1!' })
    .expect(201)

  assert.equal(res.body.success, true)
  assert.ok(res.body.user)
  assert.equal(res.body.user.username, 'alice')
  assert.ok(!res.body.user.password, 'password must not be returned')
})

test('POST /api/auth/register — duplicate email returns 409', async () => {
  const payload = { username: 'bob', email: 'bob@example.com', password: 'Abcdef1!' }
  await request(app).post('/api/auth/register').send(payload).expect(201)

  const res = await request(app).post('/api/auth/register').send(payload).expect(409)
  assert.equal(res.body.success, false)
})

test('POST /api/auth/register — missing fields returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'x@example.com' })
    .expect(400)
  assert.equal(res.body.success, false)
})

test('POST /api/auth/register — weak password returns 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'carol', email: 'carol@example.com', password: '1234' })
    .expect(400)
  assert.equal(res.body.success, false)
})

// ─── /api/auth/login ─────────────────────────────────────────────────────────

test('POST /api/auth/login — success sets cookie + returns user', async () => {
  // register first
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'dan', email: 'dan@example.com', password: 'Abcdef1!' })
    .expect(201)

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'dan@example.com', password: 'Abcdef1!' })
    .expect(200)

  assert.equal(res.body.success, true)
  assert.ok(res.body.user)
  // cookie must be set
  const cookies = res.headers['set-cookie']
  assert.ok(cookies && cookies.some(c => c.startsWith('token=')), 'JWT cookie must be set')
})

test('POST /api/auth/login — wrong password returns 401', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'eve', email: 'eve@example.com', password: 'Abcdef1!' })
    .expect(201)

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'eve@example.com', password: 'WrongPass9!' })
    .expect(401)

  assert.equal(res.body.success, false)
})

test('POST /api/auth/login — unknown email returns 401', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nobody@example.com', password: 'Abcdef1!' })
    .expect(401)
  assert.equal(res.body.success, false)
})

// ─── /api/auth/me ────────────────────────────────────────────────────────────

test('GET /api/auth/me — returns user when authenticated', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'frank', email: 'frank@example.com', password: 'Abcdef1!' })
    .expect(201)

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'frank@example.com', password: 'Abcdef1!' })
    .expect(200)

  const cookie = loginRes.headers['set-cookie'][0]

  const meRes = await request(app)
    .get('/api/auth/me')
    .set('Cookie', cookie)
    .expect(200)

  assert.equal(meRes.body.success, true)
  assert.equal(meRes.body.user.username, 'frank')
})

test('GET /api/auth/me — returns 401 when not authenticated', async () => {
  const res = await request(app).get('/api/auth/me').expect(401)
  assert.equal(res.body.success, false)
})

// ─── /api/auth/logout ────────────────────────────────────────────────────────

test('POST /api/auth/logout — clears cookie', async () => {
  const res = await request(app).post('/api/auth/logout').expect(200)
  assert.equal(res.body.success, true)
  const cookies = res.headers['set-cookie'] ?? []
  // Cookie should be cleared (Max-Age=0 or Expires in the past)
  const tokenCookie = cookies.find(c => c.startsWith('token='))
  assert.ok(!tokenCookie || tokenCookie.includes('Max-Age=0') || tokenCookie.includes('Expires='), 'token cookie should be cleared')
})

// ─── /api/auth/refresh ───────────────────────────────────────────────────────

test('POST /api/auth/refresh — issues new access token from refreshToken cookie', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'grace', email: 'grace@example.com', password: 'Abcdef1!' })
    .expect(201)

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'grace@example.com', password: 'Abcdef1!' })
    .expect(200)

  // Extract the refreshToken cookie from login response
  const cookies = loginRes.headers['set-cookie']
  const refreshCookie = cookies.find(c => c.startsWith('refreshToken='))
  assert.ok(refreshCookie, 'refreshToken cookie must be set on login')

  const refreshRes = await request(app)
    .post('/api/auth/refresh')
    .set('Cookie', refreshCookie)
    .expect(200)

  assert.equal(refreshRes.body.success, true)
  // A new access token cookie should be set
  const newCookies = refreshRes.headers['set-cookie'] ?? []
  assert.ok(newCookies.some(c => c.startsWith('token=')), 'new access token cookie must be set')
})

test('POST /api/auth/refresh — returns 401 with no refreshToken cookie', async () => {
  const res = await request(app).post('/api/auth/refresh').expect(401)
  assert.equal(res.body.success, false)
})
