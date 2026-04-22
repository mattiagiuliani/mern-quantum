import { useMemo, useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { TEMPLATE_COPY } from '../template.constants'
import {
  TEMPLATE_ACTION_BUTTON_VARIANTS,
  TEMPLATE_ERROR_ALERT_STYLE,
  TEMPLATE_FORM_LABEL_STYLE,
  TEMPLATE_MODAL_FOOTER_STYLE,
  TEMPLATE_MODAL_FORM_STYLE,
  TEMPLATE_TEXT_INPUT_STYLE,
} from '../template.styles'
import { parseTags } from '../template.utils'

export function SaveTemplateModal({ open, onClose, onSubmit, defaultCircuit, saving, initialValues }) {
  const templateId = initialValues?._id ?? initialValues?.id ?? null
  const isEditing = Boolean(templateId)
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [tagsRaw, setTagsRaw] = useState((initialValues?.tags ?? []).join(', '))
  const [isPublic, setIsPublic] = useState(Boolean(initialValues?.isPublic))
  const [error, setError] = useState('')

  const canSave = useMemo(() => {
    return Boolean(defaultCircuit) && name.trim().length > 1
  }, [defaultCircuit, name])

  if (!open) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!defaultCircuit) {
      setError(TEMPLATE_COPY.saveTemplateMissingCircuit)
      return
    }

    const result = await onSubmit({
      templateId,
      name: name.trim(),
      description: description.trim(),
      tags: parseTags(tagsRaw),
      isPublic,
      circuit: defaultCircuit,
    })

    if (!result.ok) {
      setError(result.message ?? TEMPLATE_COPY.saveTemplateError)
      return
    }

    onClose()
  }

  return (
    <Modal show={open} onHide={onClose} centered contentClassName="bg-transparent border-0">
      <Form onSubmit={handleSubmit} style={TEMPLATE_MODAL_FORM_STYLE}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#6EE7D0', textTransform: 'uppercase', marginBottom: 8 }}>
            {isEditing ? TEMPLATE_COPY.editTemplate : TEMPLATE_COPY.saveTemplate}
          </div>
          <h3 style={{ margin: 0, color: '#F1EDE4', fontSize: 18 }}>
            {isEditing ? TEMPLATE_COPY.updateTemplatePrompt : TEMPLATE_COPY.createTemplatePrompt}
          </h3>
        </div>

        <Form.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>{TEMPLATE_COPY.templateNameLabel}</Form.Label>
          <Form.Control
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            style={TEMPLATE_TEXT_INPUT_STYLE}
          />
        </Form.Group>

        <Form.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>{TEMPLATE_COPY.templateDescriptionLabel}</Form.Label>
          <Form.Control
            as="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
            style={{
              resize: 'vertical',
              ...TEMPLATE_TEXT_INPUT_STYLE,
            }}
          />
        </Form.Group>

        <Form.Group style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Form.Label style={TEMPLATE_FORM_LABEL_STYLE}>{TEMPLATE_COPY.tagsLabel}</Form.Label>
          <Form.Control
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder={TEMPLATE_COPY.tagsPlaceholder}
            style={TEMPLATE_TEXT_INPUT_STYLE}
          />
        </Form.Group>

        <Form.Check
          type="checkbox"
          label={TEMPLATE_COPY.makePublicLabel}
          style={{ color: 'rgba(255,255,255,0.66)', fontSize: 12 }}
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />

        {error && (
          <Alert variant="danger" style={TEMPLATE_ERROR_ALERT_STYLE}>
            {error}
          </Alert>
        )}

        <div style={TEMPLATE_MODAL_FOOTER_STYLE}>
          <Button
            type="button"
            onClick={onClose}
            variant="outline-secondary"
            style={{
              ...TEMPLATE_ACTION_BUTTON_VARIANTS.secondary,
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '10px 12px',
              flex: '1 1 140px',
            }}
          >
            {TEMPLATE_COPY.cancel}
          </Button>

          <Button
            type="submit"
            disabled={!canSave || saving}
            variant="outline-info"
            style={{
              ...TEMPLATE_ACTION_BUTTON_VARIANTS.info,
              padding: '10px 12px',
              cursor: !canSave || saving ? 'default' : 'pointer',
              flex: '1 1 160px',
            }}
          >
            {saving ? TEMPLATE_COPY.saving : isEditing ? TEMPLATE_COPY.updateTemplate : TEMPLATE_COPY.saveTemplate}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
