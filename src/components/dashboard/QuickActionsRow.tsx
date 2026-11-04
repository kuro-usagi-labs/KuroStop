import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

interface QuickActionsRowProps {
  onOpenUrge: () => void;
  onOpenQuickLog: () => void;
  onOpenBuyCigarettes: () => void;
}

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({
  onOpenUrge,
  onOpenQuickLog,
  onOpenBuyCigarettes,
}) => {
  return (
    <View style={styles.container}>
      {/* Primary Urge Interruption Button */}
      <Button
        title="Gue Lagi Pengen..."
        variant="primary"
        onPress={onOpenUrge}
        icon={<Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />}
        style={styles.urgeButton}
        textStyle={styles.urgeButtonText}
      />

      <View style={styles.secondaryRow}>
        <Button
          title="+ Catat Detail"
          variant="secondary"
          onPress={onOpenQuickLog}
          icon={<Ionicons name="add-circle-outline" size={17} color={COLORS.textPrimary} />}
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
        />

        <Button
          title="Beli Rokok"
          variant="secondary"
          onPress={onOpenBuyCigarettes}
          icon={<Ionicons name="cart-outline" size={17} color={COLORS.textPrimary} />}
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
  },
  urgeButton: {
    minHeight: 50,
    backgroundColor: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  urgeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
