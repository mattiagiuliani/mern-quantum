import { useCallback } from 'react'

/**
 * Provides findOperationId and handleSelectOperation for the circuit sequence panel.
 * The selected-cell state is owned by useCircuitGates; this hook only adds the logic.
 *
 * @param {{ gateSequence, setSelectedOpId, setFocusedCell, stepByStepQueue, jumpStepByStepToIndex, setIsAutoPlayEnabled }} params
 */
export function useCircuitSelection({
  gateSequence,
  setSelectedOpId,
  setFocusedCell,
  stepByStepQueue,
  jumpStepByStepToIndex,
  setIsAutoPlayEnabled,
}) {
  const findOperationId = useCallback((gate, qubit, step) => {
    const match = [...gateSequence]
      .reverse()
      .find(op => op.gate === gate && op.qubit === qubit && op.step === step)
    return match?.id ?? null
  }, [gateSequence])

  const handleSelectOperation = useCallback((op) => {
    setSelectedOpId(op.id)
    setFocusedCell({ qubit: op.qubit, step: op.step })

    if (!stepByStepQueue.length) return

    const queueIndex = stepByStepQueue.findIndex(unit =>
      unit.operations.some(item =>
        item.gate === op.gate && item.qubit === op.qubit && item.step === op.step,
      ),
    )
    if (queueIndex >= 0) {
      setIsAutoPlayEnabled(false)
      jumpStepByStepToIndex(queueIndex)
    }
  }, [jumpStepByStepToIndex, setFocusedCell, setIsAutoPlayEnabled, setSelectedOpId, stepByStepQueue])

  return { findOperationId, handleSelectOperation }
}
