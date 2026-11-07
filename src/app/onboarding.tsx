import { useState, useEffect } from 'react';
import { logMilestone } from '@/lib/milestone';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/data/store';
import { SAMPLE_BY_INTENSITY } from '@/data/messages';
import { DEFAULT_SETTINGS, type Habit, type Intensity, type Settings } from '@/data/types';
import { minutesToClock, rupiah } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { color, radius, space } from '@/theme/tokens';
import { ClockStepper, Stepper, Toggle } from '@/components/ui/controls';
import { Button, Card, Divider, IconButton, PressableScale, Txt } from '@/components/ui/primitives';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { actions } = useApp();

  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    logMilestone('FIRST_SCREEN_RENDERED', { screen: 'onboarding', returningUser: false });
    logMilestone('ONBOARDING_SCREEN_MOUNTED');
  }, []);

  const handleQuickStart = async () => {
    haptic.success();
    await actions.completeOnboarding(DEFAULT_SETTINGS, false);
    router.replace('/');
  };

  // Form state initialized from DEFAULT_SETTINGS
  const [habits, setHabits] = useState<Record<Habit, boolean>>({
    smoke: true,
    pmo: true,
    sleep: true,
  });
  const [smokeTarget, setSmokeTarget] = useState<number>(5);
  const [pmoTarget, setPmoTarget] = useState<number>(0);
  const [bedtime, setBedtime] = useState<number>(23 * 60);
  const [wake, setWake] = useState<number>(6 * 60 + 30);
  const [baselinePerDay, setBaselinePerDay] = useState<number>(12);
  const [packPrice, setPackPrice] = useState<number>(34000);
  const [packSize, setPackSize] = useState<number>(16);
  const [intensity, setIntensity] = useState<Intensity>('brutal');
  const [withDemo, setWithDemo] = useState<boolean>(false);

  // Step transitions
  const totalSteps = 5;
  const goNext = () => {
    haptic.tap();
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };
  const goBack = () => {
    haptic.tap();
    setStep((s) => Math.max(0, s - 1));
  };

  const handleFinish = async () => {
    haptic.success();
    const customSettings: Settings = {
      ...DEFAULT_SETTINGS,
      habits,
      smokeTarget,
      pmoTarget,
      bedtime,
      wake,
      baselinePerDay,
      packPrice,
      packSize,
      intensity,
    };
    await actions.completeOnboarding(customSettings, withDemo);
    router.replace('/');
  };

  const hasAnyHabit = habits.smoke || habits.pmo || habits.sleep;

  return (
    <View testID="onboarding-screen" style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
      {/* Top Navigation & Progress Dots */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <IconButton
            icon="arrow-back"
            label="Kembali"
            tone="fill"
            onPress={goBack}
          />
        ) : (
          <View style={{ width: 44 }} />
        )}

        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === step ? styles.dotActive : i < step ? styles.dotCompleted : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* ─── Step 0: Welcome ─────────────────────────── */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <View style={{ gap: 12, alignItems: 'center', marginTop: 40 }}>
              <View style={styles.appIconPlaceholder}>
                <Txt variant="hero" color={color.white}>K</Txt>
              </View>
              <Txt variant="display" center weight="800" testID="welcome-title">KuroStop</Txt>
              <Txt variant="headline" color={color.ink2} center weight="600">
                Every Choice Leaves a Mark.
              </Txt>
              <Txt variant="body" color={color.ink3} center style={{ maxWidth: 300, marginTop: 8 }}>
                Aplikasi disiplin pribadi untuk mengelola rokok, PMO, dan pola tidur larut malam dengan konsekuensi visual riil.
              </Txt>
            </View>

            <View style={{ marginTop: 'auto', gap: 10 }}>
              <Txt variant="footnote" color={color.ink4} center>
                Tanpa registrasi. Tanpa akun. Data lo milik lo sendiri.
              </Txt>
              <Button
                label="Mulai Sekarang"
                testID="onboarding-start-btn"
                onPress={goNext}
              />
              <Button
                label="Gunakan Pengaturan Standar"
                variant="secondary"
                testID="onboarding-quick-setup-btn"
                onPress={handleQuickStart}
              />
            </View>
          </View>
        )}

        {/* ─── Step 1: Select Habits ───────────────────── */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={{ gap: 6 }}>
              <Txt variant="eyebrow" color={color.ink3}>LANGKAH 1 DARI 4</Txt>
              <Txt variant="title" weight="700">Apa yang mau lo kelola?</Txt>
              <Txt variant="callout" color={color.ink3}>
                Pilih satu atau lebih kebiasaan yang ingin lo disiplinkan.
              </Txt>
            </View>

            <View style={{ gap: 12, marginTop: 20 }}>
              <HabitOptionCard
                title="Rokok"
                subtitle="Kendalikan konsumsi harian dan catat pengeluaran uang"
                icon="flame-outline"
                selected={habits.smoke}
                onPress={() => setHabits({ ...habits, smoke: !habits.smoke })}
              />
              <HabitOptionCard
                title="Pornografi & Masturbasi (PMO)"
                subtitle="Pelacakan privat dan berkesadaran tanpa distraksi"
                icon="eye-off-outline"
                selected={habits.pmo}
                onPress={() => setHabits({ ...habits, pmo: !habits.pmo })}
              />
              <HabitOptionCard
                title="Tidur Larut Malam"
                subtitle="Jadwal mati layar dan disiplin waktu istirahat"
                icon="moon-outline"
                selected={habits.sleep}
                onPress={() => setHabits({ ...habits, sleep: !habits.sleep })}
              />
            </View>

            <View style={{ marginTop: 'auto' }}>
              <Button
                label="Lanjut"
                disabled={!hasAnyHabit}
                onPress={goNext}
              />
            </View>
          </View>
        )}

        {/* ─── Step 2: Configure Targets ───────────────── */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <View style={{ gap: 6 }}>
              <Txt variant="eyebrow" color={color.ink3}>LANGKAH 2 DARI 4</Txt>
              <Txt variant="title" weight="700">Tentukan Target Harian</Txt>
              <Txt variant="callout" color={color.ink3}>
                Batas wajar yang lo tetapkan untuk diri lo sendiri.
              </Txt>
            </View>

            <View style={{ gap: 16, marginTop: 16 }}>
              {habits.smoke && (
                <Card>
                  <View style={styles.targetRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="headline" weight="600">Batas Rokok</Txt>
                      <Txt variant="footnote" color={color.ink3}>Maksimal batang per hari</Txt>
                    </View>
                    <Stepper
                      value={smokeTarget}
                      min={0}
                      max={30}
                      format={(v) => `${v} btg`}
                      onChange={setSmokeTarget}
                    />
                  </View>
                </Card>
              )}

              {habits.pmo && (
                <Card>
                  <View style={styles.targetRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="headline" weight="600">Batas PMO</Txt>
                      <Txt variant="footnote" color={color.ink3}>Sesi harian (0 = bersih total)</Txt>
                    </View>
                    <Stepper
                      value={pmoTarget}
                      min={0}
                      max={5}
                      format={(v) => `${v} sesi`}
                      onChange={setPmoTarget}
                    />
                  </View>
                </Card>
              )}

              {habits.sleep && (
                <Card>
                  <View style={{ gap: 14 }}>
                    <View style={styles.targetRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt variant="headline" weight="600">Target Tidur</Txt>
                        <Txt variant="footnote" color={color.ink3}>Maksimal jam mulai istirahat</Txt>
                      </View>
                      <ClockStepper
                        value={bedtime}
                        onChange={setBedtime}
                      />
                    </View>
                    <Divider />
                    <View style={styles.targetRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Txt variant="headline" weight="600">Target Bangun</Txt>
                        <Txt variant="footnote" color={color.ink3}>Jam bangun pagi</Txt>
                      </View>
                      <ClockStepper
                        value={wake}
                        onChange={setWake}
                      />
                    </View>
                  </View>
                </Card>
              )}
            </View>

            <View style={{ marginTop: 'auto' }}>
              <Button
                label="Lanjut"
                testID="onboarding-next-btn"
                onPress={goNext}
              />
            </View>
          </View>
        )}

        {/* ─── Step 3: Smoking Baseline ────────────────── */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={{ gap: 6 }}>
              <Txt variant="eyebrow" color={color.ink3}>LANGKAH 3 DARI 4</Txt>
              <Txt variant="title" weight="700">Baseline & Biaya Rokok</Txt>
              <Txt variant="callout" color={color.ink3}>
                Untuk menghitung riil uang yang lo selamatkan.
              </Txt>
            </View>

            {habits.smoke ? (
              <View style={{ gap: 14, marginTop: 16 }}>
                <Card>
                  <View style={styles.targetRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="headline" weight="600">Konsumsi Sebelum Ini</Txt>
                      <Txt variant="footnote" color={color.ink3}>Batang rokok per hari biasanya</Txt>
                    </View>
                    <Stepper
                      value={baselinePerDay}
                      min={1}
                      max={60}
                      format={(v) => `${v} btg`}
                      onChange={setBaselinePerDay}
                    />
                  </View>
                </Card>

                <Card>
                  <View style={styles.targetRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="headline" weight="600">Harga 1 Bungkus</Txt>
                      <Txt variant="footnote" color={color.ink3}>Harga beli reguler lo</Txt>
                    </View>
                    <Stepper
                      value={packPrice}
                      min={15000}
                      max={60000}
                      step={500}
                      format={(v) => rupiah(v, { compact: true })}
                      onChange={setPackPrice}
                    />
                  </View>
                </Card>

                <Card>
                  <View style={styles.targetRow}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt variant="headline" weight="600">Isi per Bungkus</Txt>
                      <Txt variant="footnote" color={color.ink3}>Jumlah batang kemasan</Txt>
                    </View>
                    <Stepper
                      value={packSize}
                      min={10}
                      max={24}
                      step={2}
                      format={(v) => `${v} btg`}
                      onChange={setPackSize}
                    />
                  </View>
                </Card>
              </View>
            ) : (
              <Card style={{ marginTop: 24 }}>
                <Txt variant="body" color={color.ink2}>
                  Lo tidak memilih pelacakan rokok. Langkah ini otomatis dilewati.
                </Txt>
              </Card>
            )}

            <View style={{ marginTop: 'auto' }}>
              <Button
                label="Lanjut"
                testID="onboarding-next-btn"
                onPress={goNext}
              />
            </View>
          </View>
        )}

        {/* ─── Step 4: Accountability & Demo Data ──────── */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <View style={{ gap: 6 }}>
              <Txt variant="eyebrow" color={color.ink3}>LANGKAH TERAKHIR</Txt>
              <Txt variant="title" weight="700">Gaya Akuntabilitas</Txt>
              <Txt variant="callout" color={color.ink3}>
                Pilih seberapa tegas KuroStop mengevaluasi pilihan lo.
              </Txt>
            </View>

            <View style={{ gap: 10, marginTop: 16 }}>
              {(['normal', 'strict', 'brutal'] as Intensity[]).map((mode) => {
                const isSelected = intensity === mode;
                const labels: Record<Intensity, { title: string; desc: string }> = {
                  normal: { title: 'Normal', desc: 'Netral, informatif, pengingat santai.' },
                  strict: { title: 'Tegas', desc: 'Langsung pada poin, tanpa basa-basi.' },
                  brutal: { title: 'Brutal (Direkomendasikan)', desc: 'Menghantam ilusi pembenaran diri dengan telak.' },
                };
                return (
                  <PressableScale
                    key={mode}
                    scaleTo={0.98}
                    onPress={() => setIntensity(mode)}
                    style={[styles.intensityCard, isSelected && styles.intensityCardSelected]}
                  >
                    <View style={{ gap: 4 }}>
                      <Txt variant="headline" weight="700" color={isSelected ? color.ink : color.ink2}>
                        {labels[mode].title}
                      </Txt>
                      <Txt variant="footnote" color={color.ink3}>
                        &ldquo;{SAMPLE_BY_INTENSITY[mode]}&rdquo;
                      </Txt>
                    </View>
                  </PressableScale>
                );
              })}
            </View>

            {/* Demo Data Option */}
            <Card style={{ marginTop: 14 }}>
              <View style={styles.targetRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="headline" weight="600">Muat Data Contoh (Demo)</Txt>
                  <Txt variant="footnote" color={color.ink3}>
                    Isi aplikasi dengan 75 hari riwayat simulasi agar lo bisa langsung menguji kalender & grafik.
                  </Txt>
                </View>
                <Toggle
                  label="Data Contoh"
                  value={withDemo}
                  onChange={setWithDemo}
                />
              </View>
            </Card>

            <View style={{ marginTop: 'auto' }}>
              <Button
                label="Masuk ke KuroStop"
                testID="onboarding-finish-btn"
                onPress={handleFinish}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function HabitOptionCard({
  title, subtitle, icon, selected, onPress,
}: {
  title: string;
  subtitle: string;
  icon: any;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={onPress}
      style={[styles.habitCard, selected && styles.habitCardSelected]}
    >
      <View style={[styles.habitIconWrapper, selected && styles.habitIconWrapperSelected]}>
        <IconButton icon={icon} label={title} tone="clear" size={28} iconColor={selected ? color.white : color.ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="headline" weight="700" color={color.ink}>{title}</Txt>
        <Txt variant="footnote" color={color.ink3}>{subtitle}</Txt>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.paper,
    paddingHorizontal: space.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: color.ink,
  },
  dotCompleted: {
    width: 6,
    backgroundColor: color.ink3,
  },
  dotInactive: {
    width: 6,
    backgroundColor: color.fillStrong,
  },
  content: {
    flex: 1,
    marginTop: 12,
  },
  stepContainer: {
    flex: 1,
  },
  appIconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: color.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: color.sheet,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: color.hair,
  },
  habitCardSelected: {
    borderColor: color.ink,
    backgroundColor: '#FAFAF8',
  },
  habitIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: color.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitIconWrapperSelected: {
    backgroundColor: color.ink,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intensityCard: {
    backgroundColor: color.sheet,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: color.hair,
  },
  intensityCardSelected: {
    borderColor: color.ink,
    backgroundColor: '#FAFAF8',
  },
});
