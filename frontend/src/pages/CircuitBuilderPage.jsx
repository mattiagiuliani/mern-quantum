import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { applyGate as apiApplyGate, updateCircuit as apiUpdateCircuit } from '../api/apiClient'
import { useAuth } from '../hooks/useAuth'
import {
  SHOT_PRESETS,
  calculatePercentage,
  useFeatureAMultiRun,
} from '../features/multi-run/index'
import {
  GATES,
  NUM_QUBITS,
  MAX_STEPS,
  BUILDER_BUTTON_STYLE_TOKENS,
  buildShotPresetStyle,
  buildRunButtonStyle,
  emptyCircuit,
  initialLiveState,
  normalizeTemplateCircuit,
  buildGateSequenceFromCircuit,
  BUILDER_PAGE_STYLES,
  useKeyboardShortcuts,
  useUndoStack,
  GatePaletteButton,
  InfoTooltip,
  QubitWire,
  LiveStatePanel,
  QasmPreview,
  CircuitSequencePanel,
} from '../features/circuit-builder/index'
import { useSaveCircuit } from '../features/circuit-builder/useSaveCircuit'
import { SaveModal } from '../features/circuit-builder/components/SaveModal'
import {
  STEP_BY_STEP_STATUS,
  useFeatureDStepByStep,
  StepByStepControls,
} from '../features/step-by-step/index'

export default function CircuitBuilderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [circuit,        setCircuit]        = useState(emptyCircuit)
  const [gateSequence,   setGateSequence]   = useState([])
  const [selectedGate,   setSelectedGate]   = useState(null)
  const [cnotPending,    setCnotPending]    = useState(null) // { qubit, step } — ctrl awaiting tgt click
  const [focusedCell,    setFocusedCell]    = useState(null)
  const [selectedOpId,   setSelectedOpId]   = useState(null)
  const [lastAddedOpId,  setLastAddedOpId]  = useState(null)
  const [liveState,      setLiveState]      = useState(initialLiveState)
  const [animatingCells, setAnimatingCells] = useState(() => new Set())
  const [measurementLog, setMeasurementLog] = useState([])

  const {
    selectedShots,
    setSelectedShots,
    lastExecutedShots,
    runStatus,
    results,
    runCircuitWithSelectedShots,
    resetMultiRun,
  } = useFeatureAMultiRun()

  const liveStateRef       = useRef(liveState)
  const circuitRef         = useRef(circuit)
  const measureIdRef       = useRef(0)
  const appliedTemplateRef = useRef(null)
  const { pushUndo, popUndo } = useUndoStack()
  const {
    mode: stepByStepMode,
    setMode: setStepByStepMode,
    status: stepByStepStatus,
    queue: stepByStepQueue,
    currentIndex: stepByStepIndex,
    totalUnits: stepByStepTotal,
    currentUnit: stepByStepUnit,
    percent: stepByStepPercent,
    canStart: canStartStepByStep,
    canNext: canNextStepByStep,
    startStepByStep,
    executeNext,
    jumpToIndex: jumpStepByStepToIndex,
    resetStepByStep,
  } = useFeatureDStepByStep()
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(false)
  const [autoPlayDelay, setAutoPlayDelay] = useState(700)

  const {
    saveStatus,
    savedCircuitName,
    setSavedCircuitName,
    savedCircuitId,
    setSavedCircuitId,
    saveModalOpen,
    saveNameDraft,
    setSaveNameDraft,
    openSaveModal,
    closeSaveModal,
    handleSaveConfirm,
  } = useSaveCircuit({ circuit, user, results, stepByStepStatus, liveStateRef })

  useEffect(() => { liveStateRef.current = liveState }, [liveState])
  useEffect(() => { circuitRef.current = circuit }, [circuit])

  // --- template application --------------------------------------------------

  const applyTemplateCircuit = useCallback((incomingCircuit) => {
    const normalizedCircuit = normalizeTemplateCircuit(incomingCircuit)
    setCircuit(normalizedCircuit)
    setGateSequence(buildGateSequenceFromCircuit(normalizedCircuit))
    setSelectedGate(null)
    setCnotPending(null)
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setIsAutoPlayEnabled(false)
    setSavedCircuitId(null)
    setSavedCircuitName('')
    resetStepByStep()
    resetMultiRun()
  }, [resetMultiRun, resetStepByStep])

  useEffect(() => {
    const template = location.state?.templateToApply
    if (!template?.circuit) return

    const templateKey = template._id ?? template.id ?? JSON.stringify(template.circuit)
    if (appliedTemplateRef.current === templateKey) return

    const hasCurrentCircuit = circuitRef.current.some(row => row.some(gate => gate !== null))
    const confirmed = !hasCurrentCircuit || window.confirm('Replace current circuit with selected template? Unsaved edits will be lost.')

    if (confirmed) {
      queueMicrotask(() => { applyTemplateCircuit(template.circuit) })
    }

    appliedTemplateRef.current = templateKey
    navigate('/circuit-builder', { replace: true, state: null })
  }, [applyTemplateCircuit, location.state, navigate])

  // load saved circuit from dashboard
  useEffect(() => {
    const saved = location.state?.savedCircuitToLoad
    if (!saved?.circuitMatrix) return

    const savedKey = saved._id ?? JSON.stringify(saved.circuitMatrix)
    if (appliedTemplateRef.current === savedKey) return

    const hasCurrentCircuit = circuitRef.current.some(row => row.some(gate => gate !== null))
    const confirmed = !hasCurrentCircuit || window.confirm('Replace current circuit with saved circuit? Unsaved edits will be lost.')

    if (confirmed) {
      queueMicrotask(() => {
        applyTemplateCircuit(saved.circuitMatrix)
        setSavedCircuitName(saved.name ?? '')
        setSavedCircuitId(saved._id ?? null)
      })
    }

    appliedTemplateRef.current = savedKey
    navigate('/circuit-builder', { replace: true, state: null })
  }, [applyTemplateCircuit, location.state, navigate])

  // --- handlers --------------------------------------------------------------

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

    // ── CNOT: two-click flow ──────────────────────────────────────────────────
    if (selectedGate === 'CNOT') {
      if (!cnotPending) {
        // First click: register this cell as the pending control
        setCnotPending({ qubit: qubitIdx, step: stepIdx })
        setFocusedCell({ qubit: qubitIdx, step: stepIdx })
        return
      }

      const ctrl = cnotPending

      // Same cell clicked again → no-op, keep waiting for the target
      if (ctrl.qubit === qubitIdx && ctrl.step === stepIdx) {
        return
      }

      // Different cell but same qubit, or different column → reassign ctrl
      // (user changed their mind about which cell is the control)
      if (ctrl.qubit === qubitIdx || ctrl.step !== stepIdx) {
        setCnotPending({ qubit: qubitIdx, step: stepIdx })
        setFocusedCell({ qubit: qubitIdx, step: stepIdx })
        return
      }

      // Second click on a different qubit in the same column: place the pair
      setCnotPending(null)
      setIsAutoPlayEnabled(false)
      setSavedCircuitId(null)
      resetStepByStep()

      const ctrlCell = { gate: 'CNOT', role: 'ctrl', partner: qubitIdx }
      const tgtCell  = { gate: 'CNOT', role: 'tgt',  partner: ctrl.qubit }

      setCircuit(prev => {
        const next = prev.map(row => [...row])
        next[ctrl.qubit][ctrl.step] = ctrlCell
        next[qubitIdx][stepIdx]     = tgtCell
        return next
      })

      const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}-cnot-${ctrl.qubit}-${qubitIdx}-${ctrl.step}`
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
      setTimeout(() => setAnimatingCells(prev => {
        const s = new Set(prev); s.delete(ctrlKey); s.delete(tgtKey); return s
      }), 400)

      try {
        const { qubitStates } = await apiApplyGate(liveStateRef.current, 'CNOT', ctrl.qubit, qubitIdx)
        setLiveState(qubitStates)
      } catch (err) {
        console.error('[applyGate CNOT]', err)
      }
      return
    }

    // ── Single-qubit gates ────────────────────────────────────────────────────
    setIsAutoPlayEnabled(false)
    setSavedCircuitId(null)
    resetStepByStep()

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      next[qubitIdx][stepIdx] = selectedGate
      return next
    })

    const opId = `${Date.now()}-${Math.random().toString(16).slice(2)}-${qubitIdx}-${stepIdx}-${selectedGate}`
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
    setTimeout(() => setAnimatingCells(prev => {
      const s = new Set(prev); s.delete(key); return s
    }), 400)

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
      console.error('[applyGate]', err)
    }
  }, [selectedGate, cnotPending, pushUndo, resetStepByStep])

  const handleCellClear = useCallback((qubitIdx, stepIdx) => {
    setIsAutoPlayEnabled(false)
    setSavedCircuitId(null)
    resetStepByStep()
    let removedCell = null
    let partnerIdx  = null

    setCircuit(prev => {
      const next = prev.map(row => [...row])
      removedCell = next[qubitIdx][stepIdx]

      // If clearing a CNOT cell, also clear its partner
      if (removedCell && typeof removedCell === 'object' && removedCell.gate === 'CNOT') {
        partnerIdx = removedCell.partner
        next[partnerIdx][stepIdx] = null
      }

      next[qubitIdx][stepIdx] = null
      return next
    })

    // Remove the matching gate-sequence operation
    setGateSequence(prev => {
      if (!removedCell) return prev
      const isString = typeof removedCell === 'string'
      const gateKey  = isString ? removedCell : 'CNOT'
      const ctrlQ    = (typeof removedCell === 'object' && removedCell.role === 'tgt')
        ? partnerIdx  // op is stored with ctrl qubit
        : qubitIdx
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
  }, [resetStepByStep])

  const handleUndo = useCallback(() => {
    const entry = popUndo()
    if (!entry) return
    handleCellClear(entry.qubitIdx, entry.stepIdx)
  }, [popUndo, handleCellClear])

  const handleClear = () => {
    setCircuit(emptyCircuit())
    setGateSequence([])
    setFocusedCell(null)
    setSelectedOpId(null)
    setLastAddedOpId(null)
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setIsAutoPlayEnabled(false)
    setSavedCircuitId(null)
    setSavedCircuitName('')
    setCnotPending(null)
    resetStepByStep()
    resetMultiRun()
  }

  const findOperationId = useCallback((gate, qubit, step) => {
    const match = [...gateSequence]
      .reverse()
      .find((op) => op.gate === gate && op.qubit === qubit && op.step === step)
    return match?.id ?? null
  }, [gateSequence])

  const handleStartStepByStep = useCallback(() => {
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setFocusedCell(null)
    setSelectedOpId(null)
    measureIdRef.current = 0
    setIsAutoPlayEnabled(false)
    startStepByStep(circuit)
  }, [circuit, startStepByStep])

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
          setMeasurementLog((prev) => [
            { qubit: op.qubit, value: measurement, id: ++measureIdRef.current },
            ...prev.slice(0, 4),
          ])
        }
      }
    })
  }, [executeNext, findOperationId])

  const handleResetStepByStep = useCallback(() => {
    setIsAutoPlayEnabled(false)
    resetStepByStep()
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setFocusedCell(null)
    setSelectedOpId(null)
    measureIdRef.current = 0
  }, [resetStepByStep])

  useEffect(() => {
    if (!isAutoPlayEnabled) return
    if (stepByStepStatus === STEP_BY_STEP_STATUS.COMPLETED || !canNextStepByStep) {
      setIsAutoPlayEnabled(false)
      return
    }
    if (stepByStepStatus !== STEP_BY_STEP_STATUS.READY) return

    const timerId = window.setTimeout(() => {
      handleNextStepByStep()
    }, autoPlayDelay)

    return () => window.clearTimeout(timerId)
  }, [
    autoPlayDelay,
    canNextStepByStep,
    handleNextStepByStep,
    isAutoPlayEnabled,
    stepByStepStatus,
  ])

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlayEnabled) {
      setIsAutoPlayEnabled(false)
      return
    }

    if (stepByStepStatus === STEP_BY_STEP_STATUS.IDLE || stepByStepTotal === 0) {
      handleStartStepByStep()
    }

    setIsAutoPlayEnabled(true)
  }, [handleStartStepByStep, isAutoPlayEnabled, stepByStepStatus, stepByStepTotal])

  const handleSelectOperation = useCallback((op) => {
    setSelectedOpId(op.id)
    setFocusedCell({ qubit: op.qubit, step: op.step })

    if (!stepByStepQueue.length) return

    const queueIndex = stepByStepQueue.findIndex((unit) =>
      unit.operations.some((item) => item.gate === op.gate && item.qubit === op.qubit && item.step === op.step),
    )

    if (queueIndex >= 0) {
      setIsAutoPlayEnabled(false)
      jumpStepByStepToIndex(queueIndex)
    }
  }, [jumpStepByStepToIndex, stepByStepQueue])

  const handleRun = async () => {
    await runCircuitWithSelectedShots(circuit)
  }

  const openTemplatesLibrary = () => {
    navigate('/templates', {
      state: { circuitDraft: circuit.map((row) => [...row]) },
    })
  }

  // --- keyboard shortcuts ---------------------------------------------------

  useKeyboardShortcuts({
    onSelectGate: handleGateSelect,
    onDeselect:   handleGateDeselect,
    onUndo:       handleUndo,
  })

  // --- derived ---------------------------------------------------------------

  // Count CNOT ctrl cells as 1 gate each; skip tgt cells (they are part of the same gate)
  const totalGates = circuit.flat().filter(c => {
    if (!c) return false
    if (typeof c === 'object') return c.gate === 'CNOT' && c.role === 'ctrl'
    return true
  }).length
  const hasGates   = totalGates > 0
  const isGuidedMidSession = stepByStepStatus === STEP_BY_STEP_STATUS.READY || stepByStepStatus === STEP_BY_STEP_STATUS.RUNNING
  const isGuidedBusy = isGuidedMidSession || isAutoPlayEnabled

  // --- render ----------------------------------------------------------------

  return (
    <>
      <style>{BUILDER_PAGE_STYLES}</style>

      <div style={{
        background: 'radial-gradient(circle at top right, rgba(110,231,208,0.06), transparent 40%), #080C14',
        minHeight: '100vh',
        color: '#F1EDE4',
        fontFamily: "'Space Mono', monospace",
        padding: '80px 24px 32px',
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 6 }}>
                mern-quantum · Circuit Builder
              </div>
              <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: '#F1EDE4', letterSpacing: '-0.02em' }}>
                Build Your Circuit
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {hasGates && (
                <div style={{
                  fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase', padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                }}>
                  {totalGates} gate{totalGates !== 1 ? 's' : ''}
                </div>
              )}
              {gateSequence.length > 0 && (
                <div style={{
                  fontSize: 10, letterSpacing: '0.1em', color: 'rgba(110,231,208,0.7)',
                  textTransform: 'uppercase', padding: '6px 12px',
                  border: '1px solid rgba(110,231,208,0.25)', borderRadius: 6,
                }}>
                  {gateSequence.length} {gateSequence.length === 1 ? 'operation' : 'operations'}
                </div>
              )}
              <Button
                onClick={openTemplatesLibrary}
                variant="outline-info"
                style={{ ...BUILDER_BUTTON_STYLE_TOKENS.headerBase, ...BUILDER_BUTTON_STYLE_TOKENS.headerTemplates }}
              >
                Templates
              </Button>
              {hasGates && (
                <Button
                  onClick={openSaveModal}
                  disabled={saveStatus === 'saving'}
                  variant="outline-success"
                  style={{
                    ...BUILDER_BUTTON_STYLE_TOKENS.headerBase,
                    color: saveStatus === 'saved' ? '#6EE7D0' : saveStatus === 'error' ? '#FCA5A5' : 'rgba(110,231,208,0.85)',
                    borderColor: saveStatus === 'saved' ? 'rgba(110,231,208,0.5)' : saveStatus === 'error' ? 'rgba(252,165,165,0.4)' : 'rgba(110,231,208,0.3)',
                  }}
                >
                  {saveStatus === 'saving' ? <Spinner size="sm" animation="border" /> : saveStatus === 'saved' ? 'Saved ✓' : saveStatus === 'error' ? 'Save failed' : 'Save'}
                </Button>
              )}
              <Button
                onClick={handleClear}
                variant="outline-secondary"
                style={{ ...BUILDER_BUTTON_STYLE_TOKENS.headerBase, ...BUILDER_BUTTON_STYLE_TOKENS.headerReset }}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* two-column layout */}
          <div className="builder-layout">

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* gate palette */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 22px',
              }}>
                <div style={{
                  fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', marginBottom: 14,
                }}>
                  Step 1 · Pick a gate
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  {Object.keys(GATES).map(type => (
                    <GatePaletteButton
                      key={type}
                      type={type}
                      selected={selectedGate === type}
                      onClick={handleGateSelect}
                    />
                  ))}
                </div>
                <InfoTooltip gate={selectedGate} />
              </div>

              <div style={{
                background: 'rgba(110,231,208,0.06)',
                border: '1px solid rgba(110,231,208,0.24)',
                borderRadius: 14,
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(110,231,208,0.9)',
                  marginBottom: 8,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  Quick start
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.72)',
                }}>
                  <span>1. Choose a gate from the palette.</span>
                  <span>2. Click cells on the wires to place gates.</span>
                  <span>3. Pick shots and run the simulation.</span>
                </div>
              </div>

              {/* circuit canvas */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '22px 24px',
                overflowX: 'auto',
              }}>
                <div style={{
                  fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', marginBottom: 18,
                }}>
                  Step 2 · Place gates on the circuit ({NUM_QUBITS} qubits · {MAX_STEPS} time slots)
                </div>

                {/* step indices */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, paddingLeft: 80 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Array.from({ length: MAX_STEPS }, (_, i) => (
                      <div key={i} style={{
                        width: 44, textAlign: 'center',
                        fontSize: 9, color: 'rgba(255,255,255,0.18)',
                        letterSpacing: '0.05em',
                      }}>
                        t{i}
                      </div>
                    ))}
                  </div>
                </div>

                {/* qubit wires */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {circuit.map((row, qi) => (
                    <QubitWire
                      key={qi}
                      qubitIndex={qi}
                      steps={row}
                      selectedGate={selectedGate}
                      onCellClick={handleCellClick}
                      onCellClear={handleCellClear}
                      animatingCells={animatingCells}
                      liveQ={liveState[qi]}
                      focusedCell={focusedCell}
                      cnotPending={cnotPending}
                    />
                  ))}
                </div>

                {/* step activity bar */}
                <div style={{ marginTop: 14, paddingLeft: 80, display: 'flex', gap: 6 }}>
                  {Array.from({ length: MAX_STEPS }, (_, i) => {
                    const active = circuit.some(row => row[i] !== null)
                    return (
                      <div key={i} style={{
                        width: 44, height: 3, borderRadius: 2,
                        background: active ? 'rgba(110,231,208,0.3)' : 'rgba(255,255,255,0.04)',
                        transition: 'background 0.3s',
                      }} />
                    )
                  })}
                </div>
              </div>

              {/* circuit sequence panel */}
              <CircuitSequencePanel
                gateSequence={gateSequence}
                selectedOperationId={selectedOpId}
                lastAddedOperationId={lastAddedOpId}
                onSelectOperation={handleSelectOperation}
              />

              {/* QASM preview */}
              <QasmPreview circuit={circuit} />

            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>

              {/* live state + measurements */}
              <LiveStatePanel liveState={liveState} measurementLog={measurementLog} />

              {/* shots + run */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
              }} data-testid="builder-run-panel">
                <div style={{
                  fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase',
              }}>
                  Step 3 · Run simulation
                </div>
                <div style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  Choose how many runs to execute, then press run.
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SHOT_PRESETS.map((preset) => {
                    const isActive = selectedShots === preset
                    return (
                      <Button
                        key={preset}
                        data-testid={`shot-preset-${preset}`}
                        disabled={runStatus === 'running' || isGuidedBusy}
                        onClick={() => setSelectedShots(preset)}
                        variant={isActive ? 'outline-info' : 'outline-secondary'}
                        style={buildShotPresetStyle(isActive, runStatus === 'running')}
                      >
                        {preset}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  data-testid="builder-run-button"
                  className="run-btn"
                  disabled={!hasGates || runStatus === 'running' || isGuidedBusy}
                  onClick={handleRun}
                  variant="outline-info"
                  style={buildRunButtonStyle(hasGates)}
                >
                  {runStatus === 'running' ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Running simulation...
                    </>
                  ) : ('Run simulation (' + selectedShots + ' shots)')}
                </Button>

                {runStatus === 'done' && (
                  <div style={{
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#6EE7D0', textAlign: 'center', animation: 'pulse 2s ease-in-out infinite',
                  }}>
                    Simulation complete
                  </div>
                )}
                {runStatus === 'error' && (
                  <div style={{
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#FCA5A5', textAlign: 'center',
                  }}>
                    Could not run simulation
                  </div>
                )}

                <StepByStepControls
                  mode={stepByStepMode}
                  onModeChange={setStepByStepMode}
                  status={stepByStepStatus}
                  totalUnits={stepByStepTotal}
                  currentIndex={stepByStepIndex}
                  currentUnit={stepByStepUnit}
                  percent={stepByStepPercent}
                  canStart={canStartStepByStep && hasGates}
                  canNext={canNextStepByStep}
                  onStart={handleStartStepByStep}
                  onNext={handleNextStepByStep}
                  onReset={handleResetStepByStep}
                  disabled={runStatus === 'running'}
                  autoPlayEnabled={isAutoPlayEnabled}
                  onToggleAutoPlay={toggleAutoPlay}
                  autoPlayDelay={autoPlayDelay}
                  onChangeAutoPlayDelay={setAutoPlayDelay}
                />
              </div>

              {/* shot results */}
              {results && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(110,231,208,0.2)',
                  borderRadius: 14, padding: '20px',
                  animation: 'fadeIn 0.5s ease both',
                }}>
                  <div style={{
                    fontSize: 10, letterSpacing: '0.15em', color: '#6EE7D0',
                    textTransform: 'uppercase', marginBottom: 16,
                  }}>
                    {'Results · ' + lastExecutedShots + ' shots'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Object.entries(results)
                      .sort((a, b) => b[1] - a[1])
                      .map(([state, count]) => {
                        const pct = calculatePercentage(count, lastExecutedShots)
                        return (
                          <div key={state}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{
                                fontFamily: "'Space Mono', monospace",
                                fontSize: 12, fontWeight: 700, color: '#6EE7D0',
                              }}>
                                {'|' + state + String.fromCharCode(0x27E9)}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{pct}%</span>
                                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{count}</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: pct + '%',
                                background: 'linear-gradient(90deg, rgba(110,231,208,0.7), rgba(110,231,208,0.35))',
                                borderRadius: 3,
                                animation: 'barGrow 0.6s ease both',
                              }} />
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  <div style={{
                    marginTop: 14, paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{
                      fontSize: 9, letterSpacing: '0.08em',
                      color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
                    }}>
                      Local sim / api/circuits/run
                    </div>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => navigate('/results', {
                        state: {
                          results,
                          shots: lastExecutedShots,
                          circuitName: savedCircuitName || 'Circuit',
                          circuitMatrix: circuit,
                        },
                      })}
                      style={{ fontSize: 10, letterSpacing: '0.05em', padding: '3px 10px' }}
                    >
                      View Full Results
                    </Button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Save Circuit Modal ── */}
      <SaveModal
        open={saveModalOpen}
        draft={saveNameDraft}
        onDraftChange={setSaveNameDraft}
        onClose={closeSaveModal}
        onConfirm={handleSaveConfirm}
      />
    </>
  )
}
