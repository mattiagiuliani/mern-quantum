/**
 * Apply one single-qubit gate described by (val, sup).
 * Returns [nextVal, nextSup, measurement] where measurement is null unless gate === 'M'.
 *
 * Simplified model invariants:
 * - val stores a deterministic classical value when sup=false
 * - sup=true means the qubit is in superposition and only collapses on measurement
 *
 * Supported gates: 'H' | 'X' | 'M'
 * CNOT is a two-qubit gate handled directly in simulate().
 *
 * @param {0|1}    val   current qubit value
 * @param {boolean} sup  superposition flag
 * @param {string}  gate 'H' | 'X' | 'M'
 * @returns {[0|1, boolean, 0|1|null]}
 */
export function applyGateStep(val, sup, gate) {
  if (gate === 'H') {
    // Toggle superposition (H twice returns to deterministic state).
    return [val, !sup, null]
  }
  if (gate === 'X') {
    // Classical NOT on deterministic states; unchanged distribution in superposition.
    return sup ? [val, true, null] : [1 - val, false, null]
  }
  if (gate === 'M') {
    const v = sup ? (Math.random() < 0.5 ? 0 : 1) : val
    return [v, false, v]
  }
  return [val, sup, null]
}

// ─── Statevector simulation helpers ──────────────────────────────────────────

/**
 * Create initial |0...0⟩ statevector for n qubits.
 * Stored as Float64Array of length 2*2^n: [re_0, im_0, re_1, im_1, ...]
 */
function createStatevector(numQubits) {
  const size = 1 << numQubits // 2^n
  const sv = new Float64Array(2 * size)
  sv[0] = 1.0 // |0⟩ state
  return sv
}

/**
 * Apply Hadamard gate to qubit q: |0⟩ → (|0⟩+|1⟩)/√2, |1⟩ → (|0⟩-|1⟩)/√2
 */
function applyH(sv, n, q) {
  const size = 1 << n
  const step = 1 << (q + 1)
  const sqrtInv2 = 1 / Math.sqrt(2)

  for (let i = 0; i < size; i += step) {
    const j = i + (1 << q)
    const idx_i = 2 * i
    const idx_j = 2 * j
    
    const re0 = sv[idx_i], im0 = sv[idx_i + 1]
    const re1 = sv[idx_j], im1 = sv[idx_j + 1]
    
    sv[idx_i]     = sqrtInv2 * (re0 + re1)
    sv[idx_i + 1] = sqrtInv2 * (im0 + im1)
    sv[idx_j]     = sqrtInv2 * (re0 - re1)
    sv[idx_j + 1] = sqrtInv2 * (im0 - im1)
  }
}

/**
 * Apply Pauli-X gate (NOT): |0⟩ ↔ |1⟩
 */
function applyX(sv, n, q) {
  const size = 1 << n
  const step = 1 << (q + 1)
  
  for (let i = 0; i < size; i += step) {
    const j = i + (1 << q)
    const idx_i = 2 * i
    const idx_j = 2 * j
    
    // Swap amplitude at i with amplitude at j
    let temp = sv[idx_i]
    sv[idx_i] = sv[idx_j]
    sv[idx_j] = temp
    
    temp = sv[idx_i + 1]
    sv[idx_i + 1] = sv[idx_j + 1]
    sv[idx_j + 1] = temp
  }
}

/**
 * Apply CNOT gate: if control=|1⟩ then flip target
 */
function applyCNOT(sv, n, ctrl, tgt) {
  const size = 1 << n
  const ctrlMask = 1 << ctrl
  const tgtMask = 1 << tgt
  
  for (let i = 0; i < size; i++) {
    // Only swap amplitudes when control bit is 1
    if ((i & ctrlMask) !== 0) {
      const j = i ^ tgtMask // flip target bit
      if (i < j) { // avoid double swap
        const idx_i = 2 * i
        const idx_j = 2 * j
        
        let temp = sv[idx_i]
        sv[idx_i] = sv[idx_j]
        sv[idx_j] = temp
        
        temp = sv[idx_i + 1]
        sv[idx_i + 1] = sv[idx_j + 1]
        sv[idx_j + 1] = temp
      }
    }
  }
}

/**
 * Measure qubit q: collapse to |0⟩ or |1⟩ with probability |amplitude|².
 * Modifies statevector in-place, returns measurement result (0 or 1).
 */
function measureQubit(sv, n, q) {
  const size = 1 << n
  const mask = 1 << q
  let prob0 = 0
  
  // Calculate probability of measuring 0
  for (let i = 0; i < size; i++) {
    if ((i & mask) === 0) {
      const idx = 2 * i
      prob0 += sv[idx] * sv[idx] + sv[idx + 1] * sv[idx + 1]
    }
  }
  
  const result = Math.random() < prob0 ? 0 : 1
  const normFactor = 1 / Math.sqrt(result === 0 ? prob0 : (1 - prob0))
  
  // Collapse: zero amplitudes for other outcome, renormalize
  for (let i = 0; i < size; i++) {
    if (((i & mask) === 0) !== (result === 0)) {
      sv[2 * i] = 0
      sv[2 * i + 1] = 0
    } else {
      sv[2 * i] *= normFactor
      sv[2 * i + 1] *= normFactor
    }
  }
  
  return result
}

/**
 * Sample measurement results from statevector: measure all qubits according to |ψ|².
 */
function sampleFromStatevector(sv, n) {
  const size = 1 << n
  let totalProb = 0
  const probs = new Array(size)
  
  // Calculate |amplitude|² for each basis state
  for (let i = 0; i < size; i++) {
    const idx = 2 * i
    probs[i] = sv[idx] * sv[idx] + sv[idx + 1] * sv[idx + 1]
    totalProb += probs[i]
  }
  
  // Normalize and sample
  let rand = Math.random() * totalProb
  for (let i = 0; i < size; i++) {
    rand -= probs[i]
    if (rand <= 0) return i.toString(2).padStart(n, '0')
  }
  
  return (size - 1).toString(2).padStart(n, '0')
}

/**
 * @param {Array<Array<string|{gate:'CNOT',role:'ctrl'|'tgt',partner:number}|null>>} circuit
 * @param {number} shots
 * @returns {{ counts: Object<string,number>, shots: number }}
 */
export function simulate(circuit, shots = 1024) {
  const numQubits = circuit.length
  const numSteps  = circuit[0]?.length ?? 0

  const hasMeasure = circuit.some(row =>
    row.some(g => g === 'M' || (g && typeof g === 'object' && g.gate === 'M')),
  )
  if (!hasMeasure) {
    return { counts: { '(no measure)': shots }, shots }
  }

  const counts = {}

  for (let shot = 0; shot < shots; shot++) {
    const sv = createStatevector(numQubits)
    
    // Execute circuit
    for (let step = 0; step < numSteps; step++) {
      for (let q = 0; q < numQubits; q++) {
        const cell = circuit[q][step]
        if (!cell) continue

        // Gate dispatch
        if (typeof cell === 'string') {
          if (cell === 'H') applyH(sv, numQubits, q)
          else if (cell === 'X') applyX(sv, numQubits, q)
          else if (cell === 'M') measureQubit(sv, numQubits, q)
        } else if (typeof cell === 'object' && cell.gate === 'CNOT' && cell.role === 'ctrl') {
          applyCNOT(sv, numQubits, q, cell.partner)
        }
      }
    }
    
    // Sample final state
    const result = sampleFromStatevector(sv, numQubits)
    counts[result] = (counts[result] ?? 0) + 1
  }

  return { counts, shots }
}
