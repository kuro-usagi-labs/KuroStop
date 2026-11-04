import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { HabitSeverity } from '../../types';
import { COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { formatIDR } from '../../utils/currency';

interface HabitSummaryCardProps {
  habit: 'smoking' | 'pmo' | 'sleep';
  severity: HabitSeverity;
  onPressCard: () => void;
  smokingCount?: number;
  spendingToday?: number;
  onQuickAddSmoke?: () => void;
  pmoCount?: number;
  onQuickLogPMO?: () => void;
  targetBedtime?: string;
  isSleeping?: boolean;
  onToggleSleep?: () => void;
}

export const HabitSummaryCard: React.FC<HabitSummaryCardProps> = ({
  habit,
  severity,
  onPressCard,
  smokingCount = 0,
  spendingToday = 0,
  onQuickAddSmoke,
  pmoCount = 0,
  onQuickLogPMO,
  targetBedtime = '23:00',
  isSleeping = false,
  onToggleSleep,
}) => {
  const getCardDetails = () => {
    switch (habit) {
      case 'smoking':
        return {
          title: 'Merokok',
          icon: 'flame-outline' as const,
          mainValue: `${smokingCount}`,
          mainUnit: 'batang',
          subtitle: spendingToday > 0 ? `Keluar ${formatIDR(spendingToday)} hari ini` : 'Target harian: 0 batang',
        };
      case 'pmo':
        return {
          title: 'PMO & Masturbasi',
          icon: 'shield-outline' as const,
          mainValue: `${pmoCount}`,
          mainUnit: 'sesi',
          subtitle: pmoCount === 0 ? 'Pikiran bersih • Target 0 toleransi' : 'Target dilanggar hari ini',
        };
      case 'sleep':
        return {
          title: 'Tidur & Begadang',
          icon: 'moon-outline' as const,
          mainValue: isSleeping ? 'Tidur Aktif' : targetBedtime,
          mainUnit: isSleeping ? '' : 'target',
          subtitle: isSleeping ? 'Sedang mencatat jam tidur' : severity.summary,
        };
    }
  };

  const details = getCardDetails();

  return (
    <Card
      onPress={onPressCard}
      style={[
        styles.card,
        severity.status === 'CRITICAL' && styles.criticalCard,
        severity.status === 'DANGER' && styles.dangerCard,
        severity.status === 'WARNING' && styles.warningCard,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <View style={styles.iconCircle}>
            <Ionicons name={details.icon} size={16} color={COLORS.textPrimary} />
          </View>
          <Text style={styles.titleText}>{details.title}</Text>
        </View>
        <Badge label={severity.summary} zone={severity.status} />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.metricsWrapper}>
          <View style={styles.valueRow}>
            <Text style={styles.numericValue}>{details.mainValue}</Text>
            {details.mainUnit ? <Text style={styles.unitText}>{details.mainUnit}</Text> : null}
          </View>
          <Text style={styles.subtitleText}>{details.subtitle}</Text>
        </View>

        <View style={styles.actionWrapper}>
          {habit === 'smoking' && onQuickAddSmoke && (
            <Button
              title="+1 Batang"
              variant="outline"
              onPress={onQuickAddSmoke}
              style={styles.quickButton}
              textStyle={styles.quickButtonText}
            />
          )}

          {habit === 'pmo' && onQuickLogPMO && (
            <Button
              title="Catat Sesi"
              variant="outline"
              onPress={onQuickLogPMO}
              style={styles.quickButton}
              textStyle={styles.quickButtonText}
            />
          )}

          {habit === 'sleep' && onToggleSleep && (
            <Button
              title={isSleeping ? 'Bangun' : 'Mau Tidur'}
              variant={isSleeping ? 'secondary' : 'primary'}
              onPress={onToggleSleep}
              style={styles.quickButton}
              textStyle={styles.quickButtonText}
            />
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.xs + 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warningCard: {
    borderColor: COLORS.warning.border,
    backgroundColor: COLORS.warning.surfaceSubtle,
  },
  dangerCard: {
    borderColor: COLORS.danger.border,
    backgroundColor: COLORS.danger.surfaceSubtle,
  },
  criticalCard: {
    borderColor: COLORS.critical.border,
    backgroundColor: COLORS.critical.surfaceSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 9,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricsWrapper: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  numericValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.6,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 5,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionWrapper: {
    marginLeft: 10,
  },
  quickButton: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
