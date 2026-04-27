import axios from 'axios'

// ─── shared types ─────────────────────────────────────────────────────────────

/**
 * @typedef {{ value: 0|1, superposition: boolean }} QubitState
 */

/**
 * A 2-D circuit matrix: rows = qubits, columns = steps.
 * Each cell is a gate name ('H'|'X'|'M'|'CNOT') or null.
 * @typedef {Array<Array<string|null>>} CircuitMatrix
 */

/**
 * @typedef {{ id: string, username: string, email: string, createdAt: string }} SafeUser
 */

/**
 * @typedef {{ success: boolean, user: SafeUser }} AuthResponse
 */

/**
 * @typedef {{ counts: Record<string,number>, shots: number }} RunResult
 */

/**
 * @typedef {{ qubitStates: QubitState[], measurement: 0|1|null }} ApplyGateResult
 */

/**
 * @typedef {{ _id: string, name: string, circuitMatrix: CircuitMatrix, owner: string, createdAt: string }} SavedCircuit
 */

/**
 * @typedef {{ _id: string, name: string, description: string, circuit: CircuitMatrix, tags: string[], isPublic: boolean, author: { _id: string, username: string } }} Template
 */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
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
 * Run a full circuit simulation for a given number of shots.
 * @param {CircuitMatrix} circuit
 * @param {number} [shots=1024]
 * @returns {Promise<RunResult>}
 */
export async function runCircuit(circuit, shots = 1024) {
  const { data } = await api.post('/circuits/run', { circuit, shots })
  return data
}

/**
 * Apply a single gate to the live qubit state (step-by-step mode).
 * For single-qubit gates pass `qubitIndexOrControl` as the target qubit index.
 * For CNOT pass control index as `qubitIndexOrControl` and target as `targetIndex`.
 * @param {QubitState[]} qubitStates
 * @param {'H'|'X'|'M'|'CNOT'} gate
 * @param {number} qubitIndexOrControl
 * @param {number} [targetIndex]
 * @returns {Promise<ApplyGateResult>}
 */
export async function applyGate(qubitStates, gate, qubitIndexOrControl, targetIndex) {
  const body = gate === 'CNOT'
    ? { qubitStates, gate, controlIndex: qubitIndexOrControl, targetIndex }
    : { qubitStates, gate, qubitIndex: qubitIndexOrControl }
  const { data } = await api.post('/circuits/applyGate', body)
  return data
}

// ─── templates ───────────────────────────────────────────────────────────────

/**
 * @param {{ name: string, description?: string, circuit: CircuitMatrix, tags?: string[], isPublic?: boolean }} payload
 * @returns {Promise<{ success: boolean, template: Template }>}
 */
export async function createTemplate(payload) {
  const { data } = await api.post('/templates', payload)
  return data
}

/** @returns {Promise<{ success: boolean, templates: Template[] }>} */
export async function getMyTemplates() {
  const { data } = await api.get('/templates/mine')
  return data
}

/**
 * @param {string} [tag] - filter by tag
 * @returns {Promise<{ success: boolean, templates: Template[], total: number, page: number, pages: number }>}
 */
export async function getPublicTemplates(tag) {
  const { data } = await api.get('/templates/public', {
    params: tag ? { tag } : undefined,
  })
  return data
}

/**
 * @param {string} id
 * @returns {Promise<{ success: boolean, template: Template }>}
 */
export async function getTemplateById(id) {
  const { data } = await api.get(`/templates/${id}`)
  return data
}

/**
 * @param {string} id
 * @param {Partial<{ name: string, description: string, circuit: CircuitMatrix, tags: string[], isPublic: boolean }>} payload
 * @returns {Promise<{ success: boolean, template: Template }>}
 */
export async function updateTemplate(id, payload) {
  const { data } = await api.put(`/templates/${id}`, payload)
  return data
}

/**
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteTemplate(id) {
  const { data } = await api.delete(`/templates/${id}`)
  return data
}

// ─── auth ─────────────────────────────────────────────────────────────────────

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export async function loginUser(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/**
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export async function registerUser(username, email, password) {
  const { data } = await api.post('/auth/register', { username, email, password })
  return data
}

/** @returns {Promise<{ success: boolean, message: string }>} */
export async function logoutUser() {
  const { data } = await api.post('/auth/logout')
  return data
}

// ─── saved circuits ───────────────────────────────────────────────────────────

/**
 * @param {string} name
 * @param {CircuitMatrix} circuitMatrix
 * @returns {Promise<{ success: boolean, circuit: SavedCircuit }>}
 */
export async function saveCircuit(name, circuitMatrix) {
  const { data } = await api.post('/circuits', { name, circuitMatrix })
  return data
}

/**
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<{ success: boolean, circuits: SavedCircuit[], total: number, page: number, pages: number }>}
 */
export async function getMineCircuits(page = 1, limit = 20) {
  const { data } = await api.get('/circuits/mine', { params: { page, limit } })
  return data
}

/**
 * @param {string} id
 * @returns {Promise<{ success: boolean, circuit: SavedCircuit }>}
 */
export async function getCircuitById(id) {
  const { data } = await api.get(`/circuits/${id}`)
  return data
}

/**
 * @param {string} id
 * @param {Partial<{ name: string, circuitMatrix: CircuitMatrix }>} payload
 * @returns {Promise<{ success: boolean, circuit: SavedCircuit }>}
 */
export async function updateCircuit(id, payload) {
  const { data } = await api.put(`/circuits/${id}`, payload)
  return data
}

/**
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteCircuit(id) {
  const { data } = await api.delete(`/circuits/${id}`)
  return data
}

/** @returns {Promise<{ success: boolean, user: SafeUser }>} */
export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}
