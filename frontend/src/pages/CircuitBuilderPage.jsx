import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { SHOT_PRESETS, useFeatureAMultiRun } from '../features/multi-run/index'
import {
  GATES, buildShotPresetStyle, buildRunButtonStyle,
  BUILDER_PAGE_STYLES, useKeyboardShortcuts, useUndoStack,
  GatePaletteButton, InfoTooltip, LiveStatePanel, QasmPreview, CircuitSequencePanel,
  useLiveState, useCircuitGates, useCircuitSelection, useTemplateLoader,
  CircuitBuilderHeader, CircuitCanvas, ResultsPanel,
} from '../features/circuit-builder/index'
import { useSaveCircuit } from '../features/circuit-builder/useSaveCircuit'
import { SaveModal } from '../features/circuit-builder/components/SaveModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { STEP_BY_STEP_STATUS, useFeatureDStepByStep, useStepByStepHandlers, StepByStepControls } from '../features/step-by-step/index'
import { initialLiveState } from '../features/circuit-builder/circuitBuilder.utils'

export default function CircuitBuilderPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pushUndo, popUndo } = useUndoStack()

  const {
    liveState, setLiveState, liveStateRef,
    animatingCells, setAnimatingCells,
    measurementLog, setMeasurementLog, measureIdRef,
  } = useLiveState()

  const { selectedShots, setSelectedShots, lastExecutedShots, runStatus, results, runCircuitWithSelectedShots, resetMultiRun } = useFeatureAMultiRun()

  const {
    mode: stepByStepMode, setMode: setStepByStepMode,
    status: stepByStepStatus, queue: stepByStepQueue,
    currentIndex: stepByStepIndex, totalUnits: stepByStepTotal,
    currentUnit: stepByStepUnit, percent: stepByStepPercent,
    canStart: canStartStepByStep, canNext: canNextStepByStep,
    startStepByStep, executeNext, jumpToIndex: jumpStepByStepToIndex, resetStepByStep,
  } = useFeatureDStepByStep()

  // Owned here so sibling hooks (useCircuitSelection) can also reference them
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(false)
  const [autoPlayDelay, setAutoPlayDelay] = useState(700)

  // Stable refs populated after useSaveCircuit — let useCircuitGates call them without circular deps
  const dirtiedRef = useRef(() => {})
  const resetRef   = useRef(() => {})
  const appliedRef = useRef(null)

  const {
    circuit, circuitRef, gateSequence,
    selectedGate, cnotPending,
    focusedCell, setFocusedCell,
    selectedOpId, setSelectedOpId, lastAddedOpId,
    applyTemplateCircuit, clearCircuit,
    handleGateSelect, handleGateDeselect, handleCellClick, handleCellClear,
  } = useCircuitGates({
    liveStateRef, setLiveState, setMeasurementLog, measureIdRef,
    setAnimatingCells, setIsAutoPlayEnabled, resetStepByStep, resetMultiRun, pushUndo,
    dirtiedRef, resetRef,
  })

  const {
    saveStatus, savedCircuitName, setSavedCircuitName,
    setSavedCircuitId,
    saveModalOpen, saveNameDraft, setSaveNameDraft,
    openSaveModal, closeSaveModal, handleSaveConfirm,
  } = useSaveCircuit({ circuit, user, results, stepByStepStatus, liveStateRef })

  // Wire deferred callbacks once setters are stable (setState fns never change identity)
  useEffect(() => {
    dirtiedRef.current = () => setSavedCircuitId(null)
    resetRef.current   = () => { setSavedCircuitId(null); setSavedCircuitName('') }
  }, [setSavedCircuitId, setSavedCircuitName])

  const { findOperationId, handleSelectOperation } = useCircuitSelection({
    gateSequence, setSelectedOpId, setFocusedCell,
    stepByStepQueue, jumpStepByStepToIndex, setIsAutoPlayEnabled,
  })

  const { handleStartStepByStep, handleNextStepByStep, handleResetStepByStep, toggleAutoPlay } =
    useStepByStepHandlers({
      circuit,
      liveStateRef, setLiveState, setMeasurementLog, measureIdRef,
      setFocusedCell, setSelectedOpId,
      startStepByStep, executeNext, resetStepByStep,
      canNextStepByStep, stepByStepStatus, stepByStepTotal,
      findOperationId,
      isAutoPlayEnabled, setIsAutoPlayEnabled, autoPlayDelay,
    })

  const { pendingLoad, confirmLoad, cancelLoad } = useTemplateLoader({ circuitRef, appliedRef, applyTemplateCircuit, setSavedCircuitId, setSavedCircuitName })

  const handleUndo = useCallback(() => {
    const entry = popUndo()
    if (entry) handleCellClear(entry.qubitIdx, entry.stepIdx)
  }, [handleCellClear, popUndo])

  const handleClear = () => {
    clearCircuit()
    setLiveState(initialLiveState())
    setMeasurementLog([])
    setIsAutoPlayEnabled(false)
    setSavedCircuitId(null)
    setSavedCircuitName('')
    resetStepByStep()
    resetMultiRun()
  }

  useKeyboardShortcuts({ onSelectGate: handleGateSelect, onDeselect: handleGateDeselect, onUndo: handleUndo })

  const totalGates = circuit.flat().filter(c => c && (typeof c === 'string' || (c.gate === 'CNOT' && c.role === 'ctrl'))).length
  const hasGates   = totalGates > 0
  const isGuidedBusy = stepByStepStatus === STEP_BY_STEP_STATUS.READY || stepByStepStatus === STEP_BY_STEP_STATUS.RUNNING || isAutoPlayEnabled

  return (
    <>
      <style>{BUILDER_PAGE_STYLES}</style>
      <div style={{ background: 'radial-gradient(circle at top right, rgba(110,231,208,0.06), transparent 40%), #080C14', minHeight: '100vh', color: '#F1EDE4', fontFamily: "'Space Mono', monospace", padding: '80px 24px 32px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <CircuitBuilderHeader
            hasGates={hasGates} totalGates={totalGates} operationCount={gateSequence.length}
            saveStatus={saveStatus} onSave={openSaveModal} onReset={handleClear}
            onTemplates={() => navigate('/templates', { state: { circuitDraft: circuit.map(row => [...row]) } })}
          />

          <div className="builder-layout">

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 22px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 14 }}>Step 1 · Pick a gate</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  {Object.keys(GATES).map(type => (
                    <GatePaletteButton key={type} type={type} selected={selectedGate === type} onClick={handleGateSelect} />
                  ))}
                </div>
                <InfoTooltip gate={selectedGate} />
              </div>

              <div style={{ background: 'rgba(110,231,208,0.06)', border: '1px solid rgba(110,231,208,0.24)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(110,231,208,0.9)', marginBottom: 8 }}>Quick start</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>
                  <span>1. Choose a gate from the palette.</span>
                  <span>2. Click cells on the wires to place gates.</span>
                  <span>3. Pick shots and run the simulation.</span>
                </div>
              </div>

              <CircuitCanvas
                circuit={circuit} selectedGate={selectedGate}
                onCellClick={handleCellClick} onCellClear={handleCellClear}
                animatingCells={animatingCells} liveState={liveState}
                focusedCell={focusedCell} cnotPending={cnotPending}
              />

              <CircuitSequencePanel
                gateSequence={gateSequence} selectedOperationId={selectedOpId}
                lastAddedOperationId={lastAddedOpId} onSelectOperation={handleSelectOperation}
              />

              <QasmPreview circuit={circuit} />
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 24 }}>
              <LiveStatePanel liveState={liveState} measurementLog={measurementLog} />

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="builder-run-panel">
                <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>Step 3 · Run simulation</div>
                <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Choose how many runs to execute, then press run.</div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SHOT_PRESETS.map(preset => (
                    <Button key={preset} data-testid={`shot-preset-${preset}`}
                      disabled={runStatus === 'running' || isGuidedBusy}
                      onClick={() => setSelectedShots(preset)}
                      variant={selectedShots === preset ? 'outline-info' : 'outline-secondary'}
                      style={buildShotPresetStyle(selectedShots === preset, runStatus === 'running')}>
                      {preset}
                    </Button>
                  ))}
                </div>

                <Button data-testid="builder-run-button" className="run-btn"
                  disabled={!hasGates || runStatus === 'running' || isGuidedBusy}
                  onClick={() => runCircuitWithSelectedShots(circuit)}
                  variant="outline-info" style={buildRunButtonStyle(hasGates)}>
                  {runStatus === 'running'
                    ? <><Spinner size="sm" animation="border" />Running simulation...</>
                    : `Run simulation (${selectedShots} shots)`}
                </Button>

                {runStatus === 'done'  && <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6EE7D0', textAlign: 'center', animation: 'pulse 2s ease-in-out infinite' }}>Simulation complete</div>}
                {runStatus === 'error' && <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FCA5A5', textAlign: 'center' }}>Could not run simulation</div>}

                <StepByStepControls
                  mode={stepByStepMode} onModeChange={setStepByStepMode}
                  status={stepByStepStatus} totalUnits={stepByStepTotal}
                  currentIndex={stepByStepIndex} currentUnit={stepByStepUnit} percent={stepByStepPercent}
                  canStart={canStartStepByStep && hasGates} canNext={canNextStepByStep}
                  onStart={handleStartStepByStep} onNext={handleNextStepByStep} onReset={handleResetStepByStep}
                  disabled={runStatus === 'running'}
                  autoPlayEnabled={isAutoPlayEnabled} onToggleAutoPlay={toggleAutoPlay}
                  autoPlayDelay={autoPlayDelay} onChangeAutoPlayDelay={setAutoPlayDelay}
                />
              </div>

              {results && (
                <ResultsPanel
                  results={results} lastExecutedShots={lastExecutedShots}
                  savedCircuitName={savedCircuitName} circuit={circuit}
                  onViewFull={(state) => navigate('/results', { state })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SaveModal open={saveModalOpen} draft={saveNameDraft} onDraftChange={setSaveNameDraft} onClose={closeSaveModal} onConfirm={handleSaveConfirm} />
      <ConfirmModal
        open={!!pendingLoad}
        title="Replace circuit?"
        message={pendingLoad?.message ?? ''}
        onConfirm={confirmLoad}
        onCancel={cancelLoad}
      />
    </>
  )
}
