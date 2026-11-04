import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKuroStore } from '../stores/useKuroStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { getPastNDays, formatIndonesianDate, formatShortTime } from '../utils/date';
import { ConsequenceZone } from '../types';

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const {
    events,
    purchases,
    sleepSessions,
    urgeLogs,
    activeDate,
    setActiveDate,
  } = useKuroStore();

  const [filterHabit, setFilterHabit] = useState<'all' | 'smoking' | 'pmo' | 'sleep'>('all');

  const past28Days = getPastNDays(28);

  // Group events by date
  const eventsByDate: Record<string, typeof events> = {};
  for (const e of events) {
    if (!eventsByDate[e.localDate]) eventsByDate[e.localDate] = [];
    eventsByDate[e.localDate].push(e);
  }

  // Determine zone of past day
  const getDayZone = (dateStr: string): ConsequenceZone => {
    const dayEvts = eventsByDate[dateStr] || [];
    const smokeCount = dayEvts
      .filter((e) => e.habitType === 'smoking')
      .reduce((acc, curr) => acc + (curr.count || 1), 0);
    const pmoCount = dayEvts.filter((e) => e.habitType === 'pmo').length;
    const sleep = sleepSessions.find((s) => s.sleepNightDate === dateStr);
    const sleepLate = sleep ? sleep.latenessMinutes : 0;

    if (smokeCount >= 4 || pmoCount >= 2 || sleepLate > 90) return 'CRITICAL';
    if (smokeCount >= 2 || sleepLate > 45) return 'DANGER';
    if (smokeCount === 1 || pmoCount === 1 || sleepLate > 15) return 'WARNING';
    return 'CLEAR';
  };

  const handleSelectDay = (dateStr: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    setActiveDate(dateStr);
  };

  // Selected date events
  const selectedDayEvents = (eventsByDate[activeDate] || []).filter((e) => {
    if (filterHabit === 'all') return true;
    return e.habitType === filterHabit;
  });

  // Calculate clean streak (consecutive past days that were CLEAR)
  let cleanStreak = 0;
  for (let i = 0; i < past28Days.length; i++) {
    const d = past28Days[past28Days.length - 1 - i];
    const z = getDayZone(d);
    if (z === 'CLEAR') {
      cleanStreak++;
    } else {
      break;
    }
  }

  // Count urge stats
  const totalUrges = urgeLogs.length;
  const resistedUrges = urgeLogs.filter((u) => u.resisted).length;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Riwayat & Kalender Disiplin" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Streak & Urge Overview */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Streak Hari Bersih</Text>
            <Text style={[styles.metricValue, { color: COLORS.clear.primary }]}>
              {cleanStreak}
            </Text>
            <Text style={styles.metricSub}>hari tanpa pelanggaran</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Kemenangan Menahan Urge</Text>
            <Text style={styles.metricValue}>
              {resistedUrges}
              <Text style={{ fontSize: 16, color: COLORS.textSecondary }}> / {totalUrges}</Text>
            </Text>
            <Text style={styles.metricSub}>dorongan berhasil ditepis</Text>
          </Card>
        </View>

        {/* 28-Day Heatmap Grid */}
        <Card style={styles.heatmapCard}>
          <Text style={styles.heatmapTitle}>Peta Konsekuensi 28 Hari Terakhir</Text>
          <Text style={styles.heatmapSub}>
            Ketuk salah satu kotak tanggal untuk melihat catatan hari tersebut.
          </Text>

          <View style={styles.gridContainer}>
            {past28Days.map((d) => {
              const zone = getDayZone(d);
              const isSelected = d === activeDate;
              let bg = COLORS.surfaceSubtle;
              let border = COLORS.border;

              if (zone === 'CLEAR') {
                bg = COLORS.clear.surface;
                border = COLORS.clear.border;
              } else if (zone === 'WARNING') {
                bg = COLORS.warning.surface;
                border = COLORS.warning.border;
              } else if (zone === 'DANGER') {
                bg = COLORS.danger.surface;
                border = COLORS.danger.border;
              } else if (zone === 'CRITICAL') {
                bg = COLORS.critical.surface;
                border = COLORS.critical.border;
              }

              const dayNum = d.split('-')[2];

              return (
                <TouchableOpacity
                  key={d}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDay(d)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: bg, borderColor: isSelected ? COLORS.textPrimary : border },
                    isSelected && styles.dayCellSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isSelected && { fontWeight: '800', color: COLORS.textPrimary },
                    ]}
                  >
                    {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Heatmap Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.clear.surface }]} />
              <Text style={styles.legendText}>Bersih</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.warning.surface }]} />
              <Text style={styles.legendText}>Waspada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.danger.surface }]} />
              <Text style={styles.legendText}>Bahaya</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: COLORS.critical.surface }]} />
              <Text style={styles.legendText}>Kritis</Text>
            </View>
          </View>
        </Card>

        {/* Selected Date Details */}
        <View style={styles.dayDetailsHeader}>
          <Text style={styles.selectedDateTitle}>
            Catatan: {formatIndonesianDate(activeDate)}
          </Text>
          <Badge label={getDayZone(activeDate)} zone={getDayZone(activeDate)} />
        </View>

        {/* Habit Filters */}
        <View style={styles.filterRow}>
          {[
            { id: 'all' as const, label: 'Semua' },
            { id: 'smoking' as const, label: 'Rokok' },
            { id: 'pmo' as const, label: 'PMO' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.7}
              onPress={() => setFilterHabit(f.id)}
              style={[
                styles.filterChip,
                filterHabit === f.id && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterHabit === f.id && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Event List for selected day */}
        {selectedDayEvents.length === 0 ? (
          <Card style={styles.emptyDayCard}>
            <Text style={styles.emptyDayText}>
              Tidak ada catatan pelanggaran pada tanggal ini.
            </Text>
          </Card>
        ) : (
          <View style={styles.eventsList}>
            {selectedDayEvents.map((evt) => (
              <Card key={evt.id} style={styles.eventItem}>
                <View style={styles.eventLeft}>
                  <Text style={styles.eventTime}>{formatShortTime(evt.timestamp)}</Text>
                  <View>
                    <Text style={styles.eventTitle}>
                      {evt.habitType === 'smoking'
                        ? `${evt.count} Batang Rokok`
                        : evt.pmoType === 'pornography'
                        ? 'Pornografi'
                        : evt.pmoType === 'masturbation'
                        ? 'Masturbasi'
                        : 'Sesi PMO'}
                    </Text>
                    {evt.triggerTag ? (
                      <Badge label={evt.triggerTag} variant="neutral" style={{ marginTop: 4 }} />
                    ) : null}
                    {evt.note ? <Text style={styles.eventNote}>{evt.note}</Text> : null}
                  </View>
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
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  heatmapCard: {
    padding: 18,
    marginBottom: 20,
  },
  heatmapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  heatmapSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 14,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    borderWidth: 2,
  },
  dayCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyDayCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  eventsList: {
    gap: 8,
  },
  eventItem: {
    padding: 14,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 50,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  eventNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontStyle: 'italic',
  },
});
