export const COLORS = {
  // Ultra-refined Light Canvas Foundations (iOS System standard)
  background: '#F8FAF9',
  canvasMuted: '#F2F6F4',
  surface: '#FFFFFF',
  surfaceSubtle: '#F4F7F5',
  surfaceActive: '#EAEFEA',
  surfaceGlass: 'rgba(255, 255, 255, 0.88)',

  // Borders & Dividers (Hairline & Sub-pixel)
  border: '#E3ECE7',
  borderSubtle: '#EDF3F0',
  borderStrong: '#CBD8D1',
  borderFocus: '#18211E',

  // Typography Scale Hierarchy
  textPrimary: '#141C19',
  textSecondary: '#5E6B65',
  textTertiary: '#94A39B',
  textInverse: '#FFFFFF',

  // Visual State: CLEAR (Emerald Mint — Restrained, Calming, Pure)
  clear: {
    primary: '#2E9F63',
    accent: '#47BE7D',
    deep: '#1D6E43',
    surface: '#E8F7EE',
    surfaceSubtle: '#F3FBF6',
    border: '#BFE7D0',
    glow: 'rgba(71, 190, 125, 0.28)',
  },

  // Visual State: WARNING (Warm Amber — Hesitation & Vigilance)
  warning: {
    primary: '#C97D10',
    accent: '#E59B28',
    deep: '#8A5205',
    surface: '#FDF6E8',
    surfaceSubtle: '#FEFAF2',
    border: '#F4D8A6',
    glow: 'rgba(229, 155, 40, 0.32)',
  },

  // Visual State: DANGER (Fiery Coral — Active Escalation & Tension)
  danger: {
    primary: '#D34A1B',
    accent: '#E35F2F',
    deep: '#942D08',
    surface: '#FDF1EB',
    surfaceSubtle: '#FEF8F5',
    border: '#F8C5B0',
    glow: 'rgba(227, 95, 47, 0.38)',
  },

  // Visual State: CRITICAL (Visceral Crimson — Disruption & System Failure)
  critical: {
    primary: '#BA2035',
    accent: '#D32F45',
    deep: '#841B2B',
    surface: '#FDEEF0',
    surfaceSubtle: '#FEF7F8',
    border: '#F4B5BD',
    glow: 'rgba(211, 47, 69, 0.45)',
  },

  // Overlays & Scrims
  overlay: 'rgba(20, 28, 25, 0.52)',
  shadow: '#0B1410',
};

export type ThemeColors = typeof COLORS;
