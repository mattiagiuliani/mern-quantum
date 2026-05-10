# Step-By-Step Feature

This feature executes circuits as an ordered sequence for educational visualization.

## Responsibility

- Build execution queue from circuit matrix.
- Advance one operation at a time.
- Track progress index, status, and completion percentage.
- Provide optional autoplay controls with delay.

## Main Files

- `index.js`: feature barrel exports.
- `useFeatureDStepByStep.js`: main hook for queue and progression.
- `stepByStep.constants.js`: statuses and labels.
- `stepByStep.utils.js`: queue and progression helpers.
- `components/*`: step controls and progress UI.

## Public API

- `STEP_BY_STEP_STATUS`.
- `useFeatureDStepByStep()`.
- `StepByStepControls` component.

## Integration Notes

- Used by `CircuitBuilderPage` beside multi-run mode.
- On completion, result can be persisted as `lastResult`.
- Keep queue semantics aligned with gate ordering from builder matrix.
