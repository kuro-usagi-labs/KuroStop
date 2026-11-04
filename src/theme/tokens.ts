import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';
import { SPACING, RADIUS, SHADOWS } from './spacing';
import { ConsequenceZone } from '../types';

export const getZoneColors = (zone: ConsequenceZone) => {
  switch (zone) {
    case 'CLEAR':
      return COLORS.clear;
    case 'WARNING':
      return COLORS.warning;
    case 'DANGER':
      return COLORS.danger;
    case 'CRITICAL':
      return COLORS.critical;
  }
};

export const getZoneGlowShadow = (zone: ConsequenceZone) => {
  switch (zone) {
    case 'CLEAR':
      return SHADOWS.glowClear;
    case 'WARNING':
      return SHADOWS.glowWarning;
    case 'DANGER':
      return SHADOWS.glowDanger;
    case 'CRITICAL':
      return SHADOWS.glowCritical;
  }
};

export const THEME = {
  colors: COLORS,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  radius: RADIUS,
  shadows: SHADOWS,
  getZoneColors,
  getZoneGlowShadow,
};

export default THEME;
