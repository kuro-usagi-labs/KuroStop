/**
 * KuroStop design tokens.
 *
 * Concept — "Lembar" (the daily sheet): the app is cool porcelain paper and
 * sumi ink. Colour is reserved for one meaning only: the consequence zone /
 * status signal. Habits are distinguished by glyph, never by hue.
 *
 * Contrast (on #FFFFFF): ink 17.9:1 · ink2 8.6:1 · ink3 5.1:1 ·
 * jade 5.6:1 · amber 5.1:1 · vermilion 5.4:1 · crimson 11.2:1.
 * ink4 is decorative / disabled only (never body text).
 */
import type { TextStyle, ViewStyle } from 'react-native';

export const color = {
  paper: '#F2F3F0',
  sheet: '#FFFFFF',
  ink: '#121417',
  ink2: '#474C54',
  ink3: '#656B74',
  ink4: '#A3A8AF',
  hair: '#E3E5E1',
  fill: '#EBEDE9',
  fillStrong: '#DCDFDA',

  jade: '#0C7663',
  jadeTint: '#E2F1EC',
  amber: '#946000',
  amberTint: '#F8EDD5',
  vermilion: '#BF3720',
  vermilionTint: '#FAE3DC',
  crimson: '#7C1129',
  crimsonTint: '#F4DCE1',
  sumi: '#1A1315',

  white: '#FFFFFF',
  scrim: 'rgba(18,20,23,0.42)',
} as const;

export type Zone = 'clear' | 'warning' | 'danger' | 'critical';
export const ZONE_ORDER: Zone[] = ['clear', 'warning', 'danger', 'critical'];

export type ZoneTheme = {
  key: Zone;
  index: number;
  label: string;
  stamp: string;
  accent: string;
  tint: string;
  sheet: string;
  text: string;
  sub: string;
  stain: string;
  stainOpacity: number;
  /** minimum ink marks rendered when the zone is simulated in demo mode */
  demoMarks: number;
};

export const zones: Record<Zone, ZoneTheme> = {
  clear: {
    key: 'clear',
    index: 0,
    label: 'Bersih',
    stamp: 'BERSIH',
    accent: color.jade,
    tint: color.jadeTint,
    sheet: '#FFFFFF',
    text: color.ink,
    sub: color.ink2,
    stain: color.ink,
    stainOpacity: 0.07,
    demoMarks: 0,
  },
  warning: {
    key: 'warning',
    index: 1,
    label: 'Peringatan',
    stamp: 'AWAS',
    accent: color.amber,
    tint: color.amberTint,
    sheet: '#FFF9EE',
    text: color.ink,
    sub: color.ink2,
    stain: '#3A2A10',
    stainOpacity: 0.09,
    demoMarks: 2,
  },
  danger: {
    key: 'danger',
    index: 2,
    label: 'Bahaya',
    stamp: 'BAHAYA',
    accent: color.vermilion,
    tint: color.vermilionTint,
    sheet: '#FFF2EE',
    text: color.ink,
    sub: color.ink2,
    stain: '#4A1A12',
    stainOpacity: 0.11,
    demoMarks: 4,
  },
  critical: {
    key: 'critical',
    index: 3,
    label: 'Kritis',
    stamp: 'KRITIS',
    accent: '#FF8F7A',
    tint: '#3A2226',
    sheet: color.sumi,
    text: '#FBF1EE',
    sub: '#D9BFBA',
    stain: '#000000',
    stainOpacity: 0.45,
    demoMarks: 7,
  },
};

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;

const tab: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  hero: { fontSize: 56, fontWeight: '800', letterSpacing: -2, lineHeight: 60, ...tab },
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.9, lineHeight: 40 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 31 },
  title2: { fontSize: 21, fontWeight: '700', letterSpacing: -0.3, lineHeight: 26 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.2, lineHeight: 23 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.15, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.1, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.1, lineHeight: 16, textTransform: 'uppercase' },
  num: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, lineHeight: 32, ...tab },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const shadow = {
  sheet: {
    shadowColor: '#1B201C',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  float: {
    shadowColor: '#1B201C',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;

/** Minimum comfortable hit target (HIG: 44×44 pt). */
export const HIT = 44;
