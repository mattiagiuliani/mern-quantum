import { TOKENS } from '../../styles/tokens'

const { colors: C, fonts: F, radius: R } = TOKENS

// NOTE on size limits vs. the backend:
// The frontend enforces smaller dimensions than the backend validation allows:
//   frontend: NUM_QUBITS=3, MAX_STEPS=8  (UX constraint -- keeps the grid manageable)
//   backend:  MAX_QUBITS=10, MAX_STEPS=16 (API limit -- accommodates imported templates)
export const NUM_QUBITS = 3
export const MAX_STEPS  = 8

export const GATES = {
  H: {
    label: 'H',
    name: 'Hadamard',
    desc: 'Puts the qubit in a mixed state where 0 and 1 are both possible.',
    color: C.teal,
    bg: C.tealSubtle,
    border: 'rgba(110,231,208,0.5)',
  },
  X: {
    label: 'X',
    name: 'Pauli-X',
    desc: 'Flips the qubit value: |0\u27e9 becomes |1\u27e9 and vice versa.',
    color: C.red,
    bg: 'rgba(252,165,165,0.12)',
    border: 'rgba(252,165,165,0.5)',
  },
  M: {
    label: '\u2295',
    name: 'Measure',
    desc: 'Reads the qubit and gives a final result: 0 or 1.',
    color: C.yellow,
    bg: 'rgba(252,211,77,0.12)',
    border: 'rgba(252,211,77,0.5)',
  },
  S: {
    label: 'S',
    name: 'Phase (S)',
    desc: 'Applies a +90° phase rotation to |1⟩. Phase is not directly observable but enables interference effects.',
    color: C.purple,
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.5)',
  },
  CNOT: {
    label: 'CX',
    name: 'CNOT',
    desc: 'Flips the target qubit if the control is |1\u27e9. Click ctrl first, then target in the same column.',
    color: C.purple,
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.5)',
  },
}

export const BUILDER_BUTTON_STYLE_TOKENS = {
  headerBase: {
    background: 'transparent',
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: '0.08em',
    borderRadius: R.md,
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase',
  },
  headerTemplates: {
    border: `1px solid rgba(110,231,208,0.24)`,
    color: 'rgba(110,231,208,0.85)',
    padding: '8px 12px',
  },
  headerReset: {
    border: `1px solid rgba(255,255,255,0.1)`,
    color: C.textMuted,
    padding: '8px 16px',
  },
  shotsPresetBase: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: '0.06em',
    padding: '6px 8px',
    borderRadius: R.md,
    minWidth: 46,
  },
  runButtonBase: {
    background: 'transparent',
    fontFamily: F.mono,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '14px 20px',
    borderRadius: R.md,
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}

export const buildShotPresetStyle = (isActive, isRunning) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.shotsPresetBase,
  background: isActive ? C.tealSubtle : 'transparent',
  border: `1px solid ${isActive ? 'rgba(110,231,208,0.45)' : 'rgba(255,255,255,0.15)'}`,
  color: isActive ? C.teal : C.textMuted,
  cursor: isRunning ? 'default' : 'pointer',
})

export const buildRunButtonStyle = (hasGates) => ({
  ...BUILDER_BUTTON_STYLE_TOKENS.runButtonBase,
  border: `1.5px solid ${hasGates ? C.teal : 'rgba(255,255,255,0.1)'}`,
  color: hasGates ? C.teal : C.textFaint,
  cursor: hasGates ? 'pointer' : 'default',
})

