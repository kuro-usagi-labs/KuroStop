import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '../common/Button';
import { HabitType } from '../../types';
import { COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';

interface UrgeInterruptionModalProps {
  visible: boolean;
  onClose: () => void;
  onResistedUrge: (
    habit: HabitType,
    durationSeconds: number,
    triggerTag?: string
  ) => Promise<void>;
  onRelapsedUrge: (
    habit: HabitType,
    triggerTag?: string
  ) => Promise<void>;
}

export const UrgeInterruptionModal: React.FC<UrgeInterruptionModalProps> = ({
  visible,
  onClose,
  onResistedUrge,
  onRelapsedUrge,
}) => {
  const [selectedHabit, setSelectedHabit] = useState<HabitType>('smoking');
  const [activeMode, setActiveMode] = useState<'idle' | 'breathing' | 'challenge'>('idle');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(90);
  const [challengeSecondsLeft, setChallengeSecondsLeft] = useState<number>(300); // 5 minutes
  const [breathPhase, setBreathPhase] = useState<'Tarik Napas...' | 'Tahan...' | 'Hembuskan...' | 'Tenang...'>('Tarik Napas...');
  const [selectedTrigger, setSelectedTrigger] = useState<string>('');

  const breathScale = useSharedValue(1);
  const breathOpacity = useSharedValue(0.4);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setActiveMode('idle');
      setBreathingSecondsLeft(90);
      setChallengeSecondsLeft(300);
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimation(breathScale);
      cancelAnimation(breathOpacity);
    }
  }, [visible]);

  // Breathing Animation Cycle
  useEffect(() => {
    if (activeMode === 'breathing') {
      // 4s Inhale, 4s Hold, 4s Exhale, 2s Rest = 14s cycle
      breathScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.4, { duration: 4000 }),
          withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 2000 })
        ),
        -1,
        false
      );

      breathOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 4000 }),
          withTiming(0.8, { duration: 4000 }),
          withTiming(0.3, { duration: 4000 }),
          withTiming(0.3, { duration: 2000 })
        ),
        -1,
        false
      );

      // Countdown timer
      timerRef.current = setInterval(() => {
        setBreathingSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          const elapsed = 90 - prev + 1;
          const cycleSec = elapsed % 14;
          if (cycleSec < 4) setBreathPhase('Tarik Napas...');
          else if (cycleSec < 8) setBreathPhase('Tahan...');
          else if (cycleSec < 12) setBreathPhase('Hembuskan...');
          else setBreathPhase('Tenang...');
          return prev - 1;
        });
      }, 1000);
    } else if (activeMode === 'challenge') {
      timerRef.current = setInterval(() => {
        setChallengeSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimation(breathScale);
      cancelAnimation(breathOpacity);
      breathScale.value = 1;
      breathOpacity.value = 0.4;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeMode]);

  const animatedOrbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breathScale.value }],
      opacity: breathOpacity.value,
    };
  });

  const handleResist = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
    const elapsed = activeMode === 'breathing' ? 90 - breathingSecondsLeft : 300 - challengeSecondsLeft;
    await onResistedUrge(selectedHabit, Math.max(15, elapsed), selectedTrigger || undefined);
    onClose();
  };

  const handleRelapse = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
    await onRelapsedUrge(selectedHabit, selectedTrigger || undefined);
    onClose();
  };

  const triggers =
    selectedHabit === 'smoking'
      ? ['Stres', 'Nongkrong', 'Ngopi', 'Setelah Makan', 'Bosan']
      : selectedHabit === 'pmo'
      ? ['Sendirian di Kamar', 'Larut Malam', 'Media Sosial', 'Kelelahan', 'Bosan']
      : ['Scrolling TikTok/Reels', 'Bekerja Terlalu Malam', 'Cemas', 'Bosan'];

  return (
    <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interupsi Dorongan</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.content}>
          {/* Habit selection */}
          <View style={styles.habitSelectorRow}>
            {[
              { type: 'smoking' as const, label: 'Rokok' },
              { type: 'pmo' as const, label: 'PMO' },
              { type: 'sleep' as const, label: 'Begadang' },
            ].map((item) => (
              <TouchableOpacity
                key={item.type}
                activeOpacity={0.7}
                onPress={() => setSelectedHabit(item.type)}
                style={[
                  styles.habitChip,
                  selectedHabit === item.type && styles.habitChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.habitChipText,
                    selectedHabit === item.type && styles.habitChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Central Breathing/Challenge Arena */}
          <View style={styles.arenaContainer}>
            <Animated.View style={[styles.breathingOrb, animatedOrbStyle]} />
            <View style={styles.centerLabels}>
              {activeMode === 'breathing' ? (
                <>
                  <Text style={styles.phaseLabel}>{breathPhase}</Text>
                  <Text style={styles.timerCountdown}>{breathingSecondsLeft}s</Text>
                  <Text style={styles.subPhaseLabel}>Tarik pelan • Tahan • Lepaskan</Text>
                </>
              ) : activeMode === 'challenge' ? (
                <>
                  <Text style={styles.phaseLabel}>Tunda 5 Menit</Text>
                  <Text style={styles.timerCountdown}>
                    {Math.floor(challengeSecondsLeft / 60)}:
                    {String(challengeSecondsLeft % 60).padStart(2, '0')}
                  </Text>
                  <Text style={styles.subPhaseLabel}>
                    Otakmu butuh jeda sebelum membuat keputusan
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.phaseLabel}>Dorongan Hanyalah Gelombang</Text>
                  <Text style={styles.arenaDescription}>
                    Dorongan impulsif mencapai puncak dalam 3–5 menit lalu mereda. Kamu tidak
                    harus melawannya secara agresif, cukup amati tanpa bertindak.
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Mode Selectors */}
          {activeMode === 'idle' ? (
            <View style={styles.modeButtonsRow}>
              <Button
                title="Latihan Napas (90 Detik)"
                variant="secondary"
                onPress={() => setActiveMode('breathing')}
                icon={<Ionicons name="leaf-outline" size={17} color={COLORS.textPrimary} />}
                style={{ flex: 1 }}
              />
              <Button
                title="Tunda 5 Menit"
                variant="secondary"
                onPress={() => setActiveMode('challenge')}
                icon={<Ionicons name="timer-outline" size={17} color={COLORS.textPrimary} />}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <Button
              title="Reset Pilihan"
              variant="ghost"
              onPress={() => setActiveMode('idle')}
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />
          )}

          {/* Trigger Tag Selection */}
          <Text style={styles.sectionHeader}>Apa pemicu dorongan ini?</Text>
          <View style={styles.triggerChipsWrap}>
            {triggers.map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.7}
                onPress={() => setSelectedTrigger(selectedTrigger === t ? '' : t)}
                style={[
                  styles.triggerChip,
                  selectedTrigger === t && styles.triggerChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.triggerText,
                    selectedTrigger === t && styles.triggerTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Outcome Decisions */}
          <View style={styles.outcomeRow}>
            <Button
              title="Aku Khilaf (Catat)"
              variant="outline"
              onPress={handleRelapse}
              style={{ flex: 1 }}
            />
            <Button
              title="Aku Berhasil Menahan"
              variant="primary"
              onPress={handleResist}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.screenPadding,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  habitSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  habitChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  habitChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  habitChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  habitChipTextActive: {
    color: '#FFFFFF',
  },
  arenaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  breathingOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.clear.primary,
  },
  centerLabels: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  timerCountdown: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -1,
    marginVertical: 4,
  },
  subPhaseLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  arenaDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  triggerChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  triggerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  triggerText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  triggerTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
