// constants & style tokens
export {
  GATES,
  NUM_QUBITS,
  MAX_STEPS,
  BUILDER_BUTTON_STYLE_TOKENS,
  buildShotPresetStyle,
  buildRunButtonStyle,
} from './circuitBuilder.constants'

// pure utility functions
export {
  emptyCircuit,
  initialLiveState,
  isValidGate,
  normalizeTemplateCircuit,
  buildGateSequenceFromCircuit,
  qubitDisplay,
} from './circuitBuilder.utils'

// page-level CSS string
export { BUILDER_PAGE_STYLES } from './circuitBuilder.styles'

// hooks
export { useKeyboardShortcuts, useUndoStack } from './useFeatureBCircuitBuilder'
export { useLiveState }         from './useLiveState'
export { useCircuitGates }      from './useCircuitGates'
export { useCircuitSelection }  from './useCircuitSelection'
export { useAutoPlay }          from './useAutoPlay'
export { useTemplateLoader }    from './useTemplateLoader'

// components
export { GateChip }                from './components/GateChip'
export { GatePaletteButton }       from './components/GatePaletteButton'
export { Cell }                    from './components/Cell'
export { QubitWire }               from './components/QubitWire'
export { InfoTooltip }             from './components/InfoTooltip'
export { LiveStatePanel }          from './components/LiveStatePanel'
export { QasmPreview }             from './components/QasmPreview'
export { CircuitSequencePanel }    from './components/CircuitSequencePanel'
export { CircuitBuilderHeader }    from './components/CircuitBuilderHeader'
export { CircuitCanvas }           from './components/CircuitCanvas'
export { ResultsPanel }            from './components/ResultsPanel'
