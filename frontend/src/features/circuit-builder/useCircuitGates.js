import { useState, useRef, useCallback, useEffect } from 'react'
import { applyGate as apiApplyGate } from '../../api/apiClient'
import { captureFrontendError } from '../../config/sentry'
import {
  emptyCircuit,
  initialLiveState,
  normalizeTemplateCircuit,
  buildGateSequenceFromCircuit,
} from './circuitBuilder.utils'

/**
 * Owns all circuit editing state: matrix, gate sequence, selected gate, CNOT flow, and selection.
 *
 * @param {{
 *   liveStateRef, setLiveState, setMeasurementLog, measureIdRef,
 *   setAnimatingCells, setIsAutoPlayEnabled,
 *   resetStepByStep, resetMultiRun, pushUndo,
 *   dirtiedRef,  // MutableRefObject<() => void> — called on gate placed/cleared
 *   resetRef,    // MutableRefObject<() => void> — called on full circuit reset
 * }} params
 */
export function useCircuitGates({
  liveStateRef,
  setLiveState,
  setMeasurementLog,
  measureIdRef,
  setAnimatingCells,
  setIsAutoPlayEnabled,
  resetStepByStep,
  resetMultiRun,
  pushUndo,
  dirtiedRef,
  resetRef,
}) {
  const [circuit,      setCircuit]      = useState(emptyCircuit)
  const [gateSequence, setGateSequence] = useState([])
  const [selectedGate, setSelectedGate] = useState(null)
  const [cnotPending,  setCnotPending]  = useState(null)
  const [focusedCell,  setFocusedCell]  = useState(null)
  const [selectedOpId, setSelectedOpId] = useState(null)
  const [lastAddedOpId, setLastAddedOpId] = useState(null)
  const circuitRef    = useRef(circuit)
  const opCounterRef  = useRef(0)
  // Tracks pending animation timeouts so they can be cancelled on unmount.
  const animTimers    = useRef(new Set())

  useEffect(() => { circuitRef.current = circuit }, [circuit])

  useEffect(() => () => animTimers.current.forEach(clearTimeout), [])

  const scheduleAnimCleanup = useCallback((cleanup) => {
    const t = setTimeout(() => {
      cleanup()
      animTimers.current.delete(t)
    }, 400)
    animTimers.current.add(t)
  }, [])

  const applyTemplateCircuit = useCallback((incomingCircuit) => {
    const norm = normalizeTemplateCircuit(incomingCircuit)
    setCircuit(norm)
    setGateSequence(buildGateSequenceFromCircuit(norm))
    setSelectedGate(null)
    setCnotPending(null)
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setIsAutoPlayEnabled(false)
    resetRef.current()
    resetStepByStep()
    resetMultiRun()
  }, [resetMultiRun, resetRef, resetStepByStep, setIsAutoPlayEnabled, setLiveState, setMeasurementLog])

  const clearCircuit = useCallback(() => {
    setCircuit(emptyCircuit())
    setGateSequence([])
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setCnotPending(null)
  }, [])

  const handleGateSelect = useCallback((type) => {
    setCnotPending(null)
    setSelectedGate(prev => prev === type ? null : type)
  }, [])

  const handleGateDeselect = useCallback(() => {
    setCnotPending(null)
    setSelectedGate(null)
  }, [])

  const handleCellClick = useCallback(async (qubitIdx, stepIdx) => {
    if (!selectedGate) return

    // ── CNOT: two-click flow ─────────────────────────────────────────────────
    if (selectedGate === 'CNOT') {
      if (!cnotPending) {
        setCnotPending({ qubit: qubitIdx, step: stepIdx })
        setFocusedCell({ qubit: qubitIdx, step: stepIdx })
        return
      }

      const ctrl = cnotPending

      if (ctrl.qubit === qubitIdx && ctrl.step === stepIdx) return

      // Same qubit or different column → reassign control (CNOT needs different qubit, same step)
      if (ctrl.qubit === qubitIdx || ctrl.step !== stepIdx) {
        setCnotPending({ qubit: qubitIdx, step: stepIdx })
        setFocusedCell({ qubit: qubitIdx, step: stepIdx })
        return
      }

      // Valid target: place the pair
      setCnotPending(null)
      setIsAutoPlayEnabled(false)
      dirtiedRef.current()
      resetStepByStep()

      const ctrlCell = { gate: 'CNOT', role: 'ctrl', partner: qubitIdx }
      const tgtCell  = { gate: 'CNOT', role: 'tgt',  partner: ctrl.qubit }

      setCircuit(prev => {
        const next = prev.map(row => [...row])
        next[ctrl.qubit][ctrl.step] = ctrlCell
        next[qubitIdx][stepIdx]     = tgtCell
        return next
      })

      const opId = `op-${++opCounterRef.current}-cnot-${ctrl.qubit}-${qubitIdx}-${ctrl.step}`
      setGateSequence(prev => [
        ...prev,
        { id: opId, gate: 'CNOT', qubit: ctrl.qubit, targetQubit: qubitIdx, step: ctrl.step },
      ])
      setLastAddedOpId(opId)
      setSelectedOpId(opId)
      setFocusedCell({ qubit: ctrl.qubit, step: ctrl.step })
      pushUndo({ qubitIdx: ctrl.qubit, stepIdx: ctrl.step, gate: 'CNOT', partnerQubit: qubitIdx, opId })

      const ctrlKey = `${ctrl.qubit}-${ctrl.step}`
      const tgtKey  = `${qubitIdx}-${stepIdx}`
      setAnimatingCells(prev => new Set(prev).add(ctrlKey).add(tgtKey))
      scheduleAnimCleanup(() => setAnimatingCells(prev => {
        const s = new Set(prev); s.delete(ctrlKey); s.delete(tgtKey); return s
      }))

      try {
        const { qubitStates } = await apiApplyGate(liveStateRef.current, 'CNOT', ctrl.qubit, qubitIdx)
        setLiveState(qubitStates)
      } catch (err) {
        captureFrontendError(err, { context: 'applyGate CNOT' })
      }
      return
    }

    // ── Single-qubit gates ───────────────────────────────────────────────────
    setIsAutoPlayEnabled(false)
    dirtiedRef.current()
    resetStepByStep()

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      next[qubitIdx][stepIdx] = selectedGate
      return next
    })

    const opId = `op-${++opCounterRef.current}-${selectedGate}-${qubitIdx}-${stepIdx}`
    setGateSequence(prev => [
      ...prev,
      { id: opId, gate: selectedGate, qubit: qubitIdx, step: stepIdx },
    ])
    setLastAddedOpId(opId)
    setSelectedOpId(opId)
    setFocusedCell({ qubit: qubitIdx, step: stepIdx })
    pushUndo({ qubitIdx, stepIdx, gate: selectedGate, opId })

    const key = `${qubitIdx}-${stepIdx}`
    setAnimatingCells(prev => new Set(prev).add(key))
    scheduleAnimCleanup(() => setAnimatingCells(prev => {
      const s = new Set(prev); s.delete(key); return s
    }))

    try {
      const { qubitStates, measurement } = await apiApplyGate(liveStateRef.current, selectedGate, qubitIdx)
      setLiveState(qubitStates)
      if (measurement !== null) {
        setMeasurementLog(prev => [
          { qubit: qubitIdx, value: measurement, id: ++measureIdRef.current },
          ...prev.slice(0, 4),
        ])
      }
    } catch (err) {
      captureFrontendError(err, { context: 'applyGate' })
    }
  }, [
    selectedGate, cnotPending,
    liveStateRef, setLiveState, setMeasurementLog, measureIdRef,
    setAnimatingCells, setIsAutoPlayEnabled, resetStepByStep, pushUndo,
    dirtiedRef, scheduleAnimCleanup,
  ])

  const handleCellClear = useCallback((qubitIdx, stepIdx) => {
    setIsAutoPlayEnabled(false)
    dirtiedRef.current()
    resetStepByStep()
    let removedCell = null
    let partnerIdx  = null

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      removedCell = next[qubitIdx][stepIdx]
      if (removedCell && typeof removedCell === 'object' && removedCell.gate === 'CNOT') {
        partnerIdx = removedCell.partner
        next[partnerIdx][stepIdx] = null
      }
      next[qubitIdx][stepIdx] = null
      return next
    })

    setGateSequence(prev => {
      if (!removedCell) return prev
      const gateKey = typeof removedCell === 'string' ? removedCell : 'CNOT'
      const ctrlQ   = (typeof removedCell === 'object' && removedCell.role === 'tgt') ? partnerIdx : qubitIdx
      const idx = prev
        .map(op => op.gate === gateKey && op.qubit === ctrlQ && op.step === stepIdx)
        .lastIndexOf(true)
      if (idx < 0) return prev
      return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
    })

    setFocusedCell({ qubit: qubitIdx, step: stepIdx })
    setSelectedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
  }, [dirtiedRef, resetStepByStep, setIsAutoPlayEnabled, setLiveState, setMeasurementLog])

  return {
    circuit, setCircuit, circuitRef,
    gateSequence, setGateSequence,
    selectedGate, cnotPending,
    focusedCell, setFocusedCell,
    selectedOpId, setSelectedOpId,
    lastAddedOpId,
    applyTemplateCircuit, clearCircuit,
    handleGateSelect, handleGateDeselect,
    handleCellClick, handleCellClear,
  }
}
