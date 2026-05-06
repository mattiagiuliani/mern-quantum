export function cloneCircuit(circuit) {
  return circuit.map((row) => [...row])
}

export function isCircuitEmpty(circuit) {
  return !circuit.some((row) => row.some((gate) => gate !== null))
}

export function parseTags(input) {
  if (!input) return []

  return [...new Set(
    input
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  )]
}

export function buildMiniMeta(circuit) {
  const qubits = circuit.length
  const steps = circuit[0]?.length ?? 0
  const gates = circuit.flat().filter(Boolean).length

  return { qubits, steps, gates }
}
