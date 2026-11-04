import React from 'react';
import { StyleSheet, View, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';
import { COLORS } from '../../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'surface' | 'tinted' | 'subtle';
  tintColor?: string;
  borderColor?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'surface',
  tintColor,
  borderColor,
}) => {
  const containerStyle: ViewStyle = {
    backgroundColor: variant === 'tinted' && tintColor ? tintColor : COLORS.surface,
    borderColor: borderColor || COLORS.border,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, containerStyle, SHADOWS.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, containerStyle, SHADOWS.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.cardPadding,
    borderWidth: 1,
  },
});
