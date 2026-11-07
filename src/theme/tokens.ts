/**
 * KuroStop design tokens — "Lembar" v2.
 *
 * Concept — the daily ledger sheet: cool porcelain paper, sumi ink, and a
 * single consequence signal. Colour is reserved for status (zone / money),
 * never decoration. Habits are distinguished by glyph and shape, not hue.
 *
 * Contrast on #FFFFFF:
 *   ink 18.6:1 · ink2 8.7:1 · ink3 5.6:1 · jade 5.9:1 · amber 5.4:1 ·
 *   vermilion 5.5:1 · crimson 11.2:1.
 * ink4 is decorative / disabled only (3.2:1) — never use it for text.
 *
 * Type is system SF with a calmer scale than v1: no weight above 700, no
 * tracking tighter than -1.4 at display sizes, and body text at the iOS
 * default 17 pt.
 */
import type { TextStyle, ViewStyle } from 'react-native';

export const color = {
  paper: '#F1F1EC',
  paperDeep: '#E7E8E2',
  sheet: '#FFFFFF',
  ink: '#14161A',
  ink2: '#454B54',
  ink3: '#616873',
  ink4: '#8C939D',
  hair: '#E2E3DE',
  fill: '#E9EAE5',
  fillStrong: '#D9DBD5',

  jade: '#0B6B59',
  jadeTint: '#E3F1EC',
  amber: '#8A5A00',
  amberTint: '#F7EDD7',
  vermilion: '#B93A26',
  vermilionTint: '#FAE4DE',
  crimson: '#7C1129',
  crimsonTint: '#F4DCE1',
  sumi: '#1A1614',

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
    stainOpacity: 0.06,
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
    stainOpacity: 0.08,
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
    stainOpacity: 0.1,
    demoMarks: 4,
  },
  critical: {
    key: 'critical',
    index: 3,
    label: 'Kritis',
    stamp: 'KRITIS',
    accent: '#FF9C88',
    tint: '#3A2226',
    sheet: color.sumi,
    text: '#FBF1EE',
    sub: '#D8C2BD',
    stain: '#000000',
    stainOpacity: 0.42,
    demoMarks: 7,
  },
};

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40 } as const;
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 22, pill: 999 } as const;

/** Horizontal page gutter. One value everywhere keeps the ledger aligned. */
export const gutter = space.lg;

const tab: TextStyle = { fontVariant: ['tabular-nums'] };

export const type = {
  /** One-off splash / onboarding mark only. */
  hero: { fontSize: 44, fontWeight: '700', letterSpacing: -1.4, lineHeight: 48, ...tab },
  /** Screen title. */
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.7, lineHeight: 35 },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.4, lineHeight: 29 },
  title2: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2, lineHeight: 24 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: '400', letterSpacing: -0.1, lineHeight: 24 },
  callout: { fontSize: 16, fontWeight: '400', letterSpacing: -0.1, lineHeight: 22 },
  subhead: { fontSize: 15, fontWeight: '400', letterSpacing: -0.05, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  /** Small caps label used for section headers and metadata. */
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.9, lineHeight: 14, textTransform: 'uppercase' },
  num: { fontSize: 24, fontWeight: '700', letterSpacing: -0.6, lineHeight: 28, ...tab },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const shadow = {
  /** Only the signature sheet and floating layers get elevation. Cards stay flat. */
  sheet: {
    shadowColor: '#14161A',
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  float: {
    shadowColor: '#14161A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;

/** Minimum comfortable hit target (HIG: 44×44 pt). */
export const HIT = 44;
