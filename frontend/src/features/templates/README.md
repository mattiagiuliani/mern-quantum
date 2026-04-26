# Templates Feature

This feature manages reusable circuit templates and template browsing.

## Responsibility

- Load public templates with pagination and optional tag filter.
- Load authenticated user's private templates.
- Create, update, and delete templates.
- Preview template circuit before applying it in the builder.

## Main Files

- `index.js`: feature barrel exports.
- `useFeatureCTemplates.js`: templates data lifecycle hook.
- `template.constants.js`: labels and copy strings.
- `template.utils.js`: clone and validation helpers.
- `template.styles.js`: style token helpers for page usage.
- `templateExamples.js`: built-in educational examples.
- `components/*`: cards, tabs, preview, and save modal.

## Public API

- `TEMPLATE_COPY`, `TEMPLATE_TABS`.
- `useFeatureCTemplates()`.
- `cloneCircuit()`, `isCircuitEmpty()`.

## Integration Notes

- Consumed by `TemplatesPage`.
- Uses backend endpoints under `/api/templates`.
- Template payload must preserve circuit matrix compatibility with builder.
