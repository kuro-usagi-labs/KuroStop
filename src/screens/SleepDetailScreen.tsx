import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKuroStore } from '../stores/useKuroStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import {
  formatShortTime,
  formatIndonesianDate,
  formatDurationHoursMinutes,
} from '../utils/date';

interface SleepDetailScreenProps {
  onBack: () => void;
}

export const SleepDetailScreen: React.FC<SleepDetailScreenProps> = ({ onBack }) => {
  const {
    settings,
    sleepSessions,
    activeDate,
    isSleeping,
    consequence,
    logBedtimeStart,
    logWakeUp,
  } = useKuroStore();

  const handleToggle = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    if (isSleeping) {
      await logWakeUp();
    } else {
      await logBedtimeStart();
    }
  };

  const todaySession = sleepSessions.find((s) => s.sleepNightDate === activeDate) || null;

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Detail Tidur & Begadang"
        subtitle={formatIndonesianDate(activeDate)}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Target Jam Tidur</Text>
            <Text style={styles.metricValue}>{settings.targetBedtime}</Text>
            <Text style={styles.metricSub}>Maksimal malam ini</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Status Lateness</Text>
            <Text
              style={[
                styles.metricValue,
                consequence.sleepSeverity.count > 15 && { color: COLORS.critical.primary },
              ]}
            >
              {consequence.sleepSeverity.count > 0
                ? `+${consequence.sleepSeverity.count}m`
                : 'Tepat'}
            </Text>
            <Text style={styles.metricSub}>{consequence.sleepSeverity.summary}</Text>
          </Card>
        </View>

        {/* Action Toggle Card */}
        <Card style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Ionicons
              name={isSleeping ? 'bed' : 'moon'}
              size={24}
              color={isSleeping ? COLORS.clear.primary : COLORS.textPrimary}
            />
            <Text style={styles.actionCardTitle}>
              {isSleeping ? 'Kamu Sedang Tercatat Tidur' : 'Belum Mencatat Jam Tidur'}
            </Text>
          </View>
          <Text style={styles.actionCardDesc}>
            {isSleeping
              ? 'Selamat beristirahat. Tekan tombol di bawah saat kamu sudah bangun besok pagi.'
              : 'Tekan tombol ini tepat saat kamu meletakkan ponsel dan siap tidur malam ini.'}
          </Text>

          <Button
            title={isSleeping ? 'Aku Sudah Bangun' : 'Aku Mau Tidur Sekarang'}
            variant={isSleeping ? 'secondary' : 'primary'}
            onPress={handleToggle}
            style={styles.toggleButton}
          />
        </Card>

        {/* Accountability Advice */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Mengapa Begadang Menjadi Musuh Utama?</Text>
          <Text style={styles.infoBody}>
            Daya kemauan (willpower) manusia menurun drastis setelah kelelahan malam hari.
            Mayoritas kompromi merokok tanpa sadar dan kekambuhan PMO terjadi di antara pukul 23:00
            hingga 02:00 saat kamu begadang menatap layar sendirian.
          </Text>
        </Card>

        {/* Past Sleep Sessions */}
        <Text style={styles.sectionTitle}>Riwayat Sesi Tidur</Text>
        {sleepSessions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="moon-outline" size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Belum Ada Riwayat Tidur</Text>
            <Text style={styles.emptySub}>
              Mulai catat saat kamu hendak tidur malam ini untuk melacak disiplin jam tidur.
            </Text>
          </Card>
        ) : (
          <View style={styles.listWrap}>
            {sleepSessions.slice(0, 10).map((sess) => (
              <Card key={sess.id} style={styles.sessionCard}>
                <View>
                  <Text style={styles.sessionDate}>{sess.sleepNightDate}</Text>
                  <Text style={styles.sessionTime}>
                    Tidur: {formatShortTime(sess.bedtimeTimestamp)} • Bangun:{' '}
                    {sess.wakeTimestamp ? formatShortTime(sess.wakeTimestamp) : 'Sedang tidur'}
                  </Text>
                </View>

                <View style={styles.sessionRight}>
                  {sess.durationMinutes ? (
                    <Text style={styles.durationText}>
                      {formatDurationHoursMinutes(sess.durationMinutes)}
                    </Text>
                  ) : null}
                  <Badge
                    label={
                      sess.latenessMinutes > 15
                        ? `Lewat ${sess.latenessMinutes}m`
                        : 'Tepat Waktu'
                    }
                    zone={sess.latenessMinutes > 45 ? 'CRITICAL' : sess.latenessMinutes > 15 ? 'WARNING' : 'CLEAR'}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
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
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  actionCard: {
    padding: 18,
    marginBottom: 16,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionCardDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  toggleButton: {
    minHeight: 48,
  },
  infoCard: {
    backgroundColor: COLORS.surfaceSubtle,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  infoBody: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listWrap: {
    gap: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  sessionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
