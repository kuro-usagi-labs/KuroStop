import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReduceMotion } from '@/data/hooks';
import { minutesToClock, stampLabel } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { ease, spring } from '@/theme/motion';
import { color, radius } from '@/theme/tokens';
import { Icon, PressableScale, Txt, type IconName } from './primitives';

/* ───────────────────────── Segmented control ───────────────────────── */

export function Segmented<T extends string>({
  options, value, onChange, size = 'md', style, accessibilityLabel,
}: {
  options: { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const rm = useReduceMotion();
  const [w, setW] = useState(0);
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const segW = w > 0 ? (w - 4) / options.length : 0;
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = rm ? idx * segW : withSpring(idx * segW, spring.snappy);
  }, [idx, segW, rm, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const h = size === 'md' ? 40 : 34;
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[styles.seg, { height: h }, style]}>
      {segW > 0 ? <Animated.View style={[styles.segIndicator, { width: segW, height: h - 4 }, indicator]} /> : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            haptic="tap"
            scaleTo={0.96}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={styles.segItem}>
            {o.icon ? <Icon name={o.icon} size={15} color={active ? color.ink : color.ink3} /> : null}
            <Txt variant={size === 'md' ? 'subhead' : 'footnote'} weight={active ? '700' : '500'} color={active ? color.ink : color.ink3} numberOfLines={1}>
              {o.label}
            </Txt>
          </PressableScale>
        );
      })}
    </View>
  );
}

/* ───────────────────────── Stepper ───────────────────────── */

export function Stepper({
  value, onChange, min = 0, max = 999, step = 1, format = (v: number) => String(v), label, compact,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  format?: (v: number) => string;
  label?: string;
  compact?: boolean;
}) {
  const set = (v: number) => {
    const n = Math.min(max, Math.max(min, v));
    if (n !== value) {
      haptic.tap();
      onChange(n);
    } else haptic.warning();
  };
  const size = compact ? 36 : 44;
  return (
    <View
      style={styles.stepper}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? step : -step))}>
      <PressableScale
        haptic={null}
        onPress={() => set(value - step)}
        disabled={value <= min}
        accessibilityLabel="Kurangi"
        style={[styles.stepBtn, { width: size, height: size }]}>
        <Icon name="remove" size={20} />
      </PressableScale>
      <Txt variant={compact ? 'headline' : 'title2'} num center style={{ minWidth: compact ? 56 : 72 }}>
        {format(value)}
      </Txt>
      <PressableScale
        haptic={null}
        onPress={() => set(value + step)}
        disabled={value >= max}
        accessibilityLabel="Tambah"
        style={[styles.stepBtn, { width: size, height: size }]}>
        <Icon name="add" size={20} />
      </PressableScale>
    </View>
  );
}

/** Time-of-day stepper (minutes after midnight), 15-min increments, wraps around midnight. */
export function ClockStepper({ value, onChange, label }: { value: number; onChange: (m: number) => void; label?: string }) {
  return (
    <Stepper
      value={value}
      min={-100000}
      max={100000}
      step={15}
      compact
      label={label}
      format={minutesToClock}
      onChange={(v) => onChange(((v % 1440) + 1440) % 1440)}
    />
  );
}

/* ───────────────────────── Timestamp adjuster ───────────────────────── */

export function TimeAdjuster({ value, onChange, max, label = 'Waktu' }: {
  value: number;
  onChange: (ts: number) => void;
  max?: number;
  label?: string;
}) {
  const shift = (min: number) => {
    const limit = max ?? Date.now();
    const next = Math.min(limit, value + min * 60_000);
    haptic.tap();
    onChange(next);
  };
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="subhead" color={color.ink3}>{label}</Txt>
        <Txt variant="headline" num accessibilityLabel={`${label} ${stampLabel(value)}`}>{stampLabel(value)}</Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[
          ['−1j', -60],
          ['−15m', -15],
          ['+15m', 15],
          ['+1j', 60],
        ].map(([l, m]) => (
          <PressableScale
            key={l as string}
            haptic={null}
            onPress={() => shift(m as number)}
            accessibilityLabel={`Geser ${l}`}
            style={styles.timeBtn}>
            <Txt variant="footnote" weight="600" num>{l as string}</Txt>
          </PressableScale>
        ))}
        <PressableScale haptic="tap" onPress={() => onChange(Math.min(max ?? Date.now(), Date.now()))} style={[styles.timeBtn, { flex: 1.3 }]}>
          <Txt variant="footnote" weight="600">Sekarang</Txt>
        </PressableScale>
      </View>
    </View>
  );
}

/* ───────────────────────── Progress bar with target notch ───────────────────────── */

export function ProgressBar({
  value, target, max, tone = color.ink, overTone = color.vermilion, height = 8, track = color.fill,
}: {
  value: number;
  target: number;
  max?: number;
  tone?: string;
  overTone?: string;
  height?: number;
  track?: string;
}) {
  const rm = useReduceMotion();
  const cap = Math.max(max ?? Math.max(target * 1.6, value, 1), 1);
  const within = Math.min(value, target) / cap;
  const over = Math.max(0, value - target) / cap;
  const a = useSharedValue(0);
  const b = useSharedValue(0);
  useEffect(() => {
    const cfg = { duration: rm ? 0 : 520, easing: ease.out };
    a.value = withTiming(within, cfg);
    b.value = withTiming(Math.min(over, 1 - within), cfg);
  }, [within, over, rm, a, b]);
  const sa = useAnimatedStyle(() => ({ width: `${a.value * 100}%` }));
  const sb = useAnimatedStyle(() => ({ width: `${b.value * 100}%` }));
  const targetPos = Math.min(1, target / cap);
  return (
    <View style={{ height: height + 6, justifyContent: 'center' }} importantForAccessibility="no-hide-descendants">
      <View style={{ height, borderRadius: height, backgroundColor: track, flexDirection: 'row', overflow: 'hidden' }}>
        <Animated.View style={[{ backgroundColor: tone }, sa]} />
        <Animated.View style={[{ backgroundColor: overTone }, sb]} />
      </View>
      {target > 0 ? (
        <View style={[styles.notch, { left: `${targetPos * 100}%`, height: height + 6 }]} />
      ) : null}
    </View>
  );
}

/* ───────────────────────── Toggle ───────────────────────── */

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch
      value={value}
      accessibilityLabel={label}
      onValueChange={(v) => {
        haptic.tap();
        onChange(v);
      }}
      trackColor={{ true: color.ink, false: color.fillStrong }}
      thumbColor={color.white}
      ios_backgroundColor={color.fillStrong}
    />
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    backgroundColor: color.fill,
    borderRadius: radius.sm,
    padding: 2,
  },
  segIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: color.sheet,
    borderRadius: radius.sm - 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segItem: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { borderRadius: 999, backgroundColor: color.fill, alignItems: 'center', justifyContent: 'center' },
  timeBtn: {
    flex: 1,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: color.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notch: { position: 'absolute', width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: color.ink },
});
