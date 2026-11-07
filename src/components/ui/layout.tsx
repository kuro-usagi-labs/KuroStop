import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/data/hooks';
import { motionPresets } from '@/theme/motion';
import { color, radius, space } from '@/theme/tokens';
import { Divider, Icon, PressableScale, Txt, type IconName } from './primitives';

export const TAB_BAR_SPACE = 104;

/** Root scroll container for tab screens: own large title, safe areas, tab bar clearance. */
export function Screen({
  title, eyebrow, right, children, contentStyle, hasTabBar = true, ...rest
}: ScrollViewProps & {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Set false for screens pushed above the tab navigator so they don't reserve tab-bar space. */
  hasTabBar?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={[{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + (hasTabBar ? TAB_BAR_SPACE : 40), paddingHorizontal: space.md, gap: space.lg }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {eyebrow ? <Txt variant="eyebrow" color={color.ink3}>{eyebrow}</Txt> : null}
          <Txt variant="display" accessibilityRole="header">{title}</Txt>
        </View>
        {right}
      </View>
      {children}
    </ScrollView>
  );
}

/** Scroll container for pushed screens that use the native large-title header. */
export function StackScroll({ children, contentStyle, ...rest }: ScrollViewProps & { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[{ padding: space.md, paddingBottom: insets.bottom + 40, gap: space.lg }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      {children}
    </ScrollView>
  );
}

export function Section({ title, action, children, style, index = 0 }: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  index?: number;
}) {
  const rm = useReduceMotion();
  const m = motionPresets(rm);
  return (
    <Animated.View entering={m.enterDelay(index)} style={[{ gap: 10 }, style]}>
      {title ? (
        <View style={styles.sectionHead}>
          <Txt variant="title2" accessibilityRole="header">{title}</Txt>
          {action}
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} hitSlop={10} style={{ minHeight: 32, justifyContent: 'center' }}>
      <Txt variant="subhead" weight="600" color={color.ink2}>{label}</Txt>
    </PressableScale>
  );
}

/* ───────────────────────── Grouped list ───────────────────────── */

export function Group({ children, footer, header }: { children: ReactNode; footer?: string; header?: string }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  return (
    <View style={{ gap: 6 }}>
      {header ? <Txt variant="eyebrow" color={color.ink3} style={{ marginLeft: 16 }}>{header}</Txt> : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <Divider inset={16} /> : null}
            {child}
          </View>
        ))}
      </View>
      {footer ? <Txt variant="footnote" color={color.ink3} style={{ marginHorizontal: 16 }}>{footer}</Txt> : null}
    </View>
  );
}

export function Row({
  title, subtitle, value, icon, right, onPress, destructive, chevron = !!onPress, stacked,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  chevron?: boolean;
  stacked?: ReactNode;
}) {
  const content = (
    <View style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 10 }}>
      <View style={styles.row}>
        {icon ? (
          <View style={styles.rowIcon}>
            <Icon name={icon} size={18} color={destructive ? color.vermilion : color.ink} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 1 }}>
          <Txt variant="body" color={destructive ? color.vermilion : color.ink}>{title}</Txt>
          {subtitle ? <Txt variant="footnote" color={color.ink3}>{subtitle}</Txt> : null}
        </View>
        {value ? <Txt variant="body" color={color.ink3} num>{value}</Txt> : null}
        {right}
        {chevron ? <Icon name="chevron-forward" size={18} color={color.ink4} /> : null}
      </View>
      {stacked}
    </View>
  );
  if (!onPress) return <View style={{ minHeight: 48 }}>{content}</View>;
  return (
    <PressableScale onPress={onPress} scaleTo={0.985} accessibilityLabel={title} accessibilityHint={subtitle}>
      {content}
    </PressableScale>
  );
}

/* ───────────────────────── States ───────────────────────── */

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={24} color={color.ink2} />
      </View>
      <Txt variant="headline" center>{title}</Txt>
      <Txt variant="subhead" color={color.ink3} center style={{ maxWidth: 280 }}>{body}</Txt>
      {action}
    </View>
  );
}

/** Honest disclosure that prototype data is not persisted. */
export function PrototypeNote({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.note, style]} accessibilityRole="text">
      <Icon name="flask-outline" size={14} color={color.ink3} />
      <Txt variant="footnote" color={color.ink3} style={{ flex: 1 }}>
        Mode prototipe — data contoh & catatan lo hanya tersimpan sementara di memori, hilang saat aplikasi ditutup.
      </Txt>
    </View>
  );
}

export function Stat({ label, value, sub, tone = color.ink, style, icon }: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
}) {
  return (
    <View style={[styles.stat, style]} accessible accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Icon name={icon} size={14} color={color.ink3} /> : null}
        <Txt variant="footnote" color={color.ink3} numberOfLines={1}>{label}</Txt>
      </View>
      <Txt variant="num" color={tone} numberOfLines={1} adjustsFontSizeToFit>{value}</Txt>
      {sub ? <Txt variant="caption" color={color.ink3} numberOfLines={2}>{sub}</Txt> : null}
    </View>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: -4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 32 },
  group: { backgroundColor: color.sheet, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 24 },
  rowIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: color.fill, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 20, backgroundColor: color.sheet, borderRadius: radius.lg },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: color.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 },
  stat: { flexGrow: 1, flexBasis: '45%', backgroundColor: color.sheet, borderRadius: radius.md, padding: 14, gap: 2, minHeight: 92 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
