import { Button } from 'react-bootstrap'
import { TEMPLATE_COPY } from '../template.constants'
import { TEMPLATE_ACTION_BUTTON_VARIANTS, TEMPLATE_META_TEXT_STYLE } from '../template.styles'
import { buildMiniMeta } from '../template.utils'
import { MiniCircuitPreview } from './MiniCircuitPreview'

export function TemplateCard({ template, selected, onSelect, onUse }) {
  const meta = buildMiniMeta(template.circuit)

  return (
    <article
      data-testid={`template-card-${template._id ?? template.id ?? template.name}`}
      onClick={() => onSelect(template)}
      style={{
        background: selected ? 'rgba(110,231,208,0.07)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(110,231,208,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, color: '#F1EDE4' }}>{template.name}</h3>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5 }}>
            {template.description || TEMPLATE_COPY.noDescription}
          </p>
        </div>
        {template.isPublic && (
          <span style={{
            fontSize: 9,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6EE7D0',
            border: '1px solid rgba(110,231,208,0.3)',
            borderRadius: 999,
            padding: '4px 8px',
            height: 'fit-content',
            flexShrink: 0,
          }}>
            Public
          </span>
        )}
      </div>

      <MiniCircuitPreview circuit={template.circuit} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {template.tags?.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 999,
              padding: '4px 8px',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div style={TEMPLATE_META_TEXT_STYLE}>
        {meta.qubits} qubits · {meta.steps} steps · {meta.gates} gates
      </div>

      <Button
        data-testid={`template-use-${template._id ?? template.id ?? template.name}`}
        variant="outline-info"
        onClick={(event) => {
          event.stopPropagation()
          onUse(template)
        }}
        style={{
          ...TEMPLATE_ACTION_BUTTON_VARIANTS.info,
          marginTop: 'auto',
          width: '100%',
          border: '1.5px solid rgba(110,231,208,0.4)',
          padding: '9px 10px',
        }}
      >
        {TEMPLATE_COPY.loadTemplate}
      </Button>
    </article>
  )
}
