/**
 * MONEY — what the habit costs, and what stopping would keep.
 *
 * Reading order: the one number that matters (saved this month), the action
 * that keeps the ledger honest (record a purchase), then the supporting
 * arithmetic. Savings are shown as a range, never as a promise.
 */
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useToday } from '@/data/hooks';
import {
  baselineDaily, statsForRange, sum,
} from '@/data/selectors';
import { calculateEligiblePeriodBaseline } from '@/domain/finance';
import type { PurchaseEntry } from '@/data/types';
import { rangeKeys, rupiah, stampLabel } from '@/lib/format';
import { color } from '@/theme/tokens';
import {
  EmptyState, Group, Row, Screen, Section, Stat, StatGrid,
} from '@/components/ui/layout';
import { Badge, Button, Card, Divider, IconButton, Txt } from '@/components/ui/primitives';

export default function MoneyScreen() {
  const { today, index, stat, settings } = useToday();
  const s = settings;

  // ─── baseline math ─────────────────────────────────────────
  // Daily baseline: baselinePerDay * (packPrice / packSize)
  const dailyBase = useMemo(() => baselineDaily(s), [s]);
  const pricePerStick = s.packSize > 0 ? s.packPrice / s.packSize : 0;
  const weekKeys = useMemo(() => rangeKeys(today, 7), [today]);
  const monthKeys = useMemo(() => rangeKeys(today, 30), [today]);

  // ─── 7-day & 30-day spending & savings ─────────────────────
  const week = useMemo(() => statsForRange(index, s, today, 7), [index, s, today]);
  const month = useMemo(() => statsForRange(index, s, today, 30), [index, s, today]);

  const weekActualSpend = sum(week, (d) => d.spend);
  const weekBaselineSpend = useMemo(
    () => calculateEligiblePeriodBaseline(dailyBase, weekKeys, s.baselineEffectiveDate),
    [dailyBase, weekKeys, s.baselineEffectiveDate],
  );
  const weekSaved = weekBaselineSpend - weekActualSpend;

  const monthActualSpend = sum(month, (d) => d.spend);
  const monthBaselineSpend = useMemo(
    () => calculateEligiblePeriodBaseline(dailyBase, monthKeys, s.baselineEffectiveDate),
    [dailyBase, monthKeys, s.baselineEffectiveDate],
  );
  const monthSaved = monthBaselineSpend - monthActualSpend;

  // ─── recent purchases ──────────────────────────────────────
  const recentPurchases = useMemo(() => {
    const list: PurchaseEntry[] = [];
    for (const [, entries] of index) {
      for (const e of entries) {
        if (e.kind === 'purchase') list.push(e);
      }
    }
    return list.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [index]);

  // ─── future savings projection ─────────────────────────────
  const projection = [
    { label: '3 bulan', value: dailyBase * 90 },
    { label: '6 bulan', value: dailyBase * 180 },
    { label: '1 tahun', value: dailyBase * 365 },
  ];

  const isSaving = monthSaved >= 0;

  return (
    <Screen
      title="Keuangan"
      eyebrow="PENGELUARAN & TABUNGAN"
      hasTabBar={false}
      right={<IconButton icon="close" label="Tutup" tone="fill" onPress={() => router.back()} />}
    >
      {/* ─── The headline number ─── */}
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="eyebrow" color={color.ink3}>Tabungan 30 Hari Terakhir</Txt>
            <Txt variant="hero" num color={isSaving ? color.jade : color.vermilion}>
              {rupiah(monthSaved, { compact: true })}
            </Txt>
            <Txt variant="subhead" color={color.ink3}>
              {isSaving
                ? `Di bawah baseline ${s.baselinePerDay} btg/hari`
                : `Melebihi baseline ${s.baselinePerDay} btg/hari sebesar ${rupiah(Math.abs(monthSaved))}`}
            </Txt>
          </View>
          <Badge
            label={isSaving ? 'HEMAT' : 'DEFISIT'}
            fg={isSaving ? color.jade : color.vermilion}
            bg={isSaving ? color.jadeTint : color.vermilionTint}
          />
        </View>

        <Divider />

        <View style={styles.split}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="eyebrow" color={color.ink3}>Belanja Riil</Txt>
            <Txt variant="title2" weight="600" num>{rupiah(monthActualSpend)}</Txt>
          </View>
          <View style={styles.splitCell}>
            <Txt variant="eyebrow" color={color.ink3}>Baseline</Txt>
            <Txt variant="title2" weight="600" num color={color.ink3}>{rupiah(monthBaselineSpend)}</Txt>
          </View>
        </View>
      </Card>

      {/* ─── The one action on this screen ─── */}
      <Button
        label="Catat Pembelian"
        icon="cart-outline"
        onPress={() => router.push('/log?habit=purchase')}
        accessibilityHint="Buka form pencatatan pembelian rokok"
      />

      {/* ─── Supporting numbers ─── */}
      <Section title="Ringkasan" index={0}>
        <StatGrid>
          <Stat
            label="Hari Ini"
            value={rupiah(stat.spend)}
            sub={stat.spend === 0 ? 'Belum ada pembelian' : `${stat.purchases} transaksi`}
            tone={stat.spend === 0 ? color.jade : color.ink}
            icon="today-outline"
          />
          <Stat
            label="7 Hari"
            value={rupiah(weekActualSpend)}
            sub={weekSaved >= 0 ? `Hemat ${rupiah(weekSaved, { compact: true })}` : `Lebih ${rupiah(Math.abs(weekSaved), { compact: true })}`}
            tone={weekSaved < 0 ? color.vermilion : color.ink}
            icon="calendar-outline"
          />
          <Stat
            label="Baseline Harian"
            value={rupiah(dailyBase)}
            sub={`${s.baselinePerDay} batang`}
            icon="calculator-outline"
          />
          <Stat
            label="Harga per Batang"
            value={rupiah(pricePerStick)}
            sub={`${rupiah(s.packPrice, { compact: true })} / ${s.packSize} btg`}
            icon="pricetag-outline"
          />
        </StatGrid>
      </Section>

      {/* ─── Projection, clearly framed as hypothetical ─── */}
      <Section title="Proyeksi Hipotetis" index={1}>
        <Card padded={false}>
          <View style={styles.projection}>
            {projection.map((p, i) => (
              <View key={p.label} style={[styles.projectionCell, i > 0 && styles.projectionDivider]}>
                <Txt variant="eyebrow" color={color.ink3}>{p.label}</Txt>
                <Txt variant="title2" weight="600" num>{rupiah(p.value, { compact: true })}</Txt>
              </View>
            ))}
          </View>
          <View style={styles.projectionFoot}>
            <Txt variant="footnote" color={color.ink3}>
              Bila konsumsi berhenti dari titik ini, dibandingkan baseline {s.baselinePerDay} btg/hari.
            </Txt>
          </View>
        </Card>
      </Section>

      {/* ─── Ledger of purchases ─── */}
      <Section title="Pembelian Terakhir" index={2}>
        {recentPurchases.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Belum ada transaksi"
            body="Saat lo membeli rokok, catat di sini agar neraca pengeluaran tetap jujur."
          />
        ) : (
          <Group>
            {recentPurchases.map((e) => (
              <Row
                key={e.id}
                title={`${e.qty} ${e.unit}${e.brand ? ` · ${e.brand}` : ''}`}
                subtitle={stampLabel(e.at)}
                value={rupiah(e.price)}
                icon="receipt-outline"
                chevron={false}
              />
            ))}
          </Group>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  split: { flexDirection: 'row', gap: 16 },
  splitCell: {
    flex: 1,
    gap: 2,
    paddingLeft: 16,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: color.hair,
  },
  projection: { flexDirection: 'row' },
  projectionCell: { flex: 1, padding: 14, gap: 4 },
  projectionDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: color.hair,
  },
  projectionFoot: { paddingHorizontal: 14, paddingBottom: 14 },
});
