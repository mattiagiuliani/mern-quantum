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

/**
 * Apply CNOT to a mutable (val[], sup[]) state array.
 * If the control qubit is in superposition it collapses first (shot-based model).
 * If val[ctrl] === 1 after collapse, the target qubit is flipped deterministically.
 *
 * @param {number[]}  val       mutable qubit value array
 * @param {boolean[]} sup       mutable superposition flag array
 * @param {number}    ctrlIdx   control qubit index
 * @param {number}    tgtIdx    target qubit index
 */
function applyCNOT(val, sup, ctrlIdx, tgtIdx) {
  // Collapse control if in superposition
  if (sup[ctrlIdx]) {
    val[ctrlIdx] = Math.random() < 0.5 ? 0 : 1
    sup[ctrlIdx] = false
  }
  // Apply NOT to target iff control is |1⟩
  if (val[ctrlIdx] === 1) {
    val[tgtIdx] = 1 - val[tgtIdx]
    sup[tgtIdx] = false
  }
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
    const val      = Array(numQubits).fill(0)
    const sup      = Array(numQubits).fill(false)
    const classical = Array(numQubits).fill(0)

    for (let step = 0; step < numSteps; step++) {
      for (let q = 0; q < numQubits; q++) {
        const cell = circuit[q][step]
        if (!cell) continue

        // CNOT: process only the ctrl cell; skip tgt (handled together with ctrl)
        if (typeof cell === 'object') {
          if (cell.gate === 'CNOT' && cell.role === 'ctrl') {
            applyCNOT(val, sup, q, cell.partner)
          }
          // tgt cells are intentionally skipped here
          continue
        }

        // Single-qubit gate
        const [nv, ns, meas] = applyGateStep(val[q], sup[q], cell)
        val[q] = nv
        sup[q] = ns
        if (meas !== null) classical[q] = meas
      }
    }

    const key = classical.join('')
    counts[key] = (counts[key] ?? 0) + 1
  }

  return { counts, shots }
}
