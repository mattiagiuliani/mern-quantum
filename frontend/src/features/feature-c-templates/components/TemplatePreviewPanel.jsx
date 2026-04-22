import { Button } from 'react-bootstrap'
import { calculatePercentage } from '../../feature-a-multi-run/multiRun.utils'
import { TEMPLATE_COPY } from '../template.constants'
import { TEMPLATE_ACTION_BUTTON_VARIANTS } from '../template.styles'

function FullCircuitGridPreview({ circuit }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {circuit.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{
            width: 30,
            fontSize: 10,
            color: 'rgba(255,255,255,0.42)',
            fontFamily: "'Space Mono', monospace",
          }}>
            q[{rowIdx}]
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {row.map((gate, stepIdx) => (
              <div
                key={`${rowIdx}-${stepIdx}`}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: gate ? 'rgba(110,231,208,0.12)' : 'rgba(255,255,255,0.03)',
                  color: gate ? '#6EE7D0' : 'rgba(255,255,255,0.24)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 700,
                }}
                title={`step ${stepIdx}`}
              >
                {gate ?? '·'}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TemplatePreviewPanel({ template, previewStatus, previewResults, onRunPreview, onUse, onSave, onDelete, canDelete, canEdit }) {
  const previewTotal = previewResults
    ? Object.values(previewResults).reduce((sum, value) => sum + value, 0)
    : 0

  return (
    <>
      <style>{`
        .template-preview-panel {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: clamp(14px, 2.2vw, 18px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-height: 0;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .template-preview-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .template-preview-actions > button {
          flex: 1 1 160px;
          min-width: 0;
        }

        .template-preview-scroll {
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .template-preview-row {
          display: grid;
          grid-template-columns: 44px 1fr 44px 36px;
          gap: 8px;
          align-items: center;
          min-width: 0;
        }

        @media (max-width: 520px) {
          .template-preview-actions > button {
            flex-basis: 100%;
          }

          .template-preview-row {
            grid-template-columns: 40px 1fr 40px 34px;
            gap: 6px;
          }
        }
      `}</style>
      <aside className="template-preview-panel">
      {!template ? (
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          {TEMPLATE_COPY.selectTemplateHint}
        </div>
      ) : (
        <>
          <div>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              color: '#6EE7D0',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {TEMPLATE_COPY.previewTitle}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#F1EDE4' }}>{template.name}</h2>
            <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.58)', fontSize: 13, lineHeight: 1.5 }}>
              {template.description || TEMPLATE_COPY.noDescription}
            </p>
          </div>

          <div className="template-preview-actions">
            <Button
              variant="outline-info"
              onClick={() => onUse(template)}
              style={TEMPLATE_ACTION_BUTTON_VARIANTS.info}
            >
              {TEMPLATE_COPY.loadTemplate}
            </Button>

            <Button
              variant="outline-secondary"
              onClick={() => onSave(template, !canEdit)}
              style={TEMPLATE_ACTION_BUTTON_VARIANTS.secondary}
            >
              {canEdit ? TEMPLATE_COPY.editTemplate : TEMPLATE_COPY.saveAsNew}
            </Button>

            {canDelete && (
              <Button
                variant="outline-danger"
                onClick={() => onDelete(template)}
                style={TEMPLATE_ACTION_BUTTON_VARIANTS.danger}
              >
                {TEMPLATE_COPY.deleteTemplate}
              </Button>
            )}

            <Button
              variant="outline-warning"
              onClick={() => onRunPreview(template.circuit)}
              disabled={previewStatus === 'running'}
              style={{
                ...TEMPLATE_ACTION_BUTTON_VARIANTS.warning,
                cursor: previewStatus === 'running' ? 'default' : 'pointer',
              }}
            >
              {previewStatus === 'running' ? TEMPLATE_COPY.previewRunning : TEMPLATE_COPY.runPreview}
            </Button>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>
              {TEMPLATE_COPY.circuitPreview}
            </div>
            <div className="template-preview-scroll">
              <FullCircuitGridPreview circuit={template.circuit} />
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>
              {TEMPLATE_COPY.resultsPreview}
            </div>

            {previewStatus === 'idle' && (
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
                {TEMPLATE_COPY.previewIdleHint}
              </div>
            )}

            {previewStatus === 'error' && (
              <div style={{ color: '#FCA5A5', fontSize: 12 }}>
                {TEMPLATE_COPY.previewError}
              </div>
            )}

            {previewResults && Object.entries(previewResults)
              .sort((a, b) => b[1] - a[1])
              .map(([state, count]) => {
                const pct = calculatePercentage(count, previewTotal || 1)

                return (
                  <div key={state} className="template-preview-row">
                    <div style={{ color: '#6EE7D0', fontSize: 12, fontFamily: "'Space Mono', monospace" }}>|{state}⟩</div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', height: 10 }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, rgba(110,231,208,0.7), rgba(110,231,208,0.35))',
                      }} />
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11, textAlign: 'right' }}>{pct}%</div>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textAlign: 'right' }}>{count}</div>
                  </div>
                )
              })}
          </div>
        </>
      )}
      </aside>
    </>
  )
}
