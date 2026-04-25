/**
 * Central design token object.
 * Import from here instead of hardcoding colors / fonts / radius across files.
 */
export const TOKENS = {
  colors: {
    bg:          '#080C14',
    bgAlt:       '#0A0F18',
    surface:     'rgba(255,255,255,0.02)',
    border:      'rgba(255,255,255,0.07)',
    borderStrong:'rgba(255,255,255,0.12)',
    teal:        '#6EE7D0',
    tealFaint:   'rgba(110,231,208,0.35)',
    tealSubtle:  'rgba(110,231,208,0.08)',
    purple:      '#A78BFA',
    purpleFaint: 'rgba(167,139,250,0.35)',
    red:         '#FCA5A5',
    redFaint:    'rgba(252,165,165,0.35)',
    yellow:      '#FCD34D',
    yellowFaint: 'rgba(252,211,77,0.35)',
    textPrimary: '#F1EDE4',
    textMuted:   'rgba(255,255,255,0.4)',
    textFaint:   'rgba(255,255,255,0.2)',
  },
  fonts: {
    mono:  "'Space Mono', monospace",
    serif: "'Lora', Georgia, serif",
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 14,
  },
}
