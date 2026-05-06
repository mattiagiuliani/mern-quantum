import { Button, Spinner } from 'react-bootstrap'
import { BUILDER_BUTTON_STYLE_TOKENS } from '../circuitBuilder.constants'

/**
 * Top header bar for the Circuit Builder: title, stats badges, and action buttons.
 */
export function CircuitBuilderHeader({
  hasGates,
  totalGates,
  operationCount,
  saveStatus,
  onSave,
  onReset,
  onTemplates,
}) {
  return (
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
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6 }}>
            {totalGates} gate{totalGates !== 1 ? 's' : ''}
          </div>
        )}
        {operationCount > 0 && (
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'rgba(110,231,208,0.7)', textTransform: 'uppercase', padding: '6px 12px', border: '1px solid rgba(110,231,208,0.25)', borderRadius: 6 }}>
            {operationCount} {operationCount === 1 ? 'operation' : 'operations'}
          </div>
        )}
        <Button
          onClick={onTemplates}
          variant="outline-info"
          style={{ ...BUILDER_BUTTON_STYLE_TOKENS.headerBase, ...BUILDER_BUTTON_STYLE_TOKENS.headerTemplates }}
        >
          Templates
        </Button>
        {hasGates && (
          <Button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            variant="outline-success"
            data-testid="builder-save-button"
            style={{
              ...BUILDER_BUTTON_STYLE_TOKENS.headerBase,
              color:       saveStatus === 'saved' ? '#6EE7D0' : saveStatus === 'error' ? '#FCA5A5' : 'rgba(110,231,208,0.85)',
              borderColor: saveStatus === 'saved' ? 'rgba(110,231,208,0.5)' : saveStatus === 'error' ? 'rgba(252,165,165,0.4)' : 'rgba(110,231,208,0.3)',
            }}
          >
            {saveStatus === 'saving'
              ? <Spinner size="sm" animation="border" />
              : saveStatus === 'saved' ? 'Saved ✓'
              : saveStatus === 'error' ? 'Save failed'
              : 'Save'}
          </Button>
        )}
        <Button
          onClick={onReset}
          variant="outline-secondary"
          style={{ ...BUILDER_BUTTON_STYLE_TOKENS.headerBase, ...BUILDER_BUTTON_STYLE_TOKENS.headerReset }}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}
