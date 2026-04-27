/**
 * Integration tests for auth routes.
 * Uses mongodb-memory-server so no real DB connection is needed.
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

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  app = createApp()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

beforeEach(async () => {
  await mongoose.connection.collections.users?.deleteMany({})
})

// --- /api/v1/auth/register -------------------------------------------------------

describe('POST /api/v1/auth/register', () => {
  it('success', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'alice', email: 'alice@example.com', password: 'Abcdef1!' })
      .expect(201)
    expect(res.body.success).toBe(true)
    expect(res.body.user).toBeTruthy()
    expect(res.body.user.username).toBe('alice')
    expect(res.body.user.password).toBeFalsy()
  })

  it('duplicate email returns 409', async () => {
    const payload = { username: 'bob', email: 'bob@example.com', password: 'Abcdef1!' }
    await request(app).post('/api/v1/auth/register').send(payload).expect(201)
    const res = await request(app).post('/api/v1/auth/register').send(payload).expect(409)
    expect(res.body.success).toBe(false)
  })

  it('missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'x@example.com' })
      .expect(400)
    expect(res.body.success).toBe(false)
  })

  it('weak password returns 400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'carol', email: 'carol@example.com', password: '1234' })
      .expect(400)
    expect(res.body.success).toBe(false)
  })
})

// --- /api/v1/auth/login ---------------------------------------------------------

describe('POST /api/v1/auth/login', () => {
  it('success sets cookie + returns user', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'dan', email: 'dan@example.com', password: 'Abcdef1!' })
      .expect(201)
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'dan@example.com', password: 'Abcdef1!' })
      .expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user).toBeTruthy()
    const cookies = res.headers['set-cookie']
    expect(cookies && cookies.some(c => c.startsWith('token='))).toBe(true)
  })

  it('wrong password returns 401', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'eve', email: 'eve@example.com', password: 'Abcdef1!' })
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'eve@example.com', password: 'WrongPass1!' })
      .expect(401)
    expect(res.body.success).toBe(false)
  })
})

// --- /api/v1/auth/logout --------------------------------------------------------

describe('POST /api/v1/auth/logout', () => {
  it('clears cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout').expect(200)
    expect(res.body.success).toBe(true)
    const cookies = res.headers['set-cookie'] ?? []
    const tokenCookie = cookies.find(c => c.startsWith('token='))
    expect(!tokenCookie || tokenCookie.includes('Max-Age=0') || tokenCookie.includes('Expires=')).toBe(true)
  })
})

// --- /api/v1/auth/refresh -------------------------------------------------------

describe('POST /api/v1/auth/refresh', () => {
  it('issues new access token from refreshToken cookie', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ username: 'grace', email: 'grace@example.com', password: 'Abcdef1!' })
      .expect(201)
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'grace@example.com', password: 'Abcdef1!' })
      .expect(200)
    const cookies = loginRes.headers['set-cookie']
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='))
    expect(refreshCookie).toBeTruthy()
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200)
    expect(refreshRes.body.success).toBe(true)
    const newCookies = refreshRes.headers['set-cookie'] ?? []
    expect(newCookies.some(c => c.startsWith('token='))).toBe(true)
  })

  it('returns 401 with no refreshToken cookie', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').expect(401)
    expect(res.body.success).toBe(false)
  })
})

