import { Modal, Button } from 'react-bootstrap'
import { TOKENS } from '../styles/tokens'

const { colors: C, fonts: F } = TOKENS

/**
 * Accessible confirmation dialog — replaces window.confirm throughout the app.
 *
 * @param {{ open: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }} props
 */
export function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return (
    <Modal
      show={open}
      onHide={onCancel}
      centered
      contentClassName="bg-dark border border-secondary"
    >
      <Modal.Header
        closeButton
        style={{ borderColor: 'rgba(255,255,255,0.08)', padding: '16px 24px' }}
      >
        <Modal.Title
          style={{
            fontFamily: F.mono,
            fontSize: 14,
            fontWeight: 700,
            color: C.textPrimary,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px', fontFamily: F.mono, fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
        {message}
      </Modal.Body>

      <Modal.Footer style={{ borderColor: 'rgba(255,255,255,0.08)', padding: '12px 24px', gap: 8 }}>
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.06em' }}
        >
          Cancel
        </Button>
        <Button
          variant="outline-danger"
          onClick={onConfirm}
          style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.06em' }}
        >
          Replace
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
