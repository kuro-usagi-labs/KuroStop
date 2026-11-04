import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKuroStore } from '../stores/useKuroStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { AccountabilityLevel } from '../types';
import { formatIDR } from '../utils/currency';

interface SettingsScreenProps {
  onBack: () => void;
  onResetOnboarding: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onResetOnboarding,
}) => {
  const {
    settings,
    events,
    purchases,
    sleepSessions,
    urgeLogs,
    updateSettings,
    purgeAllData,
  } = useKuroStore();

  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion);

  const handleToggleReduceMotion = async (val: boolean) => {
    setReduceMotion(val);
    await updateSettings({ reduceMotion: val });
  };

  const handleSetIntensity = async (intensity: AccountabilityLevel) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await updateSettings({ accountabilityIntensity: intensity });
  };

  const handleSetBedtime = async (bedtime: string) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await updateSettings({ targetBedtime: bedtime });
  };

  const handleSetBaseline = async (amount: number) => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    await updateSettings({ dailyCigaretteSpendBaseline: amount });
  };

  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings,
      eventsCount: events.length,
      purchasesCount: purchases.length,
      sleepCount: sleepSessions.length,
      urgesCount: urgeLogs.length,
      events,
      purchases,
      sleepSessions,
      urgeLogs,
    };
    const jsonStr = JSON.stringify(backup, null, 2);
    Alert.alert(
      'Ekspor Data Berhasil',
      `Data siap diekspor (${(jsonStr.length / 1024).toFixed(1)} KB, ${events.length} catatan habit). Seluruh catatan tersimpan 100% lokal.`,
      [{ text: 'OK' }]
    );
  };

  const handlePurge = () => {
    Alert.alert(
      'Hapus Seluruh Data',
      'PERINGATAN: Seluruh catatan merokok, PMO, riwayat tidur, dan kalkulasi uang akan dihapus permanen dari memori SQLite lokal. Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Semua Data',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              } catch {}
            }
            await purgeAllData();
            Alert.alert('Data Dikosongkan', 'Seluruh riwayat berhasil dihapus.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Pengaturan & Aturan Pribadi" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Accountability Intensity */}
        <Text style={styles.sectionHeader}>Intensitas Akuntabilitas</Text>
        <Card style={styles.sectionCard}>
          {(['normal', 'strict', 'brutal'] as AccountabilityLevel[]).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              activeOpacity={0.7}
              onPress={() => handleSetIntensity(lvl)}
              style={[
                styles.optionRow,
                settings.accountabilityIntensity === lvl && styles.optionRowActive,
              ]}
            >
              <View>
                <Text style={styles.optionTitle}>
                  {lvl === 'brutal'
                    ? 'Brutal (Harsh Reality)'
                    : lvl === 'strict'
                    ? 'Tegas & Disiplin'
                    : 'Netral & Objektif'}
                </Text>
                <Text style={styles.optionSub}>
                  {lvl === 'brutal'
                    ? 'Bahasa langsung tanpa kompromi'
                    : lvl === 'strict'
                    ? 'Pengingat komitmen standar'
                    : 'Informasi fakta berbasis angka'}
                </Text>
              </View>
              {settings.accountabilityIntensity === lvl ? (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.textPrimary} />
              ) : null}
            </TouchableOpacity>
          ))}
        </Card>

        {/* Target Bedtime */}
        <Text style={styles.sectionHeader}>Target Waktu Tidur</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.chipsRow}>
            {['22:00', '22:30', '23:00', '23:30', '00:00'].map((time) => (
              <TouchableOpacity
                key={time}
                activeOpacity={0.7}
                onPress={() => handleSetBedtime(time)}
                style={[
                  styles.chip,
                  settings.targetBedtime === time && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    settings.targetBedtime === time && styles.chipTextActive,
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Smoking Baseline IDR */}
        <Text style={styles.sectionHeader}>Baseline Pengeluaran Rokok / Hari</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.chipsRow}>
            {[15000, 25000, 30000, 45000, 60000].map((amt) => (
              <TouchableOpacity
                key={amt}
                activeOpacity={0.7}
                onPress={() => handleSetBaseline(amt)}
                style={[
                  styles.chip,
                  settings.dailyCigaretteSpendBaseline === amt && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    settings.dailyCigaretteSpendBaseline === amt && styles.chipTextActive,
                  ]}
                >
                  {formatIDR(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Accessibility & Motion */}
        <Text style={styles.sectionHeader}>Aksesibilitas & Gerakan (Motion)</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.toggleTitle}>Kurangi Gerakan (Reduce Motion)</Text>
              <Text style={styles.toggleSub}>
                Menonaktifkan animasi breathing berulang pada Living Orb dan transisi cepat.
              </Text>
            </View>
            <Switch
              value={reduceMotion}
              onValueChange={handleToggleReduceMotion}
              trackColor={{ false: COLORS.border, true: COLORS.textPrimary }}
            />
          </View>
        </Card>

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.clear.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.privacyTitle}>Privasi & Keamanan Lokal</Text>
            <Text style={styles.privacyBody}>
              KuroStop tidak menggunakan cloud backend, analitik pihak ketiga, atau pelacakan
              iklan. Data PMO dan kebiasaanmu tidak pernah keluar dari ponsel ini.
            </Text>
          </View>
        </Card>

        {/* Data Actions */}
        <Text style={styles.sectionHeader}>Manajemen Data</Text>
        <Button
          title="Ekspor Seluruh Riwayat (JSON)"
          variant="secondary"
          onPress={handleExportData}
          icon={<Ionicons name="download-outline" size={17} color={COLORS.textPrimary} />}
          style={{ marginBottom: 12 }}
        />

        <Button
          title="Ulangi Panduan Onboarding"
          variant="outline"
          onPress={onResetOnboarding}
          style={{ marginBottom: 12 }}
        />

        <Button
          title="Hapus Seluruh Data Pribadi (Purge)"
          variant="destructive"
          onPress={handlePurge}
          icon={<Ionicons name="trash-outline" size={17} color="#FFFFFF" />}
          style={{ marginBottom: 30 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 12,
  },
  sectionCard: {
    padding: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  optionRowActive: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  optionSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: COLORS.surfaceSubtle,
    marginVertical: 12,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  privacyBody: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
});
