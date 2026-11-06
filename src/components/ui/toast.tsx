import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReduceMotion } from '@/data/hooks';
import { color, radius, shadow } from '@/theme/tokens';
import { Icon, PressableScale, Txt, type IconName } from './primitives';

type Toast = { id: number; title: string; body?: string; icon?: IconName; tone?: string; undo?: () => void };
type Ctx = {
  toast: Toast | null;
  show: (t: Omit<Toast, 'id'>) => void;
  dismiss: () => void;
  hosts: string[];
  register: (id: string) => () => void;
};

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [hosts, setHosts] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismiss = useCallback(() => setToast(null), []);
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    AccessibilityInfo.announceForAccessibility(`${t.title}${t.body ? `. ${t.body}` : ''}`);
    timer.current = setTimeout(() => setToast(null), t.undo ? 5000 : 2600);
  }, []);
  const register = useCallback((id: string) => {
    setHosts((h) => [...h, id]);
    return () => setHosts((h) => h.filter((x) => x !== id));
  }, []);
  const value = useMemo(() => ({ toast, show, dismiss, hosts, register }), [toast, show, dismiss, hosts, register]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.show;
}

/**
 * Renders the active toast. Several hosts can be mounted (root + modals);
 * only the most recently mounted one draws, so a toast is never hidden
 * behind a native modal.
 */
export function ToastHost({ bottom = 96 }: { bottom?: number }) {
  const ctx = useContext(ToastContext)!;
  const id = useId();
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const { register } = ctx;
  useEffect(() => register(id), [register, id]);
  const active = ctx.hosts[ctx.hosts.length - 1] === id;
  const t = ctx.toast;
  if (!active || !t) return null;
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', paddingBottom: insets.bottom + bottom }]}>
      <Animated.View
        key={t.id}
        entering={rm ? FadeIn.duration(120) : FadeInDown.springify().damping(18).stiffness(220)}
        exiting={rm ? FadeOut.duration(100) : FadeOutDown.duration(180)}
        style={styles.toast}
        accessibilityLiveRegion="polite">
        <View style={[styles.dot, { backgroundColor: t.tone ?? color.jade }]}>
          <Icon name={t.icon ?? 'checkmark'} size={16} color={color.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="subhead" weight="600" color={color.white} numberOfLines={2}>{t.title}</Txt>
          {t.body ? <Txt variant="footnote" color="#C9CDD2" numberOfLines={2}>{t.body}</Txt> : null}
        </View>
        {t.undo ? (
          <PressableScale
            haptic="medium"
            accessibilityLabel="Batalkan catatan terakhir"
            onPress={() => {
              t.undo?.();
              ctx.dismiss();
            }}
            style={styles.undo}>
            <Icon name="arrow-undo" size={14} color={color.ink} />
            <Txt variant="footnote" weight="700">Batal</Txt>
          </PressableScale>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: radius.lg,
    backgroundColor: color.ink,
    ...shadow.float,
  },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  undo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: color.white,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
});
