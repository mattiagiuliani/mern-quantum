export const TEMPLATE_ACTION_BUTTON_BASE_STYLE = {
  background: 'transparent',
  borderRadius: 8,
  padding: '9px 12px',
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

export const TEMPLATE_ACTION_BUTTON_VARIANTS = {
  info: {
    ...TEMPLATE_ACTION_BUTTON_BASE_STYLE,
    border: '1.5px solid rgba(110,231,208,0.45)',
    color: '#6EE7D0',
    cursor: 'pointer',
  },
  secondary: {
    ...TEMPLATE_ACTION_BUTTON_BASE_STYLE,
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.65)',
    cursor: 'pointer',
  },
  danger: {
    ...TEMPLATE_ACTION_BUTTON_BASE_STYLE,
    border: '1px solid rgba(252,165,165,0.4)',
    color: '#FCA5A5',
    cursor: 'pointer',
  },
  warning: {
    ...TEMPLATE_ACTION_BUTTON_BASE_STYLE,
    border: '1px solid rgba(252,211,77,0.4)',
    color: '#FCD34D',
  },
}

export const TEMPLATE_META_TEXT_STYLE = {
  fontSize: 10,
  letterSpacing: '0.08em',
  color: 'rgba(255,255,255,0.38)',
  textTransform: 'uppercase',
}

export const TEMPLATE_TEXT_INPUT_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#F1EDE4',
  borderRadius: 8,
  padding: '10px 12px',
}

export const TEMPLATE_FORM_LABEL_STYLE = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.6)',
}

export const TEMPLATE_MODAL_FORM_STYLE = {
  width: '100%',
  background: '#0A0F18',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  padding: 'clamp(14px, 2.5vw, 20px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  maxHeight: 'calc(100vh - 24px)',
  overflowY: 'auto',
}

export const TEMPLATE_MODAL_FOOTER_STYLE = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  position: 'sticky',
  bottom: 0,
  background: '#0A0F18',
  paddingTop: 8,
  borderTop: '1px solid rgba(255,255,255,0.08)',
  marginTop: 2,
  flexWrap: 'wrap',
}

export const TEMPLATE_ERROR_ALERT_STYLE = {
  fontSize: 12,
  color: '#FCA5A5',
  border: '1px solid rgba(252,165,165,0.3)',
  background: 'rgba(252,165,165,0.08)',
  borderRadius: 8,
  padding: '8px 10px',
  marginBottom: 0,
}

export const TEMPLATE_PAGE_BUTTON_STYLES = {
  secondary: {
    ...TEMPLATE_ACTION_BUTTON_VARIANTS.secondary,
    color: 'rgba(255,255,255,0.7)',
  },
  info: {
    ...TEMPLATE_ACTION_BUTTON_VARIANTS.info,
  },
  loginCta: {
    ...TEMPLATE_ACTION_BUTTON_VARIANTS.info,
    width: 'fit-content',
    border: '1px solid rgba(110,231,208,0.42)',
    padding: '8px 10px',
  },
}

export const TEMPLATE_FILTER_INPUT_STYLE = {
  width: '100%',
  ...TEMPLATE_TEXT_INPUT_STYLE,
  padding: '11px 12px',
}

export const TEMPLATE_EMPTY_STATE_BOX_STYLE = {
  border: '1px dashed rgba(255,255,255,0.2)',
  borderRadius: 12,
  padding: 20,
  color: 'rgba(255,255,255,0.45)',
  fontSize: 12,
}

export const TEMPLATE_LOCKED_STATE_BOX_STYLE = {
  border: '1px dashed rgba(110,231,208,0.35)',
  borderRadius: 12,
  padding: 20,
  color: 'rgba(255,255,255,0.6)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}