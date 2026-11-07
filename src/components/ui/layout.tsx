import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/data/hooks';
import { motionPresets } from '@/theme/motion';
import { color, gutter, radius, space } from '@/theme/tokens';
import { Divider, Icon, PressableScale, Txt, type IconName } from './primitives';

export const TAB_BAR_SPACE = 96;

/**
 * Root scroll container.
 *
 * Hierarchy comes from three levels only: screen title (30), small-caps section
 * label (11), body (17). Cards are flat sheets with a hairline edge — elevation
 * is reserved for the signature DaySheet and floating layers.
 */
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
      contentContainerStyle={[{
        paddingTop: insets.top + 6,
        paddingBottom: insets.bottom + (hasTabBar ? TAB_BAR_SPACE : 40),
        paddingHorizontal: gutter,
        gap: space.lg,
      }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
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
      contentContainerStyle={[{ padding: gutter, paddingBottom: insets.bottom + 40, gap: space.lg }, contentStyle]}
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
          <Txt variant="eyebrow" color={color.ink3}>{title}</Txt>
          <View style={styles.sectionRule} />
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
      {header ? <Txt variant="eyebrow" color={color.ink3} style={{ marginLeft: 4 }}>{header}</Txt> : null}
      <View style={styles.group}>
        {items.map((child, i) => (
          <View key={i}>
            {i > 0 ? <Divider inset={16} /> : null}
            {child}
          </View>
        ))}
      </View>
      {footer ? <Txt variant="footnote" color={color.ink3} style={{ marginHorizontal: 4 }}>{footer}</Txt> : null}
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
    <View style={styles.rowWrap}>
      <View style={styles.row}>
        {icon ? (
          <View style={styles.rowIcon}>
            <Icon name={icon} size={18} color={destructive ? color.vermilion : color.ink2} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 1 }}>
          <Txt variant="body" color={destructive ? color.vermilion : color.ink}>{title}</Txt>
          {subtitle ? <Txt variant="footnote" color={color.ink3}>{subtitle}</Txt> : null}
        </View>
        {value ? <Txt variant="subhead" color={color.ink3} num>{value}</Txt> : null}
        {right}
        {chevron ? <Icon name="chevron-forward" size={17} color={color.ink3} /> : null}
      </View>
      {stacked ? <View style={{ marginTop: 2 }}>{stacked}</View> : null}
    </View>
  );
  if (!onPress) return content;
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
        <Icon name={icon} size={22} color={color.ink3} />
      </View>
      <Txt variant="headline" center>{title}</Txt>
      <Txt variant="subhead" color={color.ink3} center style={{ maxWidth: 300 }}>{body}</Txt>
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

/**
 * A compact metric. Flat by design: `StatGrid` draws one ledger block around
 * all of them, so four metrics read as one object instead of four cards.
 */
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {icon ? <Icon name={icon} size={13} color={color.ink3} /> : null}
        <Txt variant="eyebrow" color={color.ink3} numberOfLines={1} style={{ flexShrink: 1 }}>{label}</Txt>
      </View>
      <Txt variant="num" color={tone}>{value}</Txt>
      {sub ? <Txt variant="footnote" color={color.ink3}>{sub}</Txt> : null}
    </View>
  );
}

/**
 * One white ledger block, hairline-divided into two columns. Rows are implied
 * by position, so the block stays readable at any text size.
 */
export function StatGrid({ children }: { children: ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  const single = items.length === 1;
  return (
    <View style={styles.statGrid}>
      {items.map((child, i) => (
        <View
          key={i}
          style={[
            styles.statCell,
            single && { width: '100%' },
            i % 2 === 1 && styles.statCellLeft,
            i >= 2 && styles.statCellTop,
          ]}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 24 },
  sectionRule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: color.hair },
  group: {
    backgroundColor: color.sheet,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hair,
    overflow: 'hidden',
  },
  rowWrap: { paddingVertical: 13, paddingHorizontal: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 24 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: color.fill, alignItems: 'center', justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 30,
    paddingHorizontal: 24,
    backgroundColor: color.sheet,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hair,
  },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4 },
  stat: { gap: 3, flex: 1 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: color.sheet,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hair,
    overflow: 'hidden',
  },
  statCell: { width: '50%', padding: 14 },
  statCellLeft: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: color.hair },
  statCellTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: color.hair },
});
