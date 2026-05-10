/**
 * Central design token object.
 * Import from here instead of hardcoding colors / fonts / radius / spacing across files.
 */
export const TOKENS = {
  colors: {
    bg:          '#080C14',
    bgAlt:       '#0A0F18',
    surface:     'rgba(255,255,255,0.02)',
    surfaceHover:'rgba(255,255,255,0.04)',
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
    xl: 20,
  },
  /** Consistent spacing scale (px). Use as padding/gap/margin values. */
  space: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  20,
    xl:  24,
    xxl: 40,
  },
  /** Box-shadow presets. */
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.4)',
    md:  '0 4px 12px rgba(0,0,0,0.5)',
    lg:  '0 8px 32px rgba(0,0,0,0.6)',
    /** Colored glow — call as a function: TOKENS.shadow.glow('#6EE7D0') */
    glow: (color) => `0 0 18px ${color}55`,
  },
  /** CSS transition shorthands. */
  transition: {
    fast:   'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow:   'all 0.35s ease',
  },
  /** Font size scale (px). */
  fontSize: {
    xs:   10,
    sm:   11,
    base: 13,
    md:   14,
    lg:   16,
    xl:   18,
    xxl:  24,
  },
}
