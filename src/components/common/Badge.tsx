import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { ConsequenceZone } from '../../types';
import { COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';

interface BadgeProps {
  label: string;
  zone?: ConsequenceZone;
  variant?: 'neutral' | 'zone';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  zone = 'CLEAR',
  variant = 'zone',
  style,
  textStyle,
}) => {
  let backgroundColor = COLORS.surfaceSubtle;
  let textColor = COLORS.textSecondary;
  let borderColor = COLORS.border;

  if (variant === 'zone') {
    switch (zone) {
      case 'CLEAR':
        backgroundColor = COLORS.clear.surface;
        textColor = COLORS.clear.primary;
        borderColor = COLORS.clear.border;
        break;
      case 'WARNING':
        backgroundColor = COLORS.warning.surface;
        textColor = COLORS.warning.primary;
        borderColor = COLORS.warning.border;
        break;
      case 'DANGER':
        backgroundColor = COLORS.danger.surface;
        textColor = COLORS.danger.primary;
        borderColor = COLORS.danger.border;
        break;
      case 'CRITICAL':
        backgroundColor = COLORS.critical.surface;
        textColor = COLORS.critical.deep;
        borderColor = COLORS.critical.border;
        break;
    }
  }

  return (
    <View style={[styles.badge, { backgroundColor, borderColor }, style]}>
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
