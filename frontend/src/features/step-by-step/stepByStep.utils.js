import { STEP_BY_STEP_MODES } from './stepByStep.constants'

/** Extract a gate operation descriptor from a circuit cell, or null if the cell should be skipped. */
function cellToOp(cell, qubit, step) {
  if (!cell) return null

  if (typeof cell === 'object' && cell.gate === 'CNOT') {
    // Emit one operation from ctrl; skip tgt (it will be processed together with ctrl)
    if (cell.role === 'ctrl') {
      return { gate: 'CNOT', qubit, targetQubit: cell.partner, step }
    }
    return null // tgt skipped
  }

  return { gate: cell, qubit, step }
}

export function buildGateQueue(circuit) {
  const queue = []
  const stepCount = circuit?.[0]?.length ?? 0
  const qubitCount = circuit?.length ?? 0

  for (let step = 0; step < stepCount; step++) {
    for (let qubit = 0; qubit < qubitCount; qubit++) {
      const op = cellToOp(circuit?.[qubit]?.[step], qubit, step)
      if (!op) continue

      queue.push({
        mode: STEP_BY_STEP_MODES.GATE_BY_GATE,
        step,
        operations: [op],
      })
    }
  }

  return queue
}

export function buildTimeStepQueue(circuit) {
  const queue = []
  const stepCount = circuit?.[0]?.length ?? 0
  const qubitCount = circuit?.length ?? 0

  for (let step = 0; step < stepCount; step++) {
    const operations = []

    for (let qubit = 0; qubit < qubitCount; qubit++) {
      const op = cellToOp(circuit?.[qubit]?.[step], qubit, step)
      if (op) operations.push(op)
    }

    if (operations.length > 0) {
      queue.push({
        mode: STEP_BY_STEP_MODES.TIME_STEP,
        step,
        operations,
      })
    }
  }

  return queue
}

export function buildQueueByMode(circuit, mode) {
  return mode === STEP_BY_STEP_MODES.TIME_STEP
    ? buildTimeStepQueue(circuit)
    : buildGateQueue(circuit)
}

export function describeQueueUnit(unit) {
  if (!unit) return 'No current step'

  if (unit.mode === STEP_BY_STEP_MODES.TIME_STEP) {
    return `t${unit.step} \u00b7 ${unit.operations.length} gate${unit.operations.length === 1 ? '' : 's'}`
  }

  const op = unit.operations[0]
  if (op.gate === 'CNOT') {
    return `t${op.step} \u00b7 CNOT q[${op.qubit}]\u2192q[${op.targetQubit}]`
  }
  return `t${op.step} \u00b7 ${op.gate} on q[${op.qubit}]`
}
