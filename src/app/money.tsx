import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useToday } from '@/data/hooks';
import {
  baselineDaily, entriesInRange, statsForRange, sum,
} from '@/data/selectors';
import { calculateEligiblePeriodBaseline } from '@/domain/finance';
import type { PurchaseEntry } from '@/data/types';
import {
  clock, decimal, rangeKeys, relativeDay, rupiah, stampLabel,
} from '@/lib/format';
import { color, radius, space } from '@/theme/tokens';
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
  const savings3mo = dailyBase * 90;
  const savings6mo = dailyBase * 180;
  const savings1yr = dailyBase * 365;

  const isSaving = monthSaved >= 0;

  return (
    <Screen
      title="Keuangan"
      eyebrow="PENGELUARAN & TABUNGAN"
      right={
        <IconButton
          icon="close"
          label="Tutup"
          tone="fill"
          onPress={() => router.back()}
        />
      }
    >
      {/* Hero Financial Card */}
      <Card>
        <View style={{ gap: 14 }}>
          <View style={styles.heroRow}>
            <View style={{ gap: 2, flex: 1 }}>
              <Txt variant="footnote" color={color.ink3}>Estimasi Tabungan (30 Hari Terakhir)</Txt>
              <Txt variant="hero" color={isSaving ? color.jade : color.vermilion}>
                {rupiah(monthSaved, { compact: true })}
              </Txt>
              <Txt variant="subhead" color={color.ink2}>
                {isSaving
                  ? `Uang yang berhasil diselamatkan dibandingkan batas baseline (${s.baselinePerDay} btg/hari)`
                  : `Pengeluaran riil melebihi baseline (${s.baselinePerDay} btg/hari) sebesar ${rupiah(Math.abs(monthSaved))}`}
              </Txt>
            </View>
            <Badge
              label={isSaving ? 'HEMAT' : 'DEFISIT'}
              fg={isSaving ? color.jade : color.vermilion}
              bg={isSaving ? color.jadeTint : color.vermilionTint}
            />
          </View>

          <Divider />

          <View style={styles.summarySplit}>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption" color={color.ink3}>TOTAL BELANJA (30 HARI)</Txt>
              <Txt variant="title2" weight="700" color={color.vermilion}>
                {rupiah(monthActualSpend)}
              </Txt>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="caption" color={color.ink3}>BASELINE (30 HARI)</Txt>
              <Txt variant="title2" weight="700" color={color.ink3}>
                {rupiah(monthBaselineSpend)}
              </Txt>
            </View>
          </View>
        </View>
      </Card>

      {/* Quick Action Button */}
      <Button
        label="Catat Pembelian Rokok"
        icon="cart-outline"
        variant="secondary"
        onPress={() => router.push('/log?habit=smoke')}
      />

      {/* Periodic Breakdown */}
      <Section title="Perbandingan Pengeluaran">
        <StatGrid>
          <Stat
            label="Belanja Hari Ini"
            value={rupiah(stat.spend)}
            sub={stat.spend === 0 ? 'Belum ada pembelian hari ini' : `${stat.purchases} kali transaksi`}
            tone={stat.spend === 0 ? color.jade : color.ink}
            icon="today-outline"
          />
          <Stat
            label="Belanja 7 Hari"
            value={rupiah(weekActualSpend)}
            sub={`Hemat ${rupiah(weekSaved, { compact: true })} dari baseline`}
            icon="calendar-outline"
          />
          <Stat
            label="Baseline Harian"
            value={rupiah(dailyBase)}
            sub={`${s.baselinePerDay} batang @ ${rupiah(s.packPrice / s.packSize)}`}
            icon="calculator-outline"
          />
          <Stat
            label="Baseline (30 Hari)"
            value={rupiah(monthBaselineSpend)}
            sub="Ekspektasi pengeluaran periode ini"
            icon="trending-up-outline"
          />
        </StatGrid>
      </Section>

      {/* Projection of Potential Savings */}
      <Section title="Proyeksi Tabungan Masa Depan (Hipotetis)">
        <Card>
          <View style={{ gap: 12 }}>
            <Txt variant="subhead" color={color.ink2}>
              Bila lo sama sekali tidak merokok dari titik ini, estimasi tabungan hipotetis dibandingkan baseline:
            </Txt>
            <View style={styles.projectionGrid}>
              <View style={styles.projectionBox}>
                <Txt variant="caption" color={color.ink3}>3 BULAN</Txt>
                <Txt variant="headline" weight="700" color={color.jade}>
                  {rupiah(savings3mo, { compact: true })}
                </Txt>
              </View>
              <View style={styles.projectionBox}>
                <Txt variant="caption" color={color.ink3}>6 BULAN</Txt>
                <Txt variant="headline" weight="700" color={color.jade}>
                  {rupiah(savings6mo, { compact: true })}
                </Txt>
              </View>
              <View style={styles.projectionBox}>
                <Txt variant="caption" color={color.ink3}>1 TAHUN</Txt>
                <Txt variant="headline" weight="700" color={color.jade}>
                  {rupiah(savings1yr, { compact: true })}
                </Txt>
              </View>
            </View>
          </View>
        </Card>
      </Section>

      {/* Recent Purchases List */}
      <Section title="Riwayat Pembelian Terakhir">
        {recentPurchases.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Belum Ada Transaksi"
            body="Saat lo membeli rokok (bungkus atau eceran), catat di sini agar neraca pengeluaran tetap jujur."
          />
        ) : (
          <Group>
            {recentPurchases.map((e) => (
              <Row
                key={e.id}
                title={`${rupiah(e.price)}`}
                subtitle={`${e.qty} ${e.unit}${e.brand ? ` (${e.brand})` : ''} · ${stampLabel(e.at)}`}
                icon="cash-outline"
              />
            ))}
          </Group>
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summarySplit: {
    flexDirection: 'row',
    gap: 16,
  },
  projectionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  projectionBox: {
    flex: 1,
    backgroundColor: color.fill,
    padding: 12,
    borderRadius: radius.sm,
    gap: 4,
  },
});
