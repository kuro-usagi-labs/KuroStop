/**
 * TODAY DASHBOARD — the main screen of KuroStop.
 *
 * Hero: the DaySheet consequence card showing today's zone, accountability
 * messages, ink marks, and a footer with quick summary stats.
 * Below: zone simulator, quick-action buttons, stat grid, streaks, 7-day
 * trend, and navigation cards.
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { DaySheet, type Mark } from '@/components/consequence/DaySheet';
import { ProgressBar } from '@/components/ui/controls';
import {
  Screen, Section, StatGrid, Stat, Group, Row,
} from '@/components/ui/layout';
import {
  Badge, Button, Card, Chip, IconButton, PressableScale, Txt, Icon,
} from '@/components/ui/primitives';
import { useToday } from '@/data/hooks';
import { accountability, neutralStatus } from '@/data/messages';
import { statsForRange, streaks as calcStreaks } from '@/data/selectors';
import { useApp } from '@/data/store';
import { HABIT_META } from '@/data/types';
import { durationMin, keyLabel, rupiah, addDays } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import {
  color, radius, space, zones, ZONE_ORDER, type Zone,
} from '@/theme/tokens';
import { logMilestone } from '@/lib/milestone';

/* ════════════════════════════════════════════════════════════════ */

export default function TodayDashboard() {
  // Readiness, database errors and the onboarding gate are handled once by the
  // root navigator (src/app/_layout.tsx). This screen only renders the dashboard.
  return <TodayDashboardContent />;
}

function TodayDashboardContent() {
  const { state, actions } = useApp();
  const { now, today, index, stat, zone, simulated, settings } = useToday();

  useEffect(() => {
    logMilestone('FIRST_SCREEN_RENDERED', {
      screen: 'today-dashboard',
      returningUser: true,
      elements: ['today-dashboard', 'daysheet-card', 'quick-log-smoke']
    });
    logMilestone('TODAY_DASHBOARD_MOUNTED', {
      elements: ['today-dashboard', 'daysheet-card', 'quick-log-smoke']
    });
  }, []);

  // ── Accountability message ──
  const msg = settings.messagesOn
    ? accountability(zone, stat, settings, Math.floor(now / 86_400_000))
    : { headline: neutralStatus(zone), body: '' };

  // ── Marks: smoke entries weight=qty, pmo entries weight=2 ──
  const marks: Mark[] = useMemo(
    () =>
      stat.entries
        .filter((e) => e.kind === 'smoke' || e.kind === 'pmo')
        .map((e) => ({
          id: e.id,
          weight: e.kind === 'smoke' ? (e as { qty: number }).qty : 2,
        })),
    [stat.entries],
  );

  // ── 7-day trend ──
  const trend = useMemo(
    () => statsForRange(index, settings, today, 7),
    [index, settings, today],
  );

  // ── Streaks for active habits ──
  const activeHabits = useMemo(
    () =>
      (['smoke', 'pmo', 'sleep'] as const).filter((h) => settings.habits[h]),
    [settings.habits],
  );

  const streakData = useMemo(
    () =>
      activeHabits.map((h) => ({
        habit: h,
        ...calcStreaks(index, settings, today, h),
      })),
    [activeHabits, index, settings, today],
  );

  // ── DaySheet footer ──
  const footerContent = (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}
      accessible
      accessibilityLabel={`Ringkasan: ${stat.smoke} batang, ${stat.pmo.sessions} sesi PMO, pengeluaran ${rupiah(stat.spend)}`}
    >
      {settings.habits.smoke ? (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt variant="caption" color={zones[zone].sub}>
            Rokok
          </Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {stat.smoke}/{settings.smokeTarget}
          </Txt>
        </View>
      ) : null}
      {settings.habits.pmo ? (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt variant="caption" color={zones[zone].sub}>
            {settings.pmoCover ? 'Refleksi' : 'PMO'}
          </Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {settings.pmoCover ? (stat.pmo.sessions > 0 ? 'Tercatat' : 'Bersih') : stat.pmo.sessions}
          </Txt>
        </View>
      ) : null}
      {settings.habits.sleep ? (
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt variant="caption" color={zones[zone].sub}>
            Tidur
          </Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {stat.sleep?.durationMin ? durationMin(stat.sleep.durationMin) : '—'}
          </Txt>
        </View>
      ) : null}
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Txt variant="caption" color={zones[zone].sub}>
          Uang
        </Txt>
        <Txt variant="headline" color={zones[zone].text} num>
          {rupiah(stat.spend, { compact: true })}
        </Txt>
      </View>
    </View>
  );



  return (
    <Screen
      testID="today-dashboard"
      title="Hari Ini"
      eyebrow={keyLabel(today, 'long')}
      right={
        <IconButton
          icon="settings-outline"
          label="Pengaturan"
          tone="fill"
          onPress={() => router.push('/settings')}
        />
      }
    >
      {/* ─── 1. Hero DaySheet ─── */}
      <Section index={0}>
        <View testID="daysheet-card">
          <DaySheet
          zone={zone}
          eyebrow={`ZONA · ${zones[zone].label.toUpperCase()}`}
          headline={msg.headline}
          body={msg.body}
          marks={marks}
          footer={footerContent}
          simulated={simulated}
        />
        </View>
      </Section>

      {/* ─── 2. Zone Simulator Strip (Isolate to Demo Mode) ─── */}
      {state.isDemoMode && (
        <Section index={1}>
          <View style={styles.simStrip}>
            <Txt variant="caption" color={color.ink4} style={{ marginRight: 4 }}>
              Simulasi:
            </Txt>
            {(['auto', ...ZONE_ORDER] as (Zone | 'auto')[]).map((z) => {
              const selected =
                z === 'auto'
                  ? !simulated
                  : simulated && zone === z;
              const accent =
                z === 'auto' ? color.ink3 : zones[z].accent;
              const label =
                z === 'auto'
                  ? 'Auto'
                  : zones[z].label;
              return (
                <PressableScale
                  key={z}
                  onPress={() => {
                    haptic.tap();
                    actions.setZoneOverride(z);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Zona ${label}`}
                  style={[
                    styles.simChip,
                    selected && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  {z !== 'auto' ? (
                    <View
                      style={[
                        styles.simDot,
                        { backgroundColor: selected ? color.white : accent },
                      ]}
                    />
                  ) : null}
                  <Txt
                    variant="caption"
                    weight="600"
                    color={selected ? color.white : color.ink3}
                    style={{ fontSize: 11 }}
                  >
                    {label}
                  </Txt>
                </PressableScale>
              );
            })}
          </View>
        </Section>
      )}

      {/* ─── 3. Quick Actions ─── */}
      <Section index={2}>
        <View style={styles.quickStack}>
          {(settings.habits.smoke || settings.habits.pmo) ? (
            <View style={styles.quickRow}>
              {settings.habits.smoke ? (
                <Button
                  testID="quick-log-smoke"
                  label="Catat Rokok"
                  icon="flame-outline"
                  variant="secondary"
                  size="md"
                  onPress={() => router.push('/log?habit=smoke')}
                  accessibilityHint="Buka form pencatatan rokok"
                  style={{ flex: 1 }}
                />
              ) : null}
              {settings.habits.pmo ? (
                <Button
                  testID="quick-log-pmo"
                  label="Catat PMO"
                  icon="eye-off-outline"
                  variant="secondary"
                  size="md"
                  onPress={() => router.push('/log?habit=pmo')}
                  accessibilityHint="Buka form pencatatan PMO"
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          ) : null}
          <Button
            testID="quick-urge"
            label="Gue Lagi Pengen..."
            icon="pulse-outline"
            variant="accent"
            accent={color.vermilion}
            size="md"
            onPress={() => router.push('/urge')}
            accessibilityHint="Catat dorongan yang sedang dirasakan"
          />
        </View>
      </Section>

      {/* ─── 4. Daily Summary Stats ─── */}
      <Section title="Ringkasan Hari Ini" index={3}>
        <StatGrid>
          {settings.habits.smoke ? (
            <Stat
              label="Rokok"
              value={`${stat.smoke}`}
              sub={`Target: ${settings.smokeTarget} batang`}
              tone={stat.overSmoke > 0 ? color.vermilion : color.ink}
              icon="flame-outline"
            />
          ) : null}
          {settings.habits.pmo ? (
            <Stat
              label={settings.pmoCover ? 'Disiplin Pribadi' : 'PMO'}
              value={settings.pmoCover ? (stat.pmo.sessions > 0 ? 'Tercatat' : 'Bersih') : `${stat.pmo.sessions}`}
              sub={
                settings.pmoCover
                  ? 'Data tersamarkan (Mode Privasi Aktif)'
                  : (stat.pmo.sessions > 0 ? `P:${stat.pmo.p} M:${stat.pmo.m} P+M:${stat.pmo.pmo}` : 'Belum ada sesi')
              }
              tone={stat.overPmo > 0 ? color.vermilion : color.ink}
              icon="eye-off-outline"
            />
          ) : null}
          {settings.habits.sleep ? (
            <Stat
              label="Tidur"
              value={
                stat.sleep?.durationMin
                  ? durationMin(stat.sleep.durationMin)
                  : 'Belum tidur'
              }
              sub={
                stat.sleep
                  ? stat.sleepLate
                    ? `Telat ${durationMin(stat.sleep.lateMin)}`
                    : 'Tepat waktu'
                  : 'Belum dicatat'
              }
              tone={stat.sleepLate ? color.amber : color.ink}
              icon="moon-outline"
            />
          ) : null}
          <Stat
            label="Pengeluaran"
            value={rupiah(stat.spend, { compact: true })}
            sub={stat.purchases > 0 ? `${stat.purchases} pembelian` : 'Belum ada'}
            tone={color.ink}
            icon="wallet-outline"
          />
        </StatGrid>
      </Section>

      {/* ─── 5. Streaks ─── */}
      {streakData.length > 0 ? (
        <Section title="Streak" index={4}>
          <Group>
            {streakData.map((s) => (
              <Row
                key={s.habit}
                icon={HABIT_META[s.habit].icon}
                title={HABIT_META[s.habit].label}
                value={`${s.current} hari`}
                subtitle={`Terpanjang: ${s.longest} hari`}
                chevron={false}
              />
            ))}
          </Group>
        </Section>
      ) : null}

      {/* ─── 6. 7-Day Trend ─── */}
      <Section title="7 Hari Terakhir" index={5}>
        <Card>
          <View style={styles.trendRow} accessible accessibilityLabel="Tren 7 hari terakhir berdasarkan zona">
            {trend.map((d) => {
              const z = zones[d.zone];
              const label = keyLabel(d.key, 'tiny');
              const isToday = d.key === today;
              return (
                <View key={d.key} style={styles.trendItem}>
                  <View
                    style={[
                      styles.trendDot,
                      {
                        backgroundColor: d.verified ? z.accent : color.fill,
                        borderColor: d.verified ? z.accent : color.fillStrong,
                      },
                      isToday && styles.trendDotToday,
                    ]}
                    accessibilityLabel={`${label}: zona ${z.label}`}
                  />
                  <Txt
                    variant="caption"
                    color={isToday ? color.ink : color.ink4}
                    weight={isToday ? '700' : '500'}
                    style={{ fontSize: 10 }}
                  >
                    {label}
                  </Txt>
                </View>
              );
            })}
          </View>
        </Card>
      </Section>

      {/* ─── 7. Navigation Cards ─── */}
      <Section index={6}>
        <Group>
          <Row
            icon="bar-chart-outline"
            title="Riwayat & Statistik"
            subtitle="Lihat tren dan data harian"
            onPress={() => router.push('/history')}
          />
          <Row
            icon="wallet-outline"
            title="Uang & Pengeluaran"
            subtitle="Lacak biaya kebiasaan"
            onPress={() => router.push('/money')}
          />
        </Group>
      </Section>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  simStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  simChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.fillStrong,
    backgroundColor: color.sheet,
  },
  simDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStack: {
    gap: 8,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  trendItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  trendDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  trendDotToday: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
  },
});
