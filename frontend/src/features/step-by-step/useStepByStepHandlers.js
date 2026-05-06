import { useCallback } from 'react'
import { applyGate as apiApplyGate } from '../../api/apiClient'
import { initialLiveState } from '../circuit-builder/circuitBuilder.utils'
import { useAutoPlay } from '../circuit-builder/useAutoPlay'

/**
 * Encapsulates all step-by-step and auto-play handler logic, keeping
 * CircuitBuilderPage focused on layout and hook orchestration.
 *
 * The caller is responsible for owning the `isAutoPlayEnabled`,
 * `setIsAutoPlayEnabled`, `autoPlayDelay`, and `setAutoPlayDelay` state so
 * that sibling hooks (e.g. useCircuitSelection) can also reference
 * `setIsAutoPlayEnabled` without a circular dependency.
 *
 * @param {{
 *   circuit: Array,
 *   liveStateRef: React.MutableRefObject,
 *   setLiveState: Function,
 *   setMeasurementLog: Function,
 *   measureIdRef: React.MutableRefObject,
 *   setFocusedCell: Function,
 *   setSelectedOpId: Function,
 *   startStepByStep: Function,
 *   executeNext: Function,
 *   resetStepByStep: Function,
 *   canNextStepByStep: boolean,
 *   stepByStepStatus: string,
 *   stepByStepTotal: number,
 *   findOperationId: Function,
 *   isAutoPlayEnabled: boolean,
 *   setIsAutoPlayEnabled: Function,
 *   autoPlayDelay: number,
 * }} params
 */
export function useStepByStepHandlers({
  circuit,
  liveStateRef,
  setLiveState,
  setMeasurementLog,
  measureIdRef,
  setFocusedCell,
  setSelectedOpId,
  startStepByStep,
  executeNext,
  resetStepByStep,
  canNextStepByStep,
  stepByStepStatus,
  stepByStepTotal,
  findOperationId,
  isAutoPlayEnabled,
  setIsAutoPlayEnabled,
  autoPlayDelay,
}) {
  const handleStartStepByStep = useCallback(() => {
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setFocusedCell(null)
    setSelectedOpId(null)
    measureIdRef.current = 0
    setIsAutoPlayEnabled(false)
    startStepByStep(circuit)
  }, [circuit, measureIdRef, setFocusedCell, setIsAutoPlayEnabled, setLiveState, setMeasurementLog, setSelectedOpId, startStepByStep])

  const handleNextStepByStep = useCallback(async () => {
    await executeNext(async (unit) => {
      let nextQubitStates = liveStateRef.current
      for (const op of unit.operations) {
        setFocusedCell({ qubit: op.qubit, step: op.step })
        const opId = findOperationId(op.gate, op.qubit, op.step)
        if (opId) setSelectedOpId(opId)
        const { qubitStates, measurement } = op.gate === 'CNOT'
          ? await apiApplyGate(nextQubitStates, 'CNOT', op.qubit, op.targetQubit)
          : await apiApplyGate(nextQubitStates, op.gate, op.qubit)
        nextQubitStates = qubitStates
        setLiveState(nextQubitStates)
        if (measurement !== null) {
          setMeasurementLog(prev => [
            { qubit: op.qubit, value: measurement, id: ++measureIdRef.current },
            ...prev.slice(0, 4),
          ])
        }
      }
    })
  }, [executeNext, findOperationId, liveStateRef, measureIdRef, setFocusedCell, setLiveState, setMeasurementLog, setSelectedOpId])

  const handleResetStepByStep = useCallback(() => {
    setIsAutoPlayEnabled(false)
    resetStepByStep()
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setFocusedCell(null)
    setSelectedOpId(null)
    measureIdRef.current = 0
  }, [measureIdRef, resetStepByStep, setFocusedCell, setIsAutoPlayEnabled, setLiveState, setMeasurementLog, setSelectedOpId])

  const { toggleAutoPlay } = useAutoPlay({
    isAutoPlayEnabled,
    setIsAutoPlayEnabled,
    autoPlayDelay,
    stepByStepStatus,
    canNextStepByStep,
    stepByStepTotal,
    onStart: handleStartStepByStep,
    onNext: handleNextStepByStep,
  })

  return {
    handleStartStepByStep,
    handleNextStepByStep,
    handleResetStepByStep,
    toggleAutoPlay,
  }
}
