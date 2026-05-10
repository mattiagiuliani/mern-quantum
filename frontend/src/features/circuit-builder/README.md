# Circuit Builder Feature

This feature powers the interactive circuit editor and gate placement workflow.

## Responsibility

- Maintain matrix-based circuit state.
- Handle gate selection and cell click interactions.
- Support CNOT control/target placement flow.
- Provide keyboard shortcuts and undo stack hooks.
- Render visual builder components and live state panels.

## Main Files

- `index.js`: feature barrel exports.
- `circuitBuilder.constants.js`: limits, gate metadata, style tokens.
- `circuitBuilder.utils.js`: pure matrix/state helpers.
- `useFeatureBCircuitBuilder.js`: keyboard shortcuts and undo hooks.
- `useSaveCircuit.js`: save/update workflow.
- `circuitBuilder.module.css`: CSS Modules styles.
- `components/*`: builder UI components.

## Public API

- `emptyCircuit()`, `normalizeTemplateCircuit()`, `buildGateSequenceFromCircuit()`.
- `useKeyboardShortcuts()`, `useUndoStack()`.
- Components such as `QubitWire`, `GatePaletteButton`, `CircuitSequencePanel`.

## Integration Notes

- Consumed mainly by `CircuitBuilderPage`.
- Uses backend endpoints:
  - `POST /api/circuits/applyGate`
  - `POST /api/circuits`
  - `PUT /api/circuits/:id`
- Keep matrix shape consistent across save/load/template flows.
