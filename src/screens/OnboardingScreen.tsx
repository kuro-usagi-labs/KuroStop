import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { AccountabilityLevel } from '../types';
import { formatIDR } from '../utils/currency';

interface OnboardingScreenProps {
  onComplete: (config: {
    dailyBaseline: number;
    targetBedtime: string;
    targetWakeTime: string;
    intensity: AccountabilityLevel;
  }) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  const [dailyBaseline, setDailyBaseline] = useState<number>(30000);
  const [targetBedtime, setTargetBedtime] = useState<string>('23:00');
  const [targetWakeTime, setTargetWakeTime] = useState<string>('06:00');
  const [intensity, setIntensity] = useState<AccountabilityLevel>('brutal');

  const triggerHaptic = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleNext = () => {
    triggerHaptic();
    if (step < 5) {
      setStep(step + 1);
    } else {
      onComplete({
        dailyBaseline,
        targetBedtime,
        targetWakeTime,
        intensity,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brandTitle}>KUROSTOP</Text>
        <Text style={styles.stepIndicator}>Langkah {step} dari 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>SISTEM DISIPLIN PRIBADI</Text>
            </View>
            <Text style={styles.mainTitle}>Setiap Keputusan Meninggalkan Bekas.</Text>
            <Text style={styles.bodyText}>
              KuroStop bukan aplikasi motivasi manis. Ini adalah sistem pengawas pribadi yang
              membuat konsekuensi tindakanmu nyata secara visual.
            </Text>
            <View style={styles.triadCard}>
              <Text style={styles.triadTitle}>Tiga Kebiasaan Sasaran:</Text>
              <Text style={styles.triadItem}>1. Merokok & Pemborosan Uang</Text>
              <Text style={styles.triadItem}>2. Pornografi & Masturbasi (PMO)</Text>
              <Text style={styles.triadItem}>3. Begadang Melewati Jam Tidur</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.mainTitle}>Baseline Pengeluaran Rokok</Text>
            <Text style={styles.bodyText}>
              Berapa rata-rata uang yang biasanya kamu bakar untuk rokok setiap hari? Ini menjadi
              patokan matematis penghematanmu.
            </Text>

            <View style={styles.optionsWrap}>
              {[15000, 25000, 30000, 45000, 60000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    setDailyBaseline(amount);
                  }}
                  style={[
                    styles.choiceCard,
                    dailyBaseline === amount && styles.choiceCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceCardTitle,
                      dailyBaseline === amount && styles.choiceCardTitleActive,
                    ]}
                  >
                    {formatIDR(amount)} / hari
                  </Text>
                  <Text style={styles.choiceCardSub}>
                    ~ {formatIDR(amount * 30)} per bulan
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.mainTitle}>Target Waktu Tidur</Text>
            <Text style={styles.bodyText}>
              Pukul berapa kamu harus sudah tidur? Begadang malam hari merusak fokus dan
              merupakan pemicu utama kompromi PMO & rokok.
            </Text>

            <View style={styles.optionsWrap}>
              {['22:00', '22:30', '23:00', '23:30', '00:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    setTargetBedtime(time);
                  }}
                  style={[
                    styles.choiceCard,
                    targetBedtime === time && styles.choiceCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceCardTitle,
                      targetBedtime === time && styles.choiceCardTitleActive,
                    ]}
                  >
                    Pukul {time}
                  </Text>
                  <Text style={styles.choiceCardSub}>
                    Lewat dari ini = visual atmosphere memburuk
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.mainTitle}>Intensitas Kejujuran</Text>
            <Text style={styles.bodyText}>
              Pilih gaya bahasa akuntabilitas pribadi saat target dilanggar.
            </Text>

            <View style={styles.optionsWrap}>
              {[
                {
                  id: 'brutal' as const,
                  title: 'Brutal (Direkomendasikan)',
                  desc: 'Keras, tanpa kompromi, langsung menampar kenyataan keputusanmu.',
                },
                {
                  id: 'strict' as const,
                  title: 'Tegas / Disiplin',
                  desc: 'Pengingat langsung dan tegas mengenai komitmenmu.',
                },
                {
                  id: 'normal' as const,
                  title: 'Netral',
                  desc: 'Pemberitahuan objektif berbasis angka dan data.',
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic();
                    setIntensity(item.id);
                  }}
                  style={[
                    styles.choiceCard,
                    intensity === item.id && styles.choiceCardActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceCardTitle,
                      intensity === item.id && styles.choiceCardTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.choiceCardSub}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.mainTitle}>Komitmen Dimulai Sekarang</Text>
            <Text style={styles.bodyText}>
              Aplikasi ini 100% tersimpan lokal di perangkatmu. Tanpa akun, tanpa cloud, tanpa
              penghakiman dari orang lain — hanya kamu dan hasil nyata dari pilihanmu.
            </Text>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Aturan Pribadimu:</Text>
              <Text style={styles.summaryItem}>• Target Merokok: 0 batang/hari</Text>
              <Text style={styles.summaryItem}>• Target PMO: 0 sesi/hari</Text>
              <Text style={styles.summaryItem}>• Target Jam Tidur: {targetBedtime}</Text>
              <Text style={styles.summaryItem}>• Baseline Rokok: {formatIDR(dailyBaseline)}/hari</Text>
              <Text style={styles.summaryItem}>• Kejujuran: {intensity.toUpperCase()}</Text>
            </Card>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title={step === 5 ? 'Masuk ke Sistem KuroStop' : 'Lanjutkan'}
          variant="primary"
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSubtle,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 24,
    paddingBottom: 40,
  },
  stepContainer: {
    minHeight: 400,
  },
  heroBadge: {
    backgroundColor: COLORS.clear.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.clear.border,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.clear.primary,
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  triadCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  triadItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  optionsWrap: {
    gap: 10,
  },
  choiceCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  choiceCardActive: {
    borderColor: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceActive,
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  choiceCardTitleActive: {
    color: COLORS.textPrimary,
  },
  choiceCardSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  summaryItem: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderSubtle,
    backgroundColor: COLORS.background,
  },
  nextButton: {
    minHeight: 52,
  },
});
