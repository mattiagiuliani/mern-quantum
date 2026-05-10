# Multi-Run Feature

This feature manages repeated circuit execution with configurable shot presets.

## Responsibility

- Track selected shots preset in UI.
- Run backend simulation with selected shot count.
- Normalize and expose probabilities for charts/panels.
- Provide loading/success/error status for run actions.

## Main Files

- `index.js`: feature barrel exports.
- `useFeatureAMultiRun.js`: hook with run lifecycle state.
- `multiRun.constants.js`: shot presets and labels.
- `multiRun.utils.js`: helpers to compute percentages and normalize results.
- `multiRun.utils.test.js`: unit tests for utils.

## Public API

- `SHOT_PRESETS`: available shot values.
- `calculatePercentage(count, total)`: percentage helper.
- `useFeatureAMultiRun()`: main stateful hook.

## Integration Notes

- `CircuitBuilderPage` consumes this feature for run controls and result payload.
- Backend endpoint used: `POST /api/circuits/run`.
- Keep output contract stable: `{ counts, shots }`.
