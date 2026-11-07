import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useToday } from '@/data/hooks';
import {
  avgVerified, entriesInRange, statsForRange, streaks, sum, triggerBreakdown,
} from '@/data/selectors';
import { SMOKE_TRIGGERS, type SmokeEntry, type SmokeTrigger } from '@/data/types';
import { clock, decimal, rangeKeys } from '@/lib/format';
import { color, radius, space } from '@/theme/tokens';
import { ProgressBar } from '@/components/ui/controls';
import {
  EmptyState, Row, Group, Screen, Section, Stat, StatGrid, TextLink,
} from '@/components/ui/layout';
import { Card, Divider, IconButton, Txt } from '@/components/ui/primitives';

const TRIGGER_MAP = new Map(SMOKE_TRIGGERS.map((t) => [t.value, t.label]));

export default function SmokeScreen() {
  const { today, index, stat, settings } = useToday();
  const s = settings;

  // ─── weekly & monthly stats ────────────────────────────────
  const week = useMemo(() => statsForRange(index, s, today, 7), [index, s, today]);
  const prevWeek = useMemo(() => {
    const keys = rangeKeys(today, 14).slice(0, 7);
    return keys.map((k) => {
      // reuse dayStat via statsForRange style
      return { smoke: (index.get(k) ?? []).reduce((acc, e) => acc + (e.kind === 'smoke' ? e.qty : 0), 0) };
    });
  }, [index, today]);
  const month = useMemo(() => statsForRange(index, s, today, 30), [index, s, today]);

  const weekTotal = sum(week, (d) => d.smoke);
  const weekAvg = avgVerified(week, (d) => d.smoke);
  const weekBest = Math.min(...week.filter((d) => d.verified).map((d) => d.smoke));
  const prevWeekTotal = prevWeek.reduce((a, d) => a + d.smoke, 0);

  const monthTotal = sum(month, (d) => d.smoke);
  const monthAvg = avgVerified(month, (d) => d.smoke);
  const monthBest = Math.min(...month.filter((d) => d.verified).map((d) => d.smoke));

  // ─── trigger breakdown (30 days) ───────────────────────────
  const smokeEntries30 = useMemo(
    () => entriesInRange(index, rangeKeys(today, 30), 'smoke'),
    [index, today],
  );
  const triggers = useMemo(() => triggerBreakdown<SmokeTrigger>(smokeEntries30), [smokeEntries30]);

  // ─── streak ────────────────────────────────────────────────
  const streak = useMemo(() => streaks(index, s, today, 'smoke'), [index, s, today]);

  // ─── recent activity (last 10) ─────────────────────────────
  const recentSmoke = useMemo(() => {
    const all: SmokeEntry[] = [];
    for (const [, entries] of index) {
      for (const e of entries) {
        if (e.kind === 'smoke') all.push(e);
      }
    }
    return all.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [index]);

  // ─── empty check ──────────────────────────────────────────
  const hasAny = recentSmoke.length > 0 || stat.smoke > 0;

  // ─── week comparison ──────────────────────────────────────
  const weekDiff = prevWeekTotal > 0
    ? Math.round(((weekTotal - prevWeekTotal) / prevWeekTotal) * 100)
    : 0;
  const weekCompText = prevWeekTotal === 0
    ? 'Belum ada data minggu lalu'
    : weekDiff === 0
      ? 'Sama dengan minggu lalu'
      : weekDiff > 0
        ? `↑ ${weekDiff}% dari minggu lalu`
        : `↓ ${Math.abs(weekDiff)}% dari minggu lalu`;

  return (
    <Screen
      title="Rokok"
      eyebrow="PELACAK"
      right={
        <IconButton
          icon="add"
          label="Catat rokok"
          tone="fill"
          onPress={() => router.push('/log?habit=smoke')}
        />
      }
    >
      {!hasAny ? (
        <EmptyState
          icon="flame-outline"
          title="Belum ada catatan"
          body="Mulai catat rokok pertama lo dengan menekan tombol + di atas."
        />
      ) : (
        <>
          {/* ── Hero stat card ── */}
          <Section index={0}>
            <Card>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Txt variant="eyebrow" color={color.ink3}>HARI INI</Txt>
                  <View style={styles.heroNum}>
                    <Txt variant="hero" color={stat.smoke > s.smokeTarget ? color.vermilion : color.ink}>
                      {stat.smoke}
                    </Txt>
                    <Txt variant="title" color={color.ink4} style={{ marginBottom: 6 }}>
                      /{s.smokeTarget}
                    </Txt>
                  </View>
                  <Txt variant="footnote" color={color.ink3}>
                    {stat.smoke <= s.smokeTarget
                      ? `Sisa ${s.smokeTarget - stat.smoke} batang lagi`
                      : `Melebihi target ${stat.smoke - s.smokeTarget} batang`}
                  </Txt>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <ProgressBar
                  value={stat.smoke}
                  target={s.smokeTarget}
                  tone={color.ink}
                  overTone={color.vermilion}
                />
              </View>
            </Card>
          </Section>

          {/* ── Streak ── */}
          <Section title="Streak" index={1}>
            <StatGrid>
              <Stat
                label="Streak saat ini"
                value={`${streak.current}`}
                sub="hari berturut"
                icon="flame-outline"
                tone={streak.current > 0 ? color.jade : color.ink}
              />
              <Stat
                label="Terpanjang"
                value={`${streak.longest}`}
                sub="hari terbaik"
                icon="trophy-outline"
                tone={color.amber}
              />
            </StatGrid>
          </Section>

          {/* ── Weekly stats ── */}
          <Section title="Minggu Ini" index={2}>
            <StatGrid>
              <Stat
                label="Total"
                value={`${weekTotal}`}
                sub={`${weekTotal === 1 ? '1 batang' : weekTotal + ' batang'}`}
                icon="stats-chart-outline"
              />
              <Stat
                label="Rata-rata / hari"
                value={decimal(weekAvg)}
                sub="dari hari tercatat"
                icon="analytics-outline"
              />
              <Stat
                label="Hari terbaik"
                value={Number.isFinite(weekBest) ? `${weekBest}` : '—'}
                sub="batang paling sedikit"
                icon="ribbon-outline"
                tone={color.jade}
              />
              <Stat
                label="vs minggu lalu"
                value={prevWeekTotal === 0 ? '—' : `${weekDiff > 0 ? '+' : ''}${weekDiff}%`}
                sub={weekCompText}
                icon="swap-vertical-outline"
                tone={weekDiff < 0 ? color.jade : weekDiff > 0 ? color.vermilion : color.ink}
              />
            </StatGrid>
          </Section>

          {/* ── Monthly stats ── */}
          <Section title="30 Hari Terakhir" index={3}>
            <StatGrid>
              <Stat
                label="Total"
                value={`${monthTotal}`}
                sub={`${monthTotal} batang`}
                icon="calendar-outline"
              />
              <Stat
                label="Rata-rata / hari"
                value={decimal(monthAvg)}
                sub="dari hari tercatat"
                icon="analytics-outline"
              />
              <Stat
                label="Hari terbaik"
                value={Number.isFinite(monthBest) ? `${monthBest}` : '—'}
                sub="batang paling sedikit"
                icon="ribbon-outline"
                tone={color.jade}
              />
            </StatGrid>
          </Section>

          {/* ── Trigger breakdown ── */}
          {triggers.length > 0 && (
            <Section title="Pemicu Teratas" index={4}>
              <Group>
                {triggers.map(([trigger, count]) => (
                  <Row
                    key={trigger}
                    title={TRIGGER_MAP.get(trigger) ?? trigger}
                    value={`${count}`}
                    icon="alert-circle-outline"
                  />
                ))}
              </Group>
            </Section>
          )}

          {/* ── Recent activity ── */}
          <Section title="Aktivitas Terbaru" index={5}>
            <Group>
              {recentSmoke.map((entry) => (
                <Row
                  key={entry.id}
                  title={clock(entry.at)}
                  subtitle={entry.trigger ? (TRIGGER_MAP.get(entry.trigger) ?? entry.trigger) : undefined}
                  value={`${entry.qty} btg`}
                  icon="flame-outline"
                  onPress={() => {}}
                />
              ))}
            </Group>
          </Section>

          {/* ── View all history ── */}
          <View style={styles.footerLink}>
            <TextLink
              label="Lihat Semua Riwayat"
              onPress={() => router.push('/history?habit=smoke')}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroNum: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  footerLink: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
});
