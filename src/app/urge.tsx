/**
 * URGE INTERVENTION — the screen someone opens mid-craving.
 *
 * Design rule for this screen: one decision at a time. While a tool is running
 * the rest of the controls disappear, so the only thing on screen is the timer
 * and a way out. Colour stays quiet — an urge is not a recorded failure, so the
 * "gave in" path is a neutral ghost button, not a red one.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { useApp } from '@/data/store';
import { useReduceMotion, useToday } from '@/data/hooks';
import { URGE_LINES } from '@/data/messages';
import { type Habit } from '@/data/types';
import { mmss } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { ease } from '@/theme/motion';
import { color, space } from '@/theme/tokens';
import { Segmented } from '@/components/ui/controls';
import { Screen, Section } from '@/components/ui/layout';
import { Button, Card, Chip, IconButton, Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

type UrgeMode = 'idle' | 'breath' | 'delay';

const BREATH_SECONDS = 90;
const DELAY_SECONDS = 300;
const TRIGGERS = ['Stres', 'Bosan', 'Lelah', 'Emosi', 'Medsos', 'Kesepian'];

export default function UrgeScreen() {
  const params = useLocalSearchParams<{ habit?: string }>();
  const { actions } = useApp();
  const { settings } = useToday();
  const rm = useReduceMotion();
  const toast = useToast();

  const [habit, setHabit] = useState<Habit>((params.habit as Habit) || 'smoke');
  const [mode, setMode] = useState<UrgeMode>('idle');
  const [delaySec, setDelaySec] = useState<number>(DELAY_SECONDS);
  const [breathRemaining, setBreathRemaining] = useState<number>(BREATH_SECONDS);
  const [selectedTrigger, setSelectedTrigger] = useState<string | undefined>();

  const habitOptions: { value: Habit; label: string }[] = [
    { value: 'smoke', label: 'Rokok' },
    { value: 'pmo', label: 'PMO' },
    { value: 'sleep', label: 'Begadang' },
  ];

  // One line, drawn per mount, so it never reads like a fixed slogan.
  const [quoteSeed] = useState(() => Math.random());
  const urgeQuote = useMemo(() => {
    const list = URGE_LINES[settings.intensity] || URGE_LINES.brutal;
    return list[Math.floor(quoteSeed * list.length) % list.length];
  }, [settings.intensity, quoteSeed]);

  /* ── Breathing animation: 4 s in · 4 s hold · 4 s out ── */
  const breathScale = useSharedValue(1);
  useEffect(() => {
    if (mode === 'breath' && !rm) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: ease.inOut }),
          withTiming(1.3, { duration: 4000 }),
          withTiming(1, { duration: 4000, easing: ease.inOut }),
        ),
        -1,
        false,
      );
    } else {
      breathScale.value = withTiming(1, { duration: 300 });
    }
  }, [mode, rm, breathScale]);

  /* ── Countdowns ── */
  useEffect(() => {
    if (mode !== 'breath') return;
    let left = BREATH_SECONDS;
    const id = setInterval(() => {
      left -= 1;
      setBreathRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        setMode('idle');
        haptic.success();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'delay') return;
    let left = DELAY_SECONDS;
    const id = setInterval(() => {
      left -= 1;
      setDelaySec(left);
      if (left <= 0) {
        clearInterval(id);
        setMode('idle');
        haptic.success();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [mode]);

  const breathPhase = useMemo(() => {
    const cycle = (BREATH_SECONDS - breathRemaining) % 12;
    if (cycle < 4) return 'Tarik napas';
    if (cycle < 8) return 'Tahan';
    return 'Hembuskan';
  }, [breathRemaining]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  const startBreath = () => {
    setBreathRemaining(BREATH_SECONDS);
    setMode('breath');
  };

  const startDelay = () => {
    setDelaySec(DELAY_SECONDS);
    setMode('delay');
  };

  const stopTool = () => setMode('idle');

  const handleResisted = async () => {
    try {
      await actions.add({
        kind: 'urge',
        at: Date.now(),
        habit,
        outcome: 'resisted',
        method: mode === 'breath' ? 'breath' : mode === 'delay' ? 'delay' : 'none',
        trigger: selectedTrigger,
      });
      toast({
        title: 'Dorongan ditahan',
        body: 'Satu kemenangan kecil yang tetap dihitung.',
        icon: 'shield-checkmark',
        tone: color.jade,
      });
      haptic.success();
      router.back();
    } catch (err) {
      toast({
        title: 'Gagal mencatat',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  };

  const handleGaveIn = async () => {
    try {
      await actions.add({
        kind: 'urge',
        at: Date.now(),
        habit,
        outcome: 'gave_in',
        method: mode === 'breath' ? 'breath' : mode === 'delay' ? 'delay' : 'none',
        trigger: selectedTrigger,
      });
    } catch (err) {
      console.error('Failed to log gave_in urge:', err);
    }
    router.replace(`/log?habit=${habit}`);
  };

  return (
    <Screen
      title="Gue Lagi Pengen..."
      eyebrow="INTERVENSI DORONGAN"
      hasTabBar={false}
      right={<IconButton icon="close" label="Keluar" tone="fill" onPress={() => router.back()} />}
    >
      {mode === 'idle' ? (
        <>
          <Segmented options={habitOptions} value={habit} onChange={setHabit} />

          <Card style={styles.quote}>
            <Txt variant="eyebrow" color={color.ink3}>PENGINGAT</Txt>
            <Txt variant="headline" weight="600">
              &ldquo;{urgeQuote}&rdquo;
            </Txt>
          </Card>

          <Section title="Pilih satu langkah" index={0}>
            <View style={styles.actions}>
              <Button
                label="Tarik Napas 90 Detik"
                icon="leaf-outline"
                onPress={startBreath}
                accessibilityHint="Mulai latihan pernapasan terpandu"
              />
              <Button
                label="Tunda 5 Menit"
                icon="hourglass-outline"
                variant="secondary"
                onPress={startDelay}
                accessibilityHint="Jalankan hitungan mundur lima menit"
              />
            </View>
          </Section>

          <Section title="Pemicunya (opsional)" index={1}>
            <View style={styles.chips}>
              {TRIGGERS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={selectedTrigger === t}
                  onPress={() => setSelectedTrigger(selectedTrigger === t ? undefined : t)}
                />
              ))}
            </View>
          </Section>

          <Section title="Setelah itu" index={2}>
            <View style={styles.actions}>
              <Button
                label="Gue Tahan"
                icon="shield-checkmark-outline"
                onPress={handleResisted}
                accessibilityHint="Catat bahwa dorongan berhasil ditahan"
              />
              <Button
                label="Catat Kejadian"
                icon="create-outline"
                variant="ghost"
                onPress={handleGaveIn}
                accessibilityHint="Buka form pencatatan kejadian"
              />
            </View>
          </Section>
        </>
      ) : null}

      {mode === 'breath' ? (
        <Card style={styles.tool}>
          <Txt variant="eyebrow" color={color.ink3}>LATIHAN NAPAS 90 DETIK</Txt>
          <View style={styles.breathStage}>
            <View style={[styles.breathRing, { opacity: rm ? 1 : 0.5 }]} />
            <Animated.View style={[styles.breathCircle, circleStyle]} />
            <View style={styles.breathLabel}>
              <Txt variant="title2" weight="600" center>{breathPhase}</Txt>
              <Txt variant="footnote" color={color.ink3} center num>
                {breathRemaining} detik
              </Txt>
            </View>
          </View>
          <Txt variant="subhead" color={color.ink3} center>
            Ikuti lingkarannya. Tarik empat detik, tahan empat, hembuskan empat.
          </Txt>
          <Button label="Lewati Latihan" variant="ghost" size="md" onPress={stopTool} />
        </Card>
      ) : null}

      {mode === 'delay' ? (
        <Card style={styles.tool}>
          <Txt variant="eyebrow" color={color.ink3}>TANTANGAN TUNDA 5 MENIT</Txt>
          <Txt variant="hero" center num accessibilityLabel={`Sisa ${delaySec} detik`}>
            {mmss(delaySec)}
          </Txt>
          <Txt variant="subhead" color={color.ink3} center>
            Dorongan biasanya memuncak dalam 3–5 menit lalu mereda. Tunggu sampai hitungan selesai.
          </Txt>
          <Button label="Hentikan Timer" variant="ghost" size="md" onPress={stopTool} />
        </Card>
      ) : null}

      <View style={styles.note}>
        <Txt variant="footnote" color={color.ink3} center>
          Mengalami dorongan bukan berarti lo gagal. Kalau dorongannya sudah lewat, lo bisa menutup layar ini tanpa mencatat apa pun.
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  quote: { gap: 6 },
  actions: { gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  tool: { alignItems: 'center', gap: space.md, paddingVertical: 22 },
  breathStage: {
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  breathRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: color.jade,
  },
  breathCircle: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: color.jadeTint,
    borderWidth: 1,
    borderColor: color.jade,
  },
  breathLabel: { alignItems: 'center', gap: 2 },
  note: { paddingHorizontal: space.sm, paddingTop: space.xs },
});
