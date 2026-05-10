import { TOKENS } from '../styles/tokens'

const { colors: C, fonts: F, radius: R } = TOKENS

export function createAuthPageStyles() {
  return {
    page: {
      background: C.bg,
      minHeight: '100vh',
      color: C.textPrimary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: F.mono,
      padding: '24px',
    },
    card: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: R.lg,
      padding: '40px 44px',
      width: '100%',
      maxWidth: 400,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    },
    label: {
      display: 'block',
      fontSize: 10,
      letterSpacing: '0.15em',
      color: C.textMuted,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    input: {
      width: '100%',
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${C.borderStrong}`,
      borderRadius: R.md,
      padding: '12px 14px',
      color: C.textPrimary,
      fontFamily: F.mono,
      fontSize: 13,
      outline: 'none',
      boxSizing: 'border-box',
    },
    btn: {
      background: 'transparent',
      border: `1.5px solid ${C.teal}`,
      color: C.teal,
      fontFamily: F.mono,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.08em',
      padding: '14px',
      borderRadius: R.md,
      cursor: 'pointer',
      textTransform: 'uppercase',
      width: '100%',
      transition: 'all 0.2s',
    },
    error: {
      fontSize: 12,
      color: C.red,
      letterSpacing: '0.04em',
      padding: '10px 14px',
      background: 'rgba(252,165,165,0.08)',
      border: `1px solid ${C.redFaint}`,
      borderRadius: R.md,
    },
    link: {
      color: C.teal,
      textDecoration: 'none',
      fontSize: 11,
    },
  }
}