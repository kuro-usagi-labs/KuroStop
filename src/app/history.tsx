import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { useApp } from '@/data/store';
import { useToday } from '@/data/hooks';
import {
  avgVerified, dayStat, statsForRange, streaks, sum,
} from '@/data/selectors';
import type { Habit } from '@/data/types';
import {
  addDays, clock, dayKey, duration, durationMin, keyLabel, keyParts, monthKey, monthLabel, rangeKeys, relativeDay, rupiah, shiftMonth,
} from '@/lib/format';
import { color, radius, space, zones, type Zone } from '@/theme/tokens';
import { Segmented } from '@/components/ui/controls';
import {
  EmptyState, Group, Row, Screen, Section, Stat, StatGrid,
} from '@/components/ui/layout';
import { Badge, Card, Divider, IconButton, PressableScale, Txt } from '@/components/ui/primitives';

type HabitFilter = 'all' | Habit;

export default function HistoryScreen() {
  const params = useLocalSearchParams<{ habit?: string }>();
  const { today, index, settings } = useToday();
  const s = settings;

  const [filter, setFilter] = useState<HabitFilter>((params.habit as HabitFilter) || 'all');
  const [selectedKey, setSelectedKey] = useState<string>(today);
  const [activeMonth, setActiveMonth] = useState<string>(() => monthKey(today));

  // Habit filter options
  const filterOptions: { value: HabitFilter; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'smoke', label: 'Rokok' },
    { value: 'pmo', label: 'PMO' },
    { value: 'sleep', label: 'Tidur' },
  ];

  // 14-day horizontal calendar strip centered around selected date
  const stripKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 13; i >= 0; i--) {
      keys.push(addDays(today, -i));
    }
    return keys;
  }, [today]);

  // Selected date statistics
  const selectedStat = useMemo(() => dayStat(index, s, selectedKey), [index, s, selectedKey]);

  // Filtered entries for selected date
  const dayEntries = useMemo(() => {
    const entries = selectedStat.entries;
    if (filter === 'all') return entries;
    if (filter === 'smoke') return entries.filter((e) => e.kind === 'smoke' || e.kind === 'purchase');
    if (filter === 'pmo') return entries.filter((e) => e.kind === 'pmo');
    if (filter === 'sleep') return entries.filter((e) => e.kind === 'sleep');
    return entries;
  }, [selectedStat, filter]);

  // Streaks for current filter
  const streak = useMemo(() => streaks(index, s, today, filter), [index, s, today, filter]);

  // Periodic metrics (30 days)
  const stats30 = useMemo(() => statsForRange(index, s, today, 30), [index, s, today]);
  const verifiedCount30 = stats30.filter((d) => d.verified).length;
  const cleanDays30 = stats30.filter((d) => d.verified && d.zone === 'clear').length;

  return (
    <Screen
      title="Riwayat"
      eyebrow="STATISTIK & KALENDER"
      right={
        <IconButton
          icon="close"
          label="Tutup"
          tone="fill"
          onPress={() => router.back()}
        />
      }
    >
      {/* Habit Filter Segment */}
      <Segmented
        options={filterOptions}
        value={filter}
        onChange={setFilter}
      />

      {/* 14-day Calendar Strip */}
      <Section title="Pilih Hari">
        <Card padded={false}>
          <View style={styles.calendarStrip}>
            {stripKeys.map((k) => {
              const dStat = dayStat(index, s, k);
              const isSelected = k === selectedKey;
              const isToday = k === today;
              const parts = keyParts(k);
              const zTheme = zones[dStat.zone];

              return (
                <PressableScale
                  key={k}
                  scaleTo={0.92}
                  onPress={() => setSelectedKey(k)}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected,
                    !dStat.verified && styles.dayPillUnverified,
                  ]}
                  accessibilityLabel={`${keyLabel(k)}, zona ${zTheme.label}`}
                >
                  <Txt
                    variant="caption"
                    color={isSelected ? color.white : color.ink3}
                    weight="600"
                  >
                    {isToday ? 'Hari Ini' : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][parts.dow]}
                  </Txt>
                  <Txt
                    variant="headline"
                    color={isSelected ? color.white : color.ink}
                    weight="700"
                  >
                    {parts.day}
                  </Txt>
                  {/* Zone Dot */}
                  <View
                    style={[
                      styles.zoneDot,
                      {
                        backgroundColor: dStat.verified
                          ? (isSelected ? color.white : zTheme.accent)
                          : color.fillStrong,
                      },
                    ]}
                  />
                </PressableScale>
              );
            })}
          </View>
        </Card>
      </Section>

      {/* Selected Day Overview */}
      <Section title={relativeDay(selectedKey, today)}>
        <Card>
          <View style={{ gap: 14 }}>
            <View style={styles.selectedHeader}>
              <View style={{ gap: 2 }}>
                <Txt variant="headline" weight="700">
                  {keyLabel(selectedKey, 'long')}
                </Txt>
                <Txt variant="footnote" color={color.ink3}>
                  {selectedStat.verified
                    ? `Status catatan: Terverifikasi (${selectedStat.entries.length} data)`
                    : 'Tidak ada catatan terverifikasi pada hari ini'}
                </Txt>
              </View>
              <Badge
                label={zones[selectedStat.zone].stamp}
                fg={zones[selectedStat.zone].accent}
                bg={zones[selectedStat.zone].tint}
              />
            </View>

            {/* Quick stats for this day */}
            <View style={styles.dayStatsRow}>
              {(filter === 'all' || filter === 'smoke') && (
                <View style={styles.dayStatBox}>
                  <Txt variant="caption" color={color.ink3}>ROKOK</Txt>
                  <Txt variant="headline" weight="700">{selectedStat.smoke} btg</Txt>
                </View>
              )}
              {(filter === 'all' || filter === 'pmo') && (
                <View style={styles.dayStatBox}>
                  <Txt variant="caption" color={color.ink3}>PMO</Txt>
                  <Txt variant="headline" weight="700">{selectedStat.pmo.sessions} sesi</Txt>
                </View>
              )}
              {(filter === 'all' || filter === 'sleep') && (
                <View style={styles.dayStatBox}>
                  <Txt variant="caption" color={color.ink3}>TIDUR</Txt>
                  <Txt variant="headline" weight="700">
                    {selectedStat.sleep?.durationMin ? durationMin(selectedStat.sleep.durationMin) : '—'}
                  </Txt>
                </View>
              )}
              {selectedStat.spend > 0 && (
                <View style={styles.dayStatBox}>
                  <Txt variant="caption" color={color.ink3}>BELANJA</Txt>
                  <Txt variant="headline" weight="700">{rupiah(selectedStat.spend, { compact: true })}</Txt>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Section>

      {/* Selected Day Entries List */}
      <Section title="Aktivitas Hari Terpilih">
        {dayEntries.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Tidak Ada Kejadian Tercatat"
            body={selectedStat.verified
              ? 'Hari ini bersih tanpa rekaman pelanggaran untuk kategori yang dipilih.'
              : 'Hari ini tidak memiliki catatan aktivitas (tanpa data).'}
          />
        ) : (
          <Group>
            {dayEntries.map((e) => {
              if (e.kind === 'smoke') {
                return (
                  <Row
                    key={e.id}
                    title={`${e.qty} Batang Rokok`}
                    subtitle={[clock(e.at), e.trigger, e.note].filter(Boolean).join(' · ')}
                    icon="flame-outline"
                  />
                );
              }
              if (e.kind === 'purchase') {
                return (
                  <Row
                    key={e.id}
                    title={`Beli Rokok: ${rupiah(e.price)}`}
                    subtitle={`${e.qty} ${e.unit} · ${clock(e.at)}${e.brand ? ` · ${e.brand}` : ''}`}
                    icon="cart-outline"
                  />
                );
              }
              if (e.kind === 'pmo') {
                const label = e.type === 'p' ? 'Pornografi' : e.type === 'm' ? 'Masturbasi' : 'Sesi P+M';
                return (
                  <Row
                    key={e.id}
                    title={label}
                    subtitle={[clock(e.at), e.trigger, e.note].filter(Boolean).join(' · ')}
                    icon="eye-off-outline"
                  />
                );
              }
              if (e.kind === 'sleep') {
                const dur = e.end ? duration(e.end - e.at) : 'Masih berlangsung';
                return (
                  <Row
                    key={e.id}
                    title={`Sesi Tidur (${dur})`}
                    subtitle={`${clock(e.at)} → ${e.end ? clock(e.end) : '...'}`}
                    icon="moon-outline"
                  />
                );
              }
              if (e.kind === 'urge') {
                return (
                  <Row
                    key={e.id}
                    title={`Dorongan: ${e.outcome === 'resisted' ? 'Berhasil Tahan' : 'Tumbang'}`}
                    subtitle={`${e.habit} · ${clock(e.at)}`}
                    icon="pulse-outline"
                  />
                );
              }
              return null;
            })}
          </Group>
        )}
      </Section>

      {/* Aggregate Streaks and 30-Day Analysis */}
      <Section title="Ringkasan 30 Hari">
        <StatGrid>
          <Stat
            label="Streak Saat Ini"
            value={`${streak.current} hari`}
            sub={streak.current > 0 ? 'Konsisten sesuai target' : 'Peluang hari baru'}
            tone={streak.current > 0 ? color.jade : color.ink}
            icon="flame-outline"
          />
          <Stat
            label="Streak Terpanjang"
            value={`${streak.longest} hari`}
            sub="Rekor terbaik lo"
            icon="trophy-outline"
          />
          <Stat
            label="Hari Bersih (Zona Hijau)"
            value={`${cleanDays30} hari`}
            sub={`Dari ${verifiedCount30} hari terverifikasi`}
            tone={color.jade}
          />
          <Stat
            label="Hari Tanpa Data"
            value={`${30 - verifiedCount30} hari`}
            sub="Hari tanpa input catatan"
            tone={color.ink3}
          />
        </StatGrid>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  calendarStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 6,
    justifyContent: 'space-between',
  },
  dayPill: {
    width: '13%',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: color.fill,
    gap: 3,
  },
  dayPillSelected: {
    backgroundColor: color.ink,
  },
  dayPillUnverified: {
    opacity: 0.55,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dayStatBox: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: color.fill,
    padding: 8,
    borderRadius: radius.sm,
    gap: 2,
  },
});
