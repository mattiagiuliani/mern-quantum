/**
 * Apply one gate to a single qubit described by (val, sup).
 * Returns [nextVal, nextSup, measurement] where measurement is null unless gate === 'M'.
 *
 * Simplified model invariants:
 * - val stores a deterministic classical value when sup=false
 * - sup=true means the qubit is in superposition and only collapses on measurement
 *
 * @param {0|1}    val   current qubit value
 * @param {boolean} sup  superposition flag
 * @param {string}  gate 'H' | 'X' | 'M'
 * @param {'v1'|'v2'} [mode] semantics mode, defaults to env (v2 fallback)
 * @returns {[0|1, boolean, 0|1|null]}
 */
const DEFAULT_MODE = 'v2'

function resolveSemanticsMode(mode) {
  if (mode === 'v1' || mode === 'v2') return mode
  const envMode = process.env.QUANTUM_SEMANTICS_MODE
  return envMode === 'v1' || envMode === 'v2' ? envMode : DEFAULT_MODE
}

export function applyGateStep(val, sup, gate, mode) {
  const semanticsMode = resolveSemanticsMode(mode)

  if (gate === 'H') {
    if (semanticsMode === 'v1') {
      // Legacy behavior: H only marks superposition.
      return [val, true, null]
    }
    // v2: toggle superposition in a simple, stable way (H twice returns deterministic).
    return [val, !sup, null]
  }
  if (gate === 'X') {
    if (semanticsMode === 'v1') {
      // Legacy behavior: always flips value, preserving superposition flag.
      return [1 - val, sup, null]
    }
    // v2: classical NOT on deterministic states; unchanged distribution in superposition.
    return sup ? [val, true, null] : [1 - val, false, null]
  }
  if (gate === 'M') {
    const v = sup ? (Math.random() < 0.5 ? 0 : 1) : val
    return [v, false, v]
  }
  return [val, sup, null]
}

/**
 * @param {Array<Array<string|null>>} circuit   circuit[qubit][step]
 * @param {number} shots
 * @param {'v1'|'v2'} [mode]
 * @returns {{ counts: Object<string,number>, shots: number }}
 */
export function simulate(circuit, shots = 1024, mode) {
  const numQubits = circuit.length
  const numSteps  = circuit[0]?.length ?? 0

  const hasMeasure = circuit.some(row => row.some(g => g === 'M'))
  if (!hasMeasure) {
    return { counts: { '(no measure)': shots }, shots }
  }

  const counts = {}

  for (let shot = 0; shot < shots; shot++) {
    const val = Array(numQubits).fill(0)
    const sup = Array(numQubits).fill(false)
    const classical = Array(numQubits).fill(0)

    for (let step = 0; step < numSteps; step++) {
      for (let q = 0; q < numQubits; q++) {
        const gate = circuit[q][step]
        if (!gate) continue
        const [nv, ns, meas] = applyGateStep(val[q], sup[q], gate, mode)
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
