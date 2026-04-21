import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  withCredentials: true,
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
 * @param {{ value: 0|1, superposition: boolean }[]} qubitStates
 * @param {'H'|'X'|'M'} gate
 * @param {number} qubitIndex
 * @returns {Promise<{ qubitStates: { value: 0|1, superposition: boolean }[], measurement: 0|1|null }>}
 */
export async function applyGate(qubitStates, gate, qubitIndex) {
  const { data } = await api.post('/circuits/applyGate', { qubitStates, gate, qubitIndex })
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

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data
}
