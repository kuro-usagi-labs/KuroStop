export const COLORS = {
  // Light Canvas Foundations
  background: '#F8FAF9',
  surface: '#FFFFFF',
  surfaceSubtle: '#F1F5F3',
  surfaceActive: '#E9EFEF',
  border: '#E2EAE5',
  borderSubtle: '#EDF2EF',
  borderStrong: '#CBD8D2',

  // Typography
  textPrimary: '#18211E',
  textSecondary: '#66746E',
  textTertiary: '#9EABA4',
  textInverse: '#FFFFFF',

  // Visual State: CLEAR (Mint / Rebirth)
  clear: {
    primary: '#3BB273',
    accent: '#54C98A',
    surface: '#DDF6E8',
    surfaceSubtle: '#F0FAF4',
    border: '#BFE7D0',
    glow: 'rgba(84, 201, 138, 0.35)',
  },

  // Visual State: WARNING (Amber / Hesitation)
  warning: {
    primary: '#D9911C',
    accent: '#E9AA40',
    surface: '#FDF5E6',
    surfaceSubtle: '#FEFAF2',
    border: '#F6DAB0',
    glow: 'rgba(233, 170, 64, 0.40)',
  },

  // Visual State: DANGER (Orange / Escalation)
  danger: {
    primary: '#D95325',
    accent: '#E76B40',
    surface: '#FDF1EB',
    surfaceSubtle: '#FEF8F5',
    border: '#F9C8B5',
    glow: 'rgba(231, 107, 64, 0.45)',
  },

  // Visual State: CRITICAL (Visceral Crimson / Decay)
  critical: {
    primary: '#C4283D',
    accent: '#D83D52',
    deep: '#922539',
    surface: '#FDEEF0',
    surfaceSubtle: '#FEF7F8',
    border: '#F5B8C0',
    glow: 'rgba(216, 61, 82, 0.55)',
  },

  // Overlay & Shadows
  overlay: 'rgba(24, 33, 30, 0.45)',
  shadow: '#0D1A14',
};

export type ThemeColors = typeof COLORS;
