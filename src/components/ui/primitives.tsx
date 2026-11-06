import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextProps, type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReduceMotion } from '@/data/hooks';
import { haptic, type HapticKind } from '@/lib/haptics';
import { color, HIT, radius, type, type TypeVariant } from '@/theme/tokens';
import { spring } from '@/theme/motion';

/* ───────────────────────── Text ───────────────────────── */

export type TxtProps = TextProps & {
  variant?: TypeVariant;
  color?: string;
  num?: boolean;
  center?: boolean;
  weight?: TextStyle['fontWeight'];
};

export function Txt({ variant = 'body', color: c = color.ink, num, center, weight, style, ...rest }: TxtProps) {
  return (
    <Text
      maxFontSizeMultiplier={variant === 'hero' || variant === 'display' ? 1.3 : 1.8}
      {...rest}
      style={[
        type[variant],
        { color: c },
        num && styles.num,
        center && styles.center,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
    />
  );
}

/* ───────────────────────── Icon ───────────────────────── */

export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Icon({ name, size = 22, color: c = color.ink }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={c} accessibilityElementsHidden importantForAccessibility="no" />;
}

/* ───────────────────────── Pressable with spring ───────────────────────── */

const APressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticKind | null;
  children?: ReactNode;
};

export function PressableScale({
  scaleTo = 0.97, haptic: h = 'tap', onPress, onPressIn, onPressOut, style, children, disabled, ...rest
}: PressableScaleProps) {
  const rm = useReduceMotion();
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <APressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      onPressIn={(e) => {
        if (!rm) scale.value = withSpring(scaleTo, spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.press);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (h) haptic[h]();
        onPress?.(e);
      }}
      style={[style, aStyle, disabled && { opacity: 0.4 }]}>
      {children}
    </APressable>
  );
}

/* ───────────────────────── Button ───────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'inverse';

export function Button({
  label, onPress, variant = 'primary', size = 'lg', icon, accent, disabled, haptic: h = 'light', style, accessibilityLabel,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'lg' | 'md' | 'sm';
  icon?: IconName;
  accent?: string;
  disabled?: boolean;
  haptic?: HapticKind | null;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: color.ink, fg: color.white },
    secondary: { bg: color.fill, fg: color.ink },
    ghost: { bg: 'transparent', fg: color.ink, border: color.fillStrong },
    danger: { bg: color.vermilionTint, fg: color.vermilion },
    accent: { bg: accent ?? color.jade, fg: color.white },
    inverse: { bg: color.white, fg: color.ink },
  };
  const p = palette[variant];
  const h_ = size === 'lg' ? 56 : size === 'md' ? 48 : 36;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={h}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.btn,
        {
          minHeight: Math.max(h_, size === 'sm' ? 36 : HIT),
          backgroundColor: p.bg,
          borderColor: p.border ?? 'transparent',
          borderWidth: p.border ? 1.5 : 0,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          borderRadius: size === 'sm' ? radius.pill : radius.md,
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={p.fg} /> : null}
      <Txt variant={size === 'sm' ? 'footnote' : 'headline'} weight="600" color={p.fg} numberOfLines={1}>
        {label}
      </Txt>
    </PressableScale>
  );
}

export function IconButton({
  icon, onPress, label, tone = 'fill', size = HIT, iconColor,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  tone?: 'fill' | 'ink' | 'clear' | 'sheet';
  size?: number;
  iconColor?: string;
}) {
  const bg = { fill: color.fill, ink: color.ink, clear: 'transparent', sheet: color.sheet }[tone];
  const fg = iconColor ?? (tone === 'ink' ? color.white : color.ink);
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={size < HIT ? (HIT - size) / 2 : 0}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={Math.round(size * 0.48)} color={fg} />
    </PressableScale>
  );
}

/* ───────────────────────── Surfaces ───────────────────────── */

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && { padding: 18 }, style]}>{children}</View>;
}

export function Divider({ inset = 0, style }: { inset?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: color.hair, marginLeft: inset }, style]} />;
}

export function Chip({
  label, selected, onPress, icon, tone = color.ink,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected ? { backgroundColor: tone, borderColor: tone } : null]}>
      {icon ? <Icon name={icon} size={15} color={selected ? color.white : color.ink2} /> : null}
      <Txt variant="subhead" weight="500" color={selected ? color.white : color.ink2}>
        {label}
      </Txt>
    </PressableScale>
  );
}

export function Badge({ label, fg = color.ink2, bg = color.fill, icon }: { label: string; fg?: string; bg?: string; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <Txt variant="caption" weight="700" color={fg} style={{ letterSpacing: 0.4 }}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  num: { fontVariant: ['tabular-nums'] },
  center: { textAlign: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  card: { backgroundColor: color.sheet, borderRadius: radius.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: color.fillStrong,
    backgroundColor: color.sheet,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
