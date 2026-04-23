export const NUM_QUBITS = 3
export const MAX_STEPS  = 8

export const GATES = {
  H: {
    label: 'H',
    name: 'Hadamard',
    desc: 'Puts the qubit in a mixed state where 0 and 1 are both possible.',
    color: '#6EE7D0',
    bg: 'rgba(110,231,208,0.12)',
    border: 'rgba(110,231,208,0.5)',
  },
  X: {
    label: 'X',
    name: 'Pauli-X',
    desc: 'Flips the qubit value: |0\u27e9 becomes |1\u27e9 and vice versa.',
    color: '#FCA5A5',
    bg: 'rgba(252,165,165,0.12)',
    border: 'rgba(252,165,165,0.5)',
  },
  M: {
    label: '\u2295',
    name: 'Measure',
    desc: 'Reads the qubit and gives a final result: 0 or 1.',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.12)',
    border: 'rgba(252,211,77,0.5)',
  },
}

export const BUILDER_BUTTON_STYLE_TOKENS = {
  headerBase: {
    background: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.08em',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
  },
  headerTemplates: {
    border: '1px solid rgba(110,231,208,0.24)',
    color: 'rgba(110,231,208,0.85)',
    padding: '8px 12px',
  },
  headerReset: {
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.35)',
    padding: '8px 16px',
  },
  shotsPresetBase: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: '0.06em',
    padding: '6px 8px',
    borderRadius: 6,
    minWidth: 46,
  },
  runButtonBase: {
    background: 'transparent',
    fontFamily: "'Space Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '14px 20px',
    borderRadius: 8,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}

export const buildShotPresetStyle = (isActive, isRunning) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.shotsPresetBase,
  background: isActive ? 'rgba(110,231,208,0.12)' : 'transparent',
  border: `1px solid ${isActive ? 'rgba(110,231,208,0.45)' : 'rgba(255,255,255,0.15)'}`,
  color: isActive ? '#6EE7D0' : 'rgba(255,255,255,0.45)',
  cursor: isRunning ? 'default' : 'pointer',
})

export const buildRunButtonStyle = (hasGates) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.runButtonBase,
  border: `1.5px solid ${hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.1)'}`,
  color: hasGates ? '#6EE7D0' : 'rgba(255,255,255,0.2)',
  cursor: hasGates ? 'pointer' : 'default',
})
