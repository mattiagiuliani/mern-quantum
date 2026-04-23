import { STEP_BY_STEP_MODES } from './stepByStep.constants'

export function buildGateQueue(circuit) {
  const queue = []
  const stepCount = circuit?.[0]?.length ?? 0
  const qubitCount = circuit?.length ?? 0

  for (let step = 0; step < stepCount; step++) {
    for (let qubit = 0; qubit < qubitCount; qubit++) {
      const gate = circuit?.[qubit]?.[step]
      if (!gate) continue

      queue.push({
        mode: STEP_BY_STEP_MODES.GATE_BY_GATE,
        step,
        operations: [{ gate, qubit, step }],
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
      const gate = circuit?.[qubit]?.[step]
      if (!gate) continue
      operations.push({ gate, qubit, step })
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
    return `t${unit.step} · ${unit.operations.length} gate${unit.operations.length === 1 ? '' : 's'}`
  }

  const op = unit.operations[0]
  return `t${op.step} · ${op.gate} on q[${op.qubit}]`
}
