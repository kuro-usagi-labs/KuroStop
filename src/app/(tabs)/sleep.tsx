import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useApp } from '@/data/store';
import { useNow, useToday } from '@/data/hooks';
import {
  activeSleep, avgVerified, minutesUntilBedtime, statsForRange, streaks, sum,
} from '@/data/selectors';
import type { SleepEntry } from '@/data/types';
import {
  clock, duration, durationMin, keyLabel, minutesToClock, stampLabel,
} from '@/lib/format';
import { color, radius, space } from '@/theme/tokens';
import {
  EmptyState, Group, Row, Screen, Section, Stat, StatGrid, TextLink,
} from '@/components/ui/layout';
import { Badge, Button, Card, Divider, IconButton, Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export default function SleepScreen() {
  const { state, actions } = useApp();
  const { today, index, stat, settings } = useToday();
  const now = useNow(15_000); // 15-second refresh for live countdown
  const toast = useToast();
  const s = settings;

  // Active sleep session (user went to sleep, hasn't logged wake yet)
  const currentSleep = useMemo(() => activeSleep(state.entries), [state.entries]);

  // Target times
  const bedtimeStr = minutesToClock(s.bedtime);
  const wakeStr = minutesToClock(s.wake);
  const minUntilBed = minutesUntilBedtime(now, s);

  // Status computation
  const sleepStatus = useMemo(() => {
    if (currentSleep) {
      const elapsedMs = now - currentSleep.at;
      return {
        isSleeping: true,
        label: 'Sedang Tidur',
        detail: `Tidur sejak ${clock(currentSleep.at)} (${duration(elapsedMs)})`,
        tone: color.jade,
      };
    }

    if (minUntilBed < -180) {
      // More than 3 hours past bedtime
      return {
        isSleeping: false,
        label: 'Lewat Jam Tidur!',
        detail: `Sudah lewat ${durationMin(Math.abs(minUntilBed))} dari target ${bedtimeStr}`,
        tone: color.vermilion,
      };
    } else if (minUntilBed <= 0) {
      // 0 to 3 hours past bedtime
      return {
        isSleeping: false,
        label: 'Waktunya Tidur',
        detail: `Target jam ${bedtimeStr} (${durationMin(Math.abs(minUntilBed))} lalu)`,
        tone: color.amber,
      };
    } else if (minUntilBed <= 60) {
      return {
        isSleeping: false,
        label: 'Mendekati Waktu Tidur',
        detail: `${minUntilBed} menit lagi menuju jam ${bedtimeStr}`,
        tone: color.amber,
      };
    } else {
      const hoursUntil = Math.floor(minUntilBed / 60);
      const minsUntil = minUntilBed % 60;
      return {
        isSleeping: false,
        label: 'Target Tidur: ' + bedtimeStr,
        detail: `${hoursUntil}j ${minsUntil}m lagi menuju waktu istirahat`,
        tone: color.ink,
      };
    }
  }, [currentSleep, minUntilBed, now, bedtimeStr]);

  // Handle sleep actions
  const handleStartSleep = async () => {
    try {
      const id = await actions.add({
        kind: 'sleep',
        at: Date.now(),
      });
      toast({
        title: 'Selamat Istirahat',
        body: `Mulai tidur dicatat pukul ${clock(Date.now())}`,
        icon: 'moon',
        tone: color.jade,
        undo: () => actions.remove(id),
      });
    } catch (err) {
      toast({
        title: 'Gagal mencatat',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  };

  const handleWakeUp = async () => {
    if (!currentSleep) return;
    const end = Date.now();
    const durMs = end - currentSleep.at;
    try {
      await actions.update(currentSleep.id, { end });
      toast({
        title: 'Selamat Pagi!',
        body: `Durasi tidur: ${duration(durMs)}`,
        icon: 'sunny-outline',
        tone: color.jade,
      });
    } catch (err) {
      toast({
        title: 'Gagal memperbarui',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  };

  // Streaks for on-time bedtime
  const streak = useMemo(() => streaks(index, s, today, 'sleep'), [index, s, today]);

  // Periodic stats (7 and 30 days)
  const week = useMemo(() => statsForRange(index, s, today, 7), [index, s, today]);
  const month = useMemo(() => statsForRange(index, s, today, 30), [index, s, today]);

  const weekSleepDays = week.filter((d) => d.sleep?.durationMin);
  const weekAvgDurMin = weekSleepDays.length > 0
    ? Math.round(weekSleepDays.reduce((acc, d) => acc + (d.sleep?.durationMin ?? 0), 0) / weekSleepDays.length)
    : 0;
  const weekOnTimeCount = week.filter((d) => d.sleep && d.sleep.lateMin <= s.lateGrace).length;

  const monthSleepDays = month.filter((d) => d.sleep?.durationMin);
  const monthAvgDurMin = monthSleepDays.length > 0
    ? Math.round(monthSleepDays.reduce((acc, d) => acc + (d.sleep?.durationMin ?? 0), 0) / monthSleepDays.length)
    : 0;
  const monthOnTimeCount = month.filter((d) => d.sleep && d.sleep.lateMin <= s.lateGrace).length;

  // Completed sleep entries
  const recentSleep = useMemo(() => {
    const list: SleepEntry[] = [];
    for (const [, entries] of index) {
      for (const e of entries) {
        if (e.kind === 'sleep' && e.end) list.push(e);
      }
    }
    return list.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [index]);

  return (
    <Screen
      title="Tidur"
      eyebrow="PELACAK"
      right={
        <IconButton
          icon="add"
          label="Catat manual"
          tone="fill"
          onPress={() => router.push('/log?habit=sleep')}
        />
      }
    >
      {/* Hero Sleep Status Card */}
      <Card>
        <View style={{ gap: 16 }}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Txt variant="footnote" color={color.ink3}>Status Istirahat</Txt>
              <Txt variant="title" color={sleepStatus.tone} weight="700">
                {sleepStatus.label}
              </Txt>
              <Txt variant="subhead" color={color.ink2}>
                {sleepStatus.detail}
              </Txt>
            </View>
            <View style={[styles.targetPill, { borderColor: color.hair }]}>
              <Txt variant="caption" color={color.ink3}>TARGET</Txt>
              <Txt variant="headline" weight="700">{bedtimeStr}</Txt>
              <Txt variant="caption" color={color.ink3}>BANGUN {wakeStr}</Txt>
            </View>
          </View>

          {/* Action buttons */}
          <View style={{ gap: 8 }}>
            {currentSleep ? (
              <Button
                label="Bangun Sekarang"
                icon="sunny-outline"
                variant="accent"
                accent={color.jade}
                onPress={handleWakeUp}
              />
            ) : (
              <Button
                label="Mulai Tidur Sekarang"
                icon="moon-outline"
                variant="primary"
                onPress={handleStartSleep}
              />
            )}
          </View>
        </View>
      </Card>

      {/* Today's Completed Sleep Info */}
      {stat.sleep && stat.sleep.durationMin ? (
        <Card>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt variant="headline" weight="700">Tidur Terakhir</Txt>
              <Badge
                label={stat.sleep.lateMin <= s.lateGrace ? 'TEPAT WAKTU' : `TELAT ${durationMin(stat.sleep.lateMin)}`}
                fg={stat.sleep.lateMin <= s.lateGrace ? color.jade : color.vermilion}
                bg={stat.sleep.lateMin <= s.lateGrace ? color.jadeTint : color.vermilionTint}
              />
            </View>
            <View style={styles.sleepDetailRow}>
              <View style={styles.sleepDetailItem}>
                <Txt variant="caption" color={color.ink3}>DURASI</Txt>
                <Txt variant="title2" weight="700">{durationMin(stat.sleep.durationMin)}</Txt>
              </View>
              <View style={styles.sleepDetailItem}>
                <Txt variant="caption" color={color.ink3}>MULAI</Txt>
                <Txt variant="headline" weight="600">{clock(stat.sleep.start)}</Txt>
              </View>
              <View style={styles.sleepDetailItem}>
                <Txt variant="caption" color={color.ink3}>BANGUN</Txt>
                <Txt variant="headline" weight="600">{stat.sleep.end ? clock(stat.sleep.end) : '—'}</Txt>
              </View>
            </View>
          </View>
        </Card>
      ) : null}

      {/* Streaks */}
      <Section title="Disiplin Jam Tidur">
        <StatGrid>
          <Stat
            label="Streak Tepat Waktu"
            value={`${streak.current} hari`}
            sub={streak.current > 0 ? 'Tidur sesuai jadwal' : 'Mulai tepat waktu malam ini'}
            tone={streak.current > 0 ? color.jade : color.ink}
            icon="shield-checkmark-outline"
          />
          <Stat
            label="Streak Terbaik"
            value={`${streak.longest} hari`}
            sub="Rekor tidur teratur"
            icon="trophy-outline"
          />
        </StatGrid>
      </Section>

      {/* Periodic Stats */}
      <Section title="Rata-rata & Tren">
        <StatGrid>
          <Stat
            label="Rata-rata 7 Hari"
            value={weekAvgDurMin > 0 ? durationMin(weekAvgDurMin) : '—'}
            sub={`${weekOnTimeCount} dari 7 hari tepat waktu`}
          />
          <Stat
            label="Rata-rata 30 Hari"
            value={monthAvgDurMin > 0 ? durationMin(monthAvgDurMin) : '—'}
            sub={`${monthOnTimeCount} dari 30 hari tepat waktu`}
          />
        </StatGrid>
      </Section>

      {/* Manual Tracking Transparency Note */}
      <View style={styles.infoBanner}>
        <IconButton icon="information-circle-outline" label="Info" tone="clear" size={24} iconColor={color.ink3} />
        <Txt variant="footnote" color={color.ink3} style={{ flex: 1 }}>
          KuroStop tidak menggunakan deteksi tidur otomatis latar belakang. Setiap sesi istirahat dicatat langsung oleh lo agar akurat dan berkesadaran.
        </Txt>
      </View>

      {/* Sleep History */}
      <Section
        title="Riwayat Sesi Tidur"
        action={
          <TextLink
            label="Lihat Semua"
            onPress={() => router.push('/history?habit=sleep')}
          />
        }
      >
        {recentSleep.length === 0 ? (
          <EmptyState
            icon="moon-outline"
            title="Belum Ada Riwayat Sesi"
            body="Tekan 'Mulai Tidur Sekarang' saat lo hendak tidur untuk mencatat sesi pertama."
          />
        ) : (
          <Group>
            {recentSleep.map((entry) => {
              const durMs = entry.end ? entry.end - entry.at : 0;
              return (
                <Row
                  key={entry.id}
                  title={`${duration(durMs)} tidur`}
                  subtitle={`${stampLabel(entry.at)} → ${entry.end ? clock(entry.end) : '—'}`}
                  icon="bed-outline"
                />
              );
            })}
          </Group>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  targetPill: {
    backgroundColor: color.fill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
  },
  sleepDetailRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  sleepDetailItem: {
    flex: 1,
    backgroundColor: color.fill,
    padding: 10,
    borderRadius: radius.sm,
    gap: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.fill,
    padding: 12,
    borderRadius: radius.md,
  },
});
