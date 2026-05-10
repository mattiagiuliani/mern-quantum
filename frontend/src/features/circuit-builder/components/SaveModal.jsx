import { Modal, Form, Button } from 'react-bootstrap'
import { TOKENS } from '../../../styles/tokens'

const { colors: C, fonts: F, radius: R } = TOKENS

/**
 * Save Circuit Modal — extracted from CircuitBuilderPage.
 */
export function SaveModal({ open, draft, onDraftChange, onClose, onConfirm }) {
  return (
    <Modal
      show={open}
      onHide={onClose}
      centered
      contentClassName="bg-dark border border-secondary"
    >
      <Modal.Header
        closeButton
        style={{ borderColor: 'rgba(255,255,255,0.08)', padding: '16px 24px' }}
      >
        <Modal.Title style={{
          fontFamily: F.mono,
          fontSize: 14, fontWeight: 700, color: C.textPrimary, letterSpacing: '-0.01em',
        }}>
          Save circuit
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px' }}>
        <Form.Label htmlFor="save-circuit-name" style={{
          fontSize: 10, letterSpacing: '0.15em', color: C.textMuted,
          textTransform: 'uppercase', display: 'block', marginBottom: 8,
          fontFamily: F.mono,
        }}>
          Circuit name
        </Form.Label>
        <Form.Control
          id="save-circuit-name"
          aria-required="true"
          autoFocus
          data-testid="save-circuit-name-input"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onConfirm() }}
          maxLength={80}
          style={{
            background: C.surface,
            border: `1px solid ${C.borderStrong}`,
            color: C.textPrimary,
            fontFamily: F.mono,
            fontSize: 13,
            borderRadius: R.md,
          }}
        />
      </Modal.Body>

      <Modal.Footer style={{ borderColor: 'rgba(255,255,255,0.08)', padding: '14px 24px', gap: 8 }}>
        <Button
          variant="outline-secondary"
          onClick={onClose}
          style={{ fontFamily: F.mono, fontSize: 11, color: C.textMuted, borderColor: C.borderStrong }}
        >
          Cancel
        </Button>
        <Button
          variant="outline-info"
          onClick={onConfirm}
          disabled={!draft.trim()}
          data-testid="save-circuit-confirm"
          style={{ fontFamily: F.mono, fontSize: 11, color: C.teal, borderColor: C.tealFaint }}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
