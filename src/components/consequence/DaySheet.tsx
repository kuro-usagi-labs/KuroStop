import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, ZoomIn, FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Txt } from '@/components/ui/primitives';
import { useReduceMotion } from '@/data/hooks';
import { hashString, mulberry32 } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { ease, spring } from '@/theme/motion';
import { color, radius, shadow, zones, type Zone } from '@/theme/tokens';

/* ───────────────────────── Ink blot geometry ───────────────────────── */

function blotGeometry(seed: number, r: number) {
  const rnd = mulberry32(seed);
  const c = r * 2;
  const n = 9 + Math.floor(rnd() * 4);
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.45;
    const rr = r * (0.68 + rnd() * 0.46);
    return [c + Math.cos(a) * rr, c + Math.sin(a) * rr] as const;
  });
  const mid = (p: readonly number[], q: readonly number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  let d = `M ${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  const drops = Array.from({ length: 2 + Math.floor(rnd() * 4) }, () => {
    const a = rnd() * Math.PI * 2;
    const dist = r * (1.15 + rnd() * 0.55);
    return { cx: c + Math.cos(a) * dist, cy: c + Math.sin(a) * dist, r: r * (0.05 + rnd() * 0.1) };
  });
  return { d: `${d} Z`, drops };
}

export type Mark = { id: string; weight: number };

const InkBlot = memo(function InkBlot({
  mark, w, h, fill, opacity, reduce, order,
}: { mark: Mark; w: number; h: number; fill: string; opacity: number; reduce: boolean; order: number }) {
  const seed = hashString(mark.id);
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const r = Math.min(w, h) * (0.11 + Math.min(mark.weight, 3) * 0.05 + rnd() * 0.05);
  const x = w * (0.1 + rnd() * 0.8);
  const y = h * (0.12 + rnd() * 0.76);
  const geo = useMemo(() => blotGeometry(seed, r), [seed, r]);
  return (
    <Animated.View
      entering={reduce ? FadeIn.duration(150) : ZoomIn.springify().damping(12).stiffness(120).delay(Math.min(order, 6) * 50)}
      style={{ position: 'absolute', left: x - r * 2, top: y - r * 2, width: r * 4, height: r * 4 }}>
      <Svg width={r * 4} height={r * 4}>
        <Path d={geo.d} fill={fill} opacity={opacity} />
        {geo.drops.map((dr, i) => (
          <Circle key={i} cx={dr.cx} cy={dr.cy} r={dr.r} fill={fill} opacity={opacity * 1.3} />
        ))}
      </Svg>
    </Animated.View>
  );
});

/* ───────────────────────── Zone seal (hanko-style stamp) ───────────────────────── */

export function ZoneSeal({ zone, size = 72 }: { zone: Zone; size?: number }) {
  const rm = useReduceMotion();
  const z = zones[zone];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isFirstRef = useRef(true);
  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    if (zone === 'clear') haptic.success();
    else if (zone === 'warning') haptic.warning();
    else haptic.error();
    if (rm) return;
    opacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 140 }));
    scale.value = withSequence(withTiming(1.7, { duration: 0 }), withSpring(1, spring.stamp));
    // isFirstRef/opacity/scale are stable; we only react to zone changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ rotate: '-12deg' }, { scale: scale.value }] }));
  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Zona saat ini: ${z.label}`}
      style={[{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderColor: z.accent, alignItems: 'center', justifyContent: 'center' }, aStyle]}>
      <View style={{ position: 'absolute', width: size - 8, height: size - 8, borderRadius: size, borderWidth: 1, borderColor: z.accent, opacity: 0.55, borderStyle: 'dashed' }} />
      <Txt variant="caption" weight="700" color={z.accent} style={{ fontSize: 11, letterSpacing: 1.4 }}>ZONA</Txt>
      <Txt variant="footnote" weight="700" color={z.accent} style={{ letterSpacing: 0.6, fontSize: 13 }}>
        {z.stamp}
      </Txt>
    </Animated.View>
  );
}

/* ───────────────────────── Day sheet — the signature element ───────────────────────── */

export function DaySheet({
  zone, eyebrow, headline, body, marks, footer, simulated,
}: {
  zone: Zone;
  eyebrow: string;
  headline: string;
  body: string;
  marks: Mark[];
  footer?: ReactNode;
  simulated?: boolean;
}) {
  const rm = useReduceMotion();
  const z = zones[zone];
  const [size, setSize] = useState({ w: 0, h: 0 });
  const p = useSharedValue(z.index);
  useEffect(() => {
    p.value = withTiming(z.index, { duration: rm ? 0 : 700, easing: ease.inOut });
  }, [z.index, rm, p]);
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1, 2, 3], [zones.clear.sheet, zones.warning.sheet, zones.danger.sheet, zones.critical.sheet]),
  }));
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (rm || marks.length === 0) return;
    pulse.value = withSequence(withTiming(1, { duration: 90 }), withDelay(60, withTiming(0, { duration: 420 })));
  }, [marks.length, rm, pulse]);
  const shake = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pulse.value * 0.012 }] }));

  return (
    <Animated.View style={[styles.sheet, bg, shake]} onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* Ink layer — every recorded violation leaves a stain. Decorative only. */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: radius.xl }]} pointerEvents="none" importantForAccessibility="no-hide-descendants">
        {size.w > 0
          ? marks.map((m, i) => (
              <InkBlot key={m.id} mark={m} w={size.w} h={size.h} fill={z.stain} opacity={z.stainOpacity} reduce={rm} order={i} />
            ))
          : null}
      </View>

      <View style={styles.top}>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="eyebrow" color={z.sub}>{eyebrow}</Txt>
          {simulated ? (
            <View style={[styles.sim, { borderColor: z.sub }]}>
              <Txt variant="caption" weight="700" color={z.sub} style={{ fontSize: 11, letterSpacing: 0.6 }}>SIMULASI</Txt>
            </View>
          ) : null}
        </View>
        <ZoneSeal zone={zone} />
      </View>

      <View style={{ gap: 6, marginTop: 2 }} accessible accessibilityRole="summary" accessibilityLabel={`${headline}. ${body}`}>
        <Txt variant="title" color={z.text}>{headline}</Txt>
        <Txt variant="subhead" color={z.sub}>{body}</Txt>
      </View>

      <View style={styles.tally} accessible accessibilityLabel={`${marks.length} tanda tercatat hari ini`}>
        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1 }}>
          {marks.length === 0 ? (
            <View style={[styles.tick, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: z.sub, opacity: 0.5 }]} />
          ) : (
            marks.slice(0, 14).map((m) => <View key={m.id} style={[styles.tick, { backgroundColor: z.text, opacity: 0.85 }]} />)
          )}
          {marks.length > 14 ? <Txt variant="caption" color={z.sub}>+{marks.length - 14}</Txt> : null}
        </View>
        <Txt variant="footnote" weight="600" color={z.sub} num>
          {marks.length === 0 ? 'Belum ada tanda' : `${marks.length} tanda`}
        </Txt>
      </View>
      {footer ? <View style={[styles.footer, { borderTopColor: zone === 'critical' ? '#3A2A2D' : color.hair }]}>{footer}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderRadius: radius.xl, padding: 18, gap: 12, ...shadow.sheet, minHeight: 250 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sim: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderStyle: 'dashed' },
  tally: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 'auto' },
  tick: { width: 8, height: 8, borderRadius: 4 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
});
