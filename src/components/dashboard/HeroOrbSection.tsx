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
      <Text style={styles.dateLabel}>{formatIndonesianDate(activeDate)}</Text>

      {/* Living Orb Presentation */}
      <View style={styles.orbWrapper}>
        <LivingOrb zone={consequence.zone} size={150} reduceMotion={reduceMotion} />
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
        ]}
      >
        <Text style={styles.honestyText}>"{consequence.honestyMessage}"</Text>
        {consequence.triggeringFactors.length > 0 ? (
          <View style={styles.factorsRow}>
            {consequence.triggeringFactors.map((factor, idx) => (
              <Text key={idx} style={styles.factorTag}>
                • {factor}
              </Text>
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
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.screenPadding,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  orbWrapper: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    marginTop: 8,
    marginBottom: 14,
  },
  honestyCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  criticalHonestyCard: {
    backgroundColor: COLORS.critical.surfaceSubtle,
    borderColor: COLORS.critical.border,
  },
  dangerHonestyCard: {
    backgroundColor: COLORS.danger.surfaceSubtle,
    borderColor: COLORS.danger.border,
  },
  honestyText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  factorTag: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.critical.primary,
  },
});
