/**
 * Shared circuit validation utilities.
 * Used by circuit.controller.js and Circuit.model.js to avoid duplication.
 */

// NOTE on size limits vs. the frontend:
// The backend intentionally accepts larger circuits than the frontend UI builds:
//   backend : MAX_QUBITS=10, MAX_STEPS=16
//   frontend: NUM_QUBITS=3,  MAX_STEPS=8
// The API must accommodate circuits imported from templates or external tools;
// the frontend limits exist solely for a manageable UX surface.

const VALID_SINGLE_GATES = new Set(['H', 'X', 'M', 'S'])
const MAX_QUBITS         = 10
const MAX_STEPS          = 16

/**
 * Returns true if a cell is a valid CNOT descriptor.
 * @param {unknown} cell
 * @param {number} qubitIdx
 * @param {number} numQubits
 */
export function isValidCnotCell(cell, qubitIdx, numQubits) {
  if (typeof cell !== 'object' || cell === null) return false
  if (cell.gate !== 'CNOT') return false
  if (cell.role !== 'ctrl' && cell.role !== 'tgt') return false
  if (!Number.isInteger(cell.partner)) return false
  if (cell.partner < 0 || cell.partner >= numQubits) return false
  if (cell.partner === qubitIdx) return false
  return true
}

/**
 * Returns true if the circuit matrix is structurally valid.
 * Validates dimensions, gate values, and CNOT pair consistency.
 * @param {unknown} matrix
 */
export function isValidCircuitMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) return false
  if (matrix.length > MAX_QUBITS) return false
  if (!Array.isArray(matrix[0])) return false

  const numQubits = matrix.length
  const stepCount = matrix[0].length
  if (stepCount > MAX_STEPS) return false

  for (let q = 0; q < numQubits; q++) {
    const row = matrix[q]
    if (!Array.isArray(row) || row.length !== stepCount) return false

    for (let s = 0; s < stepCount; s++) {
      const cell = row[s]
      if (cell === null) continue

      if (typeof cell === 'string') {
        if (!VALID_SINGLE_GATES.has(cell)) return false
        continue
      }

      if (typeof cell === 'object') {
        if (!isValidCnotCell(cell, q, numQubits)) return false
        const partner = matrix[cell.partner]?.[s]
        if (!partner || typeof partner !== 'object') return false
        if (partner.gate !== 'CNOT' || partner.partner !== q) return false
        const expectedRole = cell.role === 'ctrl' ? 'tgt' : 'ctrl'
        if (partner.role !== expectedRole) return false
        continue
      }

      return false
    }
  }

  return true
}
