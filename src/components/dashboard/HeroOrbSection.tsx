import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConsequenceResult, ConsequenceZone } from '../../types';
import { LivingOrb } from '../../animations/LivingOrb';
import { Badge } from '../common/Badge';
import { COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { formatIndonesianDate } from '../../utils/date';

interface HeroOrbSectionProps {
  consequence: ConsequenceResult;
  activeDate: string;
  reduceMotion?: boolean;
}

export const HeroOrbSection: React.FC<HeroOrbSectionProps> = ({
  consequence,
  activeDate,
  reduceMotion = false,
}) => {
  const getZoneLabel = (zone: ConsequenceZone): string => {
    switch (zone) {
      case 'CLEAR':
        return 'ZONA BERSIH • KENDALI PENUH';
      case 'WARNING':
        return 'ZONA WASPADA • KOMPROMI';
      case 'DANGER':
        return 'ZONA BAHAYA • HAMPIR JEBOL';
      case 'CRITICAL':
        return 'ZONA KRITIS • TARGET GAGAL';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerEyebrow}>
        <Text style={styles.eyebrowTitle}>AUDIT KONSEKUENSI PRIBADI</Text>
        <Text style={styles.dateLabel}>{formatIndonesianDate(activeDate)}</Text>
      </View>

      {/* Living Orb Stage */}
      <View style={styles.orbWrapper}>
        <LivingOrb zone={consequence.zone} size={154} reduceMotion={reduceMotion} />
      </View>

      {/* Zone Indicator */}
      <View style={styles.badgeWrapper}>
        <Badge
          label={getZoneLabel(consequence.zone)}
          zone={consequence.zone}
          variant="zone"
        />
      </View>

      {/* Brutal Honesty Banner */}
      <View
        style={[
          styles.honestyCard,
          consequence.zone === 'CRITICAL' && styles.criticalHonestyCard,
          consequence.zone === 'DANGER' && styles.dangerHonestyCard,
          consequence.zone === 'WARNING' && styles.warningHonestyCard,
        ]}
      >
        <Text style={styles.honestyText}>"{consequence.honestyMessage}"</Text>
        {consequence.triggeringFactors.length > 0 ? (
          <View style={styles.factorsRow}>
            {consequence.triggeringFactors.map((factor, idx) => (
              <View key={idx} style={styles.factorPill}>
                <Text style={styles.factorTag}>{factor}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  headerEyebrow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  eyebrowTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  orbWrapper: {
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    marginTop: 4,
    marginBottom: 12,
  },
  honestyCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  warningHonestyCard: {
    backgroundColor: COLORS.warning.surfaceSubtle,
    borderColor: COLORS.warning.border,
  },
  dangerHonestyCard: {
    backgroundColor: COLORS.danger.surfaceSubtle,
    borderColor: COLORS.danger.border,
  },
  criticalHonestyCard: {
    backgroundColor: COLORS.critical.surfaceSubtle,
    borderColor: COLORS.critical.border,
  },
  honestyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  factorPill: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  factorTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
});
