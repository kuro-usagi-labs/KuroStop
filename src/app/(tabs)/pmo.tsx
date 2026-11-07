import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useToday } from '@/data/hooks';
import {
  avgVerified, entriesInRange, statsForRange, streaks, sum, triggerBreakdown,
} from '@/data/selectors';
import { PMO_LABEL, PMO_TRIGGERS, type PmoEntry, type PmoTrigger } from '@/data/types';
import { clock, decimal, rangeKeys } from '@/lib/format';
import { color, radius } from '@/theme/tokens';
import {
  EmptyState, Group, Row, Screen, Section, Stat, StatGrid, TextLink,
} from '@/components/ui/layout';
import { Badge, Card, Icon, IconButton, Txt } from '@/components/ui/primitives';

const TRIGGER_MAP = new Map(PMO_TRIGGERS.map((t) => [t.value, t.label]));

export default function PmoScreen() {
  const { today, index, stat, settings } = useToday();
  const s = settings;

  // ─── streaks ──────────────────────────────────────────────
  const streak = useMemo(() => streaks(index, s, today, 'pmo'), [index, s, today]);

  // ─── weekly & monthly stats ────────────────────────────────
  const week = useMemo(() => statsForRange(index, s, today, 7), [index, s, today]);
  const month = useMemo(() => statsForRange(index, s, today, 30), [index, s, today]);

  const weekSessions = sum(week, (d) => d.pmo.sessions);
  const weekCleanDays = week.filter((d) => d.verified && d.pmo.sessions === 0).length;
  const monthSessions = sum(month, (d) => d.pmo.sessions);
  const monthCleanDays = month.filter((d) => d.verified && d.pmo.sessions === 0).length;
  const monthAvg = avgVerified(month, (d) => d.pmo.sessions);

  // ─── 30-day session breakdown (P, M, P+M) ──────────────────
  const pmoEntries30 = useMemo(
    () => entriesInRange(index, rangeKeys(today, 30), 'pmo'),
    [index, today],
  );

  const breakdown = useMemo(() => {
    let p = 0;
    let m = 0;
    let pmo = 0;
    for (const e of pmoEntries30) {
      if (e.type === 'p') p++;
      else if (e.type === 'm') m++;
      else if (e.type === 'pmo') pmo++;
    }
    return { p, m, pmo, total: p + m + pmo };
  }, [pmoEntries30]);

  // ─── triggers ─────────────────────────────────────────────
  const triggers = useMemo(
    () => triggerBreakdown<PmoTrigger>(pmoEntries30),
    [pmoEntries30],
  );

  // ─── recent activity ──────────────────────────────────────
  const recentPmo = useMemo(() => {
    const all: PmoEntry[] = [];
    for (const [, entries] of index) {
      for (const e of entries) {
        if (e.kind === 'pmo') all.push(e);
      }
    }
    return all.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [index]);

  const hasAny = recentPmo.length > 0 || stat.pmo.sessions > 0;
  const todayClean = stat.pmo.sessions <= s.pmoTarget;

  return (
    <Screen
      title="PMO"
      eyebrow="PELACAK"
      right={
        <IconButton
          icon="add"
          label="Catat PMO"
          tone="fill"
          onPress={() => router.push('/log?habit=pmo')}
        />
      }
    >
      {/* Privacy Notice */}
      <Card style={styles.privacyCard}>
        <View style={styles.privacyIcon}>
          <Icon name="lock-closed-outline" size={15} color={color.ink2} />
        </View>
        <Txt variant="footnote" color={color.ink3} style={{ flex: 1 }}>
          Data pelacakan PMO sepenuhnya privat. Semua diproses dan disimpan di perangkat ini.
        </Txt>
      </Card>

      {!hasAny ? (
        <EmptyState
          icon="shield-checkmark-outline"
          title="Belum Ada Catatan"
          body="Pertahankan komitmen lo. Bila dorongan muncul, gunakan tombol darurat 'Gue Lagi Pengen'."
        />
      ) : (
        <>
          {/* Hero Card */}
          <Card>
            <View style={styles.heroRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt variant="footnote" color={color.ink3}>Hari Ini</Txt>
                <View style={styles.heroCount}>
                  <Txt variant="hero" color={todayClean ? color.jade : color.vermilion}>
                    {stat.pmo.sessions}
                  </Txt>
                  <Txt variant="title2" color={color.ink3} style={{ marginBottom: 8 }}>
                    sesi
                  </Txt>
                </View>
                <Txt variant="subhead" color={todayClean ? color.jade : color.vermilion} weight="600">
                  {todayClean ? 'Target harian terpenuhi' : `Melebihi target (${s.pmoTarget} sesi)`}
                </Txt>
              </View>
              <Badge
                label={todayClean ? 'BERSIH' : 'JEBOL'}
                fg={todayClean ? color.jade : color.vermilion}
                bg={todayClean ? color.jadeTint : color.vermilionTint}
              />
            </View>
          </Card>

          {/* Streaks */}
          <Section title="Konsistensi">
            <StatGrid>
              <Stat
                label="Streak Saat Ini"
                value={`${streak.current} hari`}
                sub={streak.current > 0 ? 'Tanpa pelanggaran' : 'Mulai kembali hari ini'}
                tone={streak.current > 0 ? color.jade : color.ink}
                icon="flame-outline"
              />
              <Stat
                label="Streak Terpanjang"
                value={`${streak.longest} hari`}
                sub="Rekor terbaik lo"
                icon="trophy-outline"
              />
            </StatGrid>
          </Section>

          {/* Session Type Breakdown */}
          <Section title="Komposisi 30 Hari Terakhir">
            <Card>
              <View style={{ gap: 14 }}>
                <Txt variant="footnote" color={color.ink3}>
                  Sesi gabungan (P+M) dihitung sebagai satu sesi tunggal, bukan dua pelanggaran terpisah.
                </Txt>
                <View style={styles.breakdownGrid}>
                  <View style={styles.breakdownItem}>
                    <Txt variant="eyebrow" color={color.ink3}>{PMO_LABEL.p.short}</Txt>
                    <Txt variant="title2" weight="700" num>{breakdown.p}</Txt>
                    <Txt variant="footnote" color={color.ink3}>Pornografi</Txt>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Txt variant="eyebrow" color={color.ink3}>{PMO_LABEL.m.short}</Txt>
                    <Txt variant="title2" weight="700" num>{breakdown.m}</Txt>
                    <Txt variant="footnote" color={color.ink3}>Masturbasi</Txt>
                  </View>
                  <View style={styles.breakdownItem}>
                    <Txt variant="eyebrow" color={color.ink3}>{PMO_LABEL.pmo.short}</Txt>
                    <Txt variant="title2" weight="700" num>{breakdown.pmo}</Txt>
                    <Txt variant="footnote" color={color.ink3}>Gabungan</Txt>
                  </View>
                </View>
              </View>
            </Card>
          </Section>

          {/* Weekly & Monthly Stats */}
          <Section title="Statistik Periodik">
            <StatGrid>
              <Stat
                label="Sesi Minggu Ini"
                value={`${weekSessions} sesi`}
                sub={`${weekCleanDays} hari bersih dari 7 hari`}
              />
              <Stat
                label="Sesi Bulan Ini"
                value={`${monthSessions} sesi`}
                sub={`Rata-rata ${decimal(monthAvg)} sesi / hari`}
              />
              <Stat
                label="Hari Bersih Bulan Ini"
                value={`${monthCleanDays} hari`}
                sub={`Dari 30 hari terakhir`}
                tone={color.jade}
              />
              <Stat
                label="Total 30 Hari"
                value={`${breakdown.total} kali`}
                sub="Total semua kejadian"
              />
            </StatGrid>
          </Section>

          {/* Trigger Breakdown */}
          {triggers.length > 0 && (
            <Section title="Pemicu Dominan">
              <Group>
                {triggers.map(([key, count]) => (
                  <Row
                    key={key}
                    title={TRIGGER_MAP.get(key) ?? key}
                    value={`${count} kali`}
                    icon="bulb-outline"
                  />
                ))}
              </Group>
            </Section>
          )}

          {/* Recent Activity */}
          <Section
            title="Aktivitas Terakhir"
            action={
              <TextLink
                label="Lihat Semua"
                onPress={() => router.push('/history?habit=pmo')}
              />
            }
          >
            <Group>
              {recentPmo.map((entry) => {
                const triggerLabel = entry.trigger ? TRIGGER_MAP.get(entry.trigger) : undefined;
                return (
                  <Row
                    key={entry.id}
                    title={PMO_LABEL[entry.type].long}
                    subtitle={[clock(entry.at), triggerLabel, entry.note].filter(Boolean).join(' · ')}
                    icon="eye-off-outline"
                  />
                );
              })}
            </Group>
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: color.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroCount: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  breakdownItem: {
    flex: 1,
    backgroundColor: color.fill,
    padding: 12,
    borderRadius: radius.sm,
    gap: 4,
  },
});
