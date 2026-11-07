/**
 * TODAY DASHBOARD — the main screen of KuroStop.
 *
 * Reading order follows the job of the screen:
 *   1. Where today stands          → DaySheet (the signature sheet)
 *   2. What you can do about it    → log actions + urge intervention
 *   3. The numbers, in one block   → summary metrics
 *   4. What the week looks like    → seven-day ledger
 *
 * Navigation rows were removed: History and Money already live in the
 * "Lainnya" tab, so repeating them here only added noise.
 */
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { DaySheet, type Mark } from '@/components/consequence/DaySheet';
import {
  Screen, Section, StatGrid, Stat, Group, Row,
} from '@/components/ui/layout';
import {
  Button, Card, IconButton, PressableScale, Txt, Icon,
} from '@/components/ui/primitives';
import { useToday } from '@/data/hooks';
import { accountability, neutralStatus } from '@/data/messages';
import { statsForRange, streaks as calcStreaks } from '@/data/selectors';
import { useApp } from '@/data/store';
import { HABIT_META } from '@/data/types';
import { durationMin, keyLabel, keyParts, rupiah } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import {
  color, radius, space, zones, ZONE_ORDER, type Zone,
} from '@/theme/tokens';
import { logMilestone } from '@/lib/milestone';

/* ════════════════════════════════════════════════════════════════ */

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BAR_HEIGHT: Record<Zone, number> = { clear: 8, warning: 14, danger: 20, critical: 26 };

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

  const trendLabel = trend
    .map((d) => `${keyLabel(d.key, 'short')}: ${d.verified ? `zona ${zones[d.zone].label}` : 'tanpa data'}`)
    .join('. ');

  // ── DaySheet footer ──
  const footerContent = (
    <View
      style={styles.metrics}
      accessible
      accessibilityLabel={`Ringkasan: ${stat.smoke} batang, ${stat.pmo.sessions} sesi PMO, pengeluaran ${rupiah(stat.spend)}`}
    >
      {settings.habits.smoke ? (
        <View style={styles.metric}>
          <Txt variant="caption" color={zones[zone].sub}>Rokok</Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {stat.smoke}/{settings.smokeTarget}
          </Txt>
        </View>
      ) : null}
      {settings.habits.pmo ? (
        <View style={styles.metric}>
          <Txt variant="caption" color={zones[zone].sub}>
            {settings.pmoCover ? 'Refleksi' : 'PMO'}
          </Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {settings.pmoCover ? (stat.pmo.sessions > 0 ? 'Tercatat' : 'Bersih') : stat.pmo.sessions}
          </Txt>
        </View>
      ) : null}
      {settings.habits.sleep ? (
        <View style={styles.metric}>
          <Txt variant="caption" color={zones[zone].sub}>Tidur</Txt>
          <Txt variant="headline" color={zones[zone].text} num>
            {stat.sleep?.durationMin ? durationMin(stat.sleep.durationMin) : '—'}
          </Txt>
        </View>
      ) : null}
      <View style={styles.metric}>
        <Txt variant="caption" color={zones[zone].sub}>Uang</Txt>
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
      {/* ─── 1. Hero: where today stands ─── */}
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

      {/* ─── 2. Actions: log fast, or interrupt an urge ─── */}
      <Section index={1}>
        <View style={styles.actions}>
          {(settings.habits.smoke || settings.habits.pmo) ? (
            <View style={styles.actionRow}>
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
          {/* One prominent action, and it is the one that matters mid-urge.
              Ink, not vermilion: an urge is not a recorded failure. */}
          <Button
            testID="quick-urge"
            label="Gue Lagi Pengen…"
            icon="pulse-outline"
            variant="primary"
            size="md"
            onPress={() => router.push('/urge')}
            accessibilityHint="Buka latihan menahan dorongan"
          />
        </View>
      </Section>

      {/* ─── 3. Demo-only zone simulator ─── */}
      {state.isDemoMode && (
        <Section index={2}>
          <View style={styles.simStrip}>
            <Txt variant="caption" color={color.ink3} style={{ marginRight: 2 }}>
              Simulasi
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
                  >
                    {label}
                  </Txt>
                </PressableScale>
              );
            })}
          </View>
        </Section>
      )}

      {/* ─── 4. One ledger block for today's numbers ─── */}
      <Section title="Ringkasan Hari Ini" index={3}>
        <StatGrid>
          {settings.habits.smoke ? (
            <Stat
              label="Rokok"
              value={`${stat.smoke}`}
              sub={`Target ${settings.smokeTarget} batang`}
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
                  ? 'Data tersamarkan'
                  : (stat.pmo.sessions > 0 ? `P:${stat.pmo.p} · M:${stat.pmo.m} · P+M:${stat.pmo.pmo}` : 'Belum ada sesi')
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
                subtitle={`Terpanjang ${s.longest} hari`}
                chevron={false}
              />
            ))}
          </Group>
        </Section>
      ) : null}

      {/* ─── 6. Seven-day ledger ─── */}
      <Section title="7 Hari Terakhir" index={5}>
        <Card padded={false}>
          <View
            style={styles.trendRow}
            accessible
            accessibilityLabel={`Tren tujuh hari. ${trendLabel}`}
          >
            {trend.map((d) => {
              const z = zones[d.zone];
              const isToday = d.key === today;
              const h = d.verified ? BAR_HEIGHT[d.zone] : 8;
              return (
                <View key={d.key} style={styles.trendItem}>
                  <View style={[styles.trendTrack, isToday && styles.trendTrackToday]}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height: h,
                          backgroundColor: d.verified ? z.accent : 'transparent',
                          borderWidth: d.verified ? 0 : 1,
                          borderColor: color.fillStrong,
                        },
                      ]}
                    />
                  </View>
                  <Txt
                    variant="caption"
                    color={isToday ? color.ink : color.ink3}
                    weight={isToday ? '700' : '500'}
                  >
                    {isToday ? 'Hari' : DOW[keyParts(d.key).dow]}
                  </Txt>
                </View>
              );
            })}
          </View>
        </Card>
      </Section>

      {/* Legend is text, so zone is never carried by colour alone. */}
      <View style={styles.legend} accessible accessibilityLabel="Legenda: tinggi batang menunjukkan tingkat zona dari bersih ke kritis">
        <Icon name="information-circle-outline" size={14} color={color.ink3} />
        <Txt variant="footnote" color={color.ink3} style={{ flex: 1 }}>
          Tinggi batang menunjukkan zona harian: rendah = bersih, tinggi = kritis. Hari tanpa data tampil kosong.
        </Txt>
      </View>
    </Screen>
  );
}

/* ════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  actions: { gap: space.xs },
  actionRow: { flexDirection: 'row', gap: space.xs },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  metric: { alignItems: 'center', gap: 2 },
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
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.fillStrong,
    backgroundColor: color.sheet,
  },
  simDot: { width: 7, height: 7, borderRadius: 4 },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  trendItem: { alignItems: 'center', gap: 6, flex: 1 },
  trendTrack: {
    height: 30,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 1,
  },
  trendTrackToday: {
    borderBottomWidth: 1.5,
    borderBottomColor: color.ink,
  },
  trendBar: { width: 8, borderRadius: 4 },
  legend: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingHorizontal: 2 },
});
