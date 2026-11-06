import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { useApp } from '@/data/store';
import { useReduceMotion, useToday } from '@/data/hooks';
import { URGE_LINES } from '@/data/messages';
import { HABIT_META, type Habit } from '@/data/types';
import { mmss } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { ease } from '@/theme/motion';
import { color, radius, space } from '@/theme/tokens';
import { Segmented } from '@/components/ui/controls';
import {
  Group, Screen, Section,
} from '@/components/ui/layout';
import { Button, Card, Chip, IconButton, Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

type UrgeMode = 'idle' | 'breath' | 'delay';

export default function UrgeScreen() {
  const params = useLocalSearchParams<{ habit?: string }>();
  const { actions } = useApp();
  const { settings } = useToday();
  const rm = useReduceMotion();
  const toast = useToast();

  const [habit, setHabit] = useState<Habit>((params.habit as Habit) || 'smoke');
  const [mode, setMode] = useState<UrgeMode>('idle');
  const [delaySec, setDelaySec] = useState<number>(300); // 5 minutes
  const [breathPhase, setBreathPhase] = useState<'Tarik Napas' | 'Tahan' | 'Hembuskan'>('Tarik Napas');
  const [breathRemaining, setBreathRemaining] = useState<number>(90); // 90-sec session
  const [selectedTrigger, setSelectedTrigger] = useState<string | undefined>();

  // Habit selection tabs
  const habitOptions: { value: Habit; label: string }[] = [
    { value: 'smoke', label: 'Rokok' },
    { value: 'pmo', label: 'PMO' },
    { value: 'sleep', label: 'Begadang' },
  ];

  // Common quick triggers
  const triggers = ['Stres', 'Bosan', 'Lelah', 'Emosi', 'Medsos', 'Kesepian'];

  // Motivational line from settings intensity (seeded per mount/intensity)
  const [urgeQuote, setUrgeQuote] = useState(() => {
    const list = URGE_LINES[settings.intensity] || URGE_LINES.brutal;
    return list[0];
  });

  useEffect(() => {
    const list = URGE_LINES[settings.intensity] || URGE_LINES.brutal;
    const randomItem = list[Math.floor(Math.random() * list.length)];
    setUrgeQuote(randomItem);
  }, [settings.intensity]);

  // Breathing animation (circle scale)
  const breathScale = useSharedValue(1);
  useEffect(() => {
    if (mode === 'breath' && !rm) {
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 4000, easing: ease.inOut }), // tarik 4s
          withTiming(1.4, { duration: 4000 }), // tahan 4s
          withTiming(1.0, { duration: 4000, easing: ease.inOut }), // hembus 4s
        ),
        -1,
        false,
      );
    } else {
      breathScale.value = withTiming(1, { duration: 300 });
    }
  }, [mode, rm, breathScale]);

  // Breathing timer & phase switcher
  useEffect(() => {
    if (mode !== 'breath') return;
    const interval = setInterval(() => {
      setBreathRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMode('idle');
          haptic.success();
          return 0;
        }
        const cycle = (90 - prev) % 12;
        if (cycle < 4) setBreathPhase('Tarik Napas');
        else if (cycle < 8) setBreathPhase('Tahan');
        else setBreathPhase('Hembuskan');
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // 5-minute countdown timer
  useEffect(() => {
    if (mode !== 'delay') return;
    const interval = setInterval(() => {
      setDelaySec((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMode('idle');
          haptic.success();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  // Circle animated style
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  // Successful urge resistance
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
        title: 'Dorongan Berhasil Ditahan!',
        body: 'Hebat! Satu kemenangan kecil untuk disiplin lo hari ini.',
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

  // User surrendered to urge
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
    // Direct them to log screen to truthfully record the event
    router.replace(`/log?habit=${habit}`);
  };

  return (
    <Screen
      title="Gue Lagi Pengen..."
      eyebrow="INTERVENSI DORONGAN"
      right={
        <IconButton
          icon="close"
          label="Keluar"
          tone="fill"
          onPress={() => router.back()}
        />
      }
    >
      {/* Habit Selector */}
      <Segmented
        options={habitOptions}
        value={habit}
        onChange={setHabit}
      />

      {/* Quote Banner */}
      <Card style={{ backgroundColor: color.sheet }}>
        <View style={{ gap: 6 }}>
          <Txt variant="caption" color={color.ink3} weight="700">PENGINGAT TEGAS</Txt>
          <Txt variant="headline" color={color.ink} weight="600">
            &ldquo;{urgeQuote}&rdquo;
          </Txt>
        </View>
      </Card>

      {/* Breathing Experience View */}
      {mode === 'breath' && (
        <Card>
          <View style={styles.centerContainer}>
            <Txt variant="caption" color={color.ink3}>LATIHAN NAPAS 90 DETIK</Txt>
            <Txt variant="title2" weight="700" color={color.jade}>
              {breathPhase}
            </Txt>
            <View style={styles.breathCircleWrapper}>
              <Animated.View style={[styles.breathCircle, circleStyle]} />
            </View>
            <Txt variant="num" color={color.ink3}>
              Sisa {breathRemaining} detik
            </Txt>
            <Button
              label="Selesai Latihan"
              variant="ghost"
              size="sm"
              onPress={() => setMode('idle')}
            />
          </View>
        </Card>
      )}

      {/* 5-Minute Delay Challenge View */}
      {mode === 'delay' && (
        <Card>
          <View style={styles.centerContainer}>
            <Txt variant="caption" color={color.ink3}>TANTANGAN TUNDA 5 MENIT</Txt>
            <Txt variant="hero" color={color.amber}>
              {mmss(delaySec)}
            </Txt>
            <Txt variant="subhead" color={color.ink2} center style={{ maxWidth: 280 }}>
              Dorongan neurokimiawi umumnya mencapai puncak dalam 3–5 menit lalu mereda. Tunggu sampai hitungan selesai.
            </Txt>
            <Button
              label="Hentikan Timer"
              variant="ghost"
              size="sm"
              onPress={() => setMode('idle')}
            />
          </View>
        </Card>
      )}

      {/* Interruption Tools */}
      {mode === 'idle' && (
        <Section title="Alat Bantu Kendali">
          <View style={{ gap: 10 }}>
            <Button
              label="Latihan Napas 90 Detik"
              icon="leaf-outline"
              variant="secondary"
              onPress={() => {
                setBreathRemaining(90);
                setMode('breath');
              }}
            />
            <Button
              label="Tantangan Tunda 5 Menit"
              icon="hourglass-outline"
              variant="secondary"
              onPress={() => {
                setDelaySec(300);
                setMode('delay');
              }}
            />
          </View>
        </Section>
      )}

      {/* Trigger Selector */}
      <Section title="Apa Pemicunya? (Opsional)">
        <View style={styles.chipsWrap}>
          {triggers.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={selectedTrigger === t}
              onPress={() => setSelectedTrigger(selectedTrigger === t ? undefined : t)}
            />
          ))}
        </View>
      </Section>

      {/* Resolution Actions */}
      <Section title="Keputusan Akhir">
        <View style={{ gap: 10 }}>
          <Button
            label="Gue Berhasil Tahan! (Catat Kemenangan)"
            icon="shield-checkmark"
            variant="accent"
            accent={color.jade}
            onPress={handleResisted}
          />
          <Button
            label="Gue Kalah / Catat Kejadian"
            icon="close-circle-outline"
            variant="danger"
            onPress={handleGaveIn}
          />
        </View>
      </Section>

      {/* Safe Exit Note */}
      <View style={styles.noteBox}>
        <Txt variant="caption" color={color.ink3} center>
          Mengalami dorongan bukan berarti lo gagal atau relapse. Jika dorongan sudah lewat dengan sendirinya, lo bisa langsung menutup layar ini tanpa penalti apapun.
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 14,
  },
  breathCircleWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  breathCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: color.jadeTint,
    borderWidth: 2,
    borderColor: color.jade,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  noteBox: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
