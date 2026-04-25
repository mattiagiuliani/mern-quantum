import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  withCredentials: true,
})

// Track if a refresh is already in flight to avoid infinite retry loops
let isRefreshing = false
let pendingQueue = []

function processQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve())
  pendingQueue = []
}

// On 401: try the refresh endpoint once, then retry. On failure, redirect to /login.
api.interceptors.response.use(null, async (error) => {
  const status  = error.response?.status
  const url     = error.config?.url ?? ''
  const isRetry = error.config?._retry

  // Don't intercept auth probes or already-retried requests
  if (status !== 401 || url.includes('/auth/me') || url.includes('/auth/refresh') || isRetry) {
    return Promise.reject(error)
  }

  if (isRefreshing) {
    // Queue this request until the in-flight refresh resolves
    return new Promise((resolve, reject) => {
      pendingQueue.push({ resolve, reject })
    }).then(() => {
      error.config._retry = true
      return api(error.config)
    })
  }

  isRefreshing = true
  try {
    await api.post('/auth/refresh')
    processQueue(null)
    error.config._retry = true
    return api(error.config)
  } catch (refreshError) {
    processQueue(refreshError)
    window.location.href = '/login'
    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
})

/**
 * POST /api/circuits/run
 * @param {string[][]} circuit  circuit[qubit][step]
 * @param {number} shots
 * @returns {Promise<{ counts: Object<string,number>, shots: number }>}
 */
export async function runCircuit(circuit, shots = 1024) {
  const { data } = await api.post('/circuits/run', { circuit, shots })
  return data
}

/**
 * POST /api/circuits/applyGate  — live single-gate update
 *
 * For single-qubit gates (H, X, M):
 *   @param {{ value: 0|1, superposition: boolean }[]} qubitStates
 *   @param {'H'|'X'|'M'} gate
 *   @param {number} qubitIndex
 *
 * For CNOT:
 *   @param {{ value: 0|1, superposition: boolean }[]} qubitStates
 *   @param {'CNOT'} gate
 *   @param {number} controlIndex
 *   @param {number} targetIndex
 *
 * @returns {Promise<{ qubitStates: { value: 0|1, superposition: boolean }[], measurement: 0|1|null }>}
 */
export async function applyGate(qubitStates, gate, qubitIndexOrControl, targetIndex) {
  const body = gate === 'CNOT'
    ? { qubitStates, gate, controlIndex: qubitIndexOrControl, targetIndex }
    : { qubitStates, gate, qubitIndex: qubitIndexOrControl }
  const { data } = await api.post('/circuits/applyGate', body)
  return data
}

// ─── templates ───────────────────────────────────────────────────────────────

export async function createTemplate(payload) {
  const { data } = await api.post('/templates', payload)
  return data
}

export async function getMyTemplates() {
  const { data } = await api.get('/templates/mine')
  return data
}

export async function getPublicTemplates(tag) {
  const { data } = await api.get('/templates/public', {
    params: tag ? { tag } : undefined,
  })
  return data
}

export async function getTemplateById(id) {
  const { data } = await api.get(`/templates/${id}`)
  return data
}

export async function updateTemplate(id, payload) {
  const { data } = await api.put(`/templates/${id}`, payload)
  return data
}

export async function deleteTemplate(id) {
  const { data } = await api.delete(`/templates/${id}`)
  return data
}

// ─── auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function registerUser(username, email, password) {
  const { data } = await api.post('/auth/register', { username, email, password })
  return data
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout')
  return data
}

// ─── saved circuits ───────────────────────────────────────────────────────────

export async function saveCircuit(name, circuitMatrix) {
  const { data } = await api.post('/circuits', { name, circuitMatrix })
  return data
}

export async function getMineCircuits(page = 1, limit = 20) {
  const { data } = await api.get('/circuits/mine', { params: { page, limit } })
  return data
}

export async function getCircuitById(id) {
  const { data } = await api.get(`/circuits/${id}`)
  return data
}

export async function updateCircuit(id, payload) {
  const { data } = await api.put(`/circuits/${id}`, payload)
  return data
}

export async function deleteCircuit(id) {
  const { data } = await api.delete(`/circuits/${id}`)
  return data
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}
