/**
 * Quick Log — unified recording screen for all habits.
 *
 * Opened from Today Dashboard with `?habit=smoke|pmo` to pre-select the tab.
 * Four tabs: Rokok · PMO · Tidur · Beli Rokok.
 */
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp, type NewEntry } from '@/data/store';
import { useToday } from '@/data/hooks';
import { activeSleep, buildIndex, dayStat } from '@/data/selectors';
import {
  SMOKE_TRIGGERS, PMO_TRIGGERS, PMO_LABEL,
  type SmokeTrigger, type PmoTrigger, type PmoType, type Entry,
} from '@/data/types';

import { Segmented, Stepper, TimeAdjuster } from '@/components/ui/controls';
import { Button, Card, Chip, Divider, IconButton, Txt } from '@/components/ui/primitives';
import { Section, StackScroll } from '@/components/ui/layout';
import { useToast } from '@/components/ui/toast';

import { haptic } from '@/lib/haptics';
import { rupiah, duration, clock } from '@/lib/format';
import { color, radius, space } from '@/theme/tokens';

/* ─────────────────── Tab type ─────────────────── */

type Tab = 'smoke' | 'pmo' | 'sleep' | 'purchase';

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'smoke', label: 'Rokok' },
  { value: 'pmo', label: 'PMO' },
  { value: 'sleep', label: 'Tidur' },
  { value: 'purchase', label: 'Beli Rokok' },
];

function paramToTab(p: string | undefined): Tab {
  if (p === 'smoke' || p === 'pmo' || p === 'sleep' || p === 'purchase') return p;
  return 'smoke';
}

/* ─────────────────── Screen ─────────────────── */

export default function LogScreen() {
  const { habit } = useLocalSearchParams<{ habit?: string }>();
  const [tab, setTab] = useState<Tab>(() => paramToTab(habit));
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: color.paper }}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton icon="chevron-back" label="Kembali" onPress={() => router.back()} tone="fill" size={38} />
        <Txt variant="title2" style={{ flex: 1 }} accessibilityRole="header">
          Catat
        </Txt>
      </View>

      <StackScroll contentStyle={{ paddingTop: 0 }}>
        {/* ── Tab switcher ── */}
        <Segmented options={TAB_OPTIONS} value={tab} onChange={setTab} accessibilityLabel="Pilih jenis catatan" />

        {/* ── Tab content ── */}
        {tab === 'smoke' && <SmokeTab />}
        {tab === 'pmo' && <PmoTab />}
        {tab === 'sleep' && <SleepTab />}
        {tab === 'purchase' && <PurchaseTab />}
      </StackScroll>
    </View>
  );
}

/* ═══════════════════ ROKOK TAB ═══════════════════ */

function SmokeTab() {
  const { state, actions } = useApp();
  const { stat, settings } = useToday();
  const toast = useToast();

  const [qty, setQty] = useState(1);
  const [trigger, setTrigger] = useState<SmokeTrigger | undefined>();
  const [ts, setTs] = useState(() => Date.now());

  const logSmoke = useCallback(
    async (count: number) => {
      const entry: NewEntry = { kind: 'smoke', at: ts, qty: count, ...(trigger ? { trigger } : {}) };
      try {
        const id = await actions.add(entry);
        haptic.success();
        toast({
          title: `${count} batang dicatat`,
          icon: 'flame-outline',
          undo: () => actions.remove(id),
        });
        setTs(Date.now());
        setTrigger(undefined);
      } catch (err) {
        haptic.warning();
        toast({
          title: 'Gagal mencatat',
          body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
          tone: 'danger',
        });
      }
    },
    [ts, trigger, actions, toast],
  );

  return (
    <>
      {/* Quick log 1 */}
      <Section title="Catat Cepat" index={0}>
        <Button
          label="Catat 1 Batang"
          icon="add-circle-outline"
          onPress={async () => {
            try {
              const id = await actions.add({ kind: 'smoke', at: Date.now(), qty: 1 });
              haptic.success();
              toast({
                title: '1 batang dicatat',
                icon: 'flame-outline',
                undo: () => actions.remove(id),
              });
            } catch (err) {
              haptic.warning();
              toast({
                title: 'Gagal mencatat',
                body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
                tone: 'danger',
              });
            }
          }}
        />
      </Section>

      {/* Custom quantity */}
      <Section title="Jumlah Kustom" index={1}>
        <Card>
          <View style={styles.centered}>
            <Stepper value={qty} onChange={setQty} min={1} max={20} label="Jumlah batang" />
          </View>
          <View style={{ height: 14 }} />
          <Button
            label={`Catat ${qty} Batang`}
            icon="flame-outline"
            onPress={() => logSmoke(qty)}
            variant="secondary"
          />
        </Card>
      </Section>

      {/* Trigger */}
      <Section title="Pemicu (opsional)" index={2}>
        <View style={styles.chipRow}>
          {SMOKE_TRIGGERS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={trigger === t.value}
              onPress={() => setTrigger(trigger === t.value ? undefined : t.value)}
            />
          ))}
        </View>
      </Section>

      {/* Time adjuster */}
      <Section title="Waktu" index={3}>
        <Card>
          <TimeAdjuster value={ts} onChange={setTs} />
        </Card>
      </Section>

      {/* Today running count */}
      <Section index={4}>
        <Card>
          <View style={styles.statRow}>
            <Txt variant="subhead" color={color.ink3}>Hari ini</Txt>
            <Txt variant="title2" num>{stat.smoke} batang</Txt>
          </View>
          <View style={{ height: 4 }} />
          <Txt variant="footnote" color={color.ink3}>
            Target: {settings.smokeTarget} batang/hari
          </Txt>
        </Card>
      </Section>
    </>
  );
}

/* ═══════════════════ PMO TAB ═══════════════════ */

function PmoTab() {
  const { actions } = useApp();
  const toast = useToast();

  const [trigger, setTrigger] = useState<PmoTrigger | undefined>();
  const [ts, setTs] = useState(() => Date.now());

  const logPmo = useCallback(
    async (type: PmoType) => {
      const entry: NewEntry = { kind: 'pmo', at: ts, type, ...(trigger ? { trigger } : {}) };
      try {
        const id = await actions.add(entry);
        haptic.error();
        const label = PMO_LABEL[type].long;
        toast({
          title: `${label} dicatat`,
          icon: 'eye-off-outline',
          tone: color.vermilion,
          undo: () => actions.remove(id),
        });
        setTs(Date.now());
        setTrigger(undefined);
      } catch (err) {
        haptic.warning();
        toast({
          title: 'Gagal mencatat',
          body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
          tone: 'danger',
        });
      }
    },
    [ts, trigger, actions, toast],
  );

  return (
    <>
      <Section title="Jenis Sesi" index={0}>
        <Card style={{ gap: 10 }}>
          <Button
            label="Pornografi"
            icon="eye-off-outline"
            variant="danger"
            onPress={() => logPmo('p')}
          />
          <Button
            label="Masturbasi"
            icon="eye-off-outline"
            variant="danger"
            onPress={() => logPmo('m')}
          />
          <Divider />
          <Button
            label="Sesi Gabungan (P+M)"
            icon="eye-off-outline"
            variant="danger"
            onPress={() => logPmo('pmo')}
          />
          <Txt variant="footnote" color={color.ink3} center>
            Dicatat sebagai satu sesi, bukan dua.
          </Txt>
        </Card>
      </Section>

      {/* Trigger */}
      <Section title="Pemicu (opsional)" index={1}>
        <View style={styles.chipRow}>
          {PMO_TRIGGERS.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={trigger === t.value}
              onPress={() => setTrigger(trigger === t.value ? undefined : t.value)}
            />
          ))}
        </View>
      </Section>

      {/* Time adjuster */}
      <Section title="Waktu" index={2}>
        <Card>
          <TimeAdjuster value={ts} onChange={setTs} />
        </Card>
      </Section>
    </>
  );
}

/* ═══════════════════ TIDUR TAB ═══════════════════ */

function SleepTab() {
  const { state, actions } = useApp();
  const { now } = useToday();
  const toast = useToast();

  const active = useMemo(() => activeSleep(state.entries), [state.entries]);

  const [startTs, setStartTs] = useState(() => Date.now());
  const [wakeTs, setWakeTs] = useState(() => Date.now());

  const startSleep = useCallback(async () => {
    const entry: NewEntry = { kind: 'sleep', at: startTs };
    try {
      const id = await actions.add(entry);
      haptic.success();
      toast({
        title: 'Mulai tidur dicatat',
        icon: 'moon-outline',
        body: `Mulai: ${clock(startTs)}`,
        undo: () => actions.remove(id),
      });
      setStartTs(Date.now());
    } catch (err) {
      haptic.warning();
      toast({
        title: 'Gagal mencatat',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  }, [startTs, actions, toast]);

  const wakeUp = useCallback(async () => {
    if (!active) return;
    try {
      await actions.update(active.id, { end: wakeTs });
      haptic.success();
      const dur = duration(wakeTs - active.at);
      toast({
        title: 'Bangun dicatat',
        icon: 'sunny-outline',
        body: `Durasi tidur: ${dur}`,
      });
      setWakeTs(Date.now());
    } catch (err) {
      haptic.warning();
      toast({
        title: 'Gagal memperbarui',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  }, [active, wakeTs, actions, toast]);

  return (
    <>
      <Section title="Status Tidur" index={0}>
        <Card style={{ gap: 14 }}>
          {active ? (
            <>
              <View style={styles.statRow}>
                <Txt variant="subhead" color={color.ink3}>Sedang tidur sejak</Txt>
                <Txt variant="headline" num>{clock(active.at)}</Txt>
              </View>
              <View style={styles.statRow}>
                <Txt variant="subhead" color={color.ink3}>Sudah</Txt>
                <Txt variant="headline" num>{duration(now - active.at)}</Txt>
              </View>
              <Divider />
              <Button
                label="Bangun"
                icon="sunny-outline"
                variant="primary"
                onPress={wakeUp}
              />
              <View style={{ marginTop: 4 }}>
                <TimeAdjuster
                  value={wakeTs}
                  onChange={setWakeTs}
                  label="Waktu bangun"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.centered}>
                <Txt variant="subhead" color={color.ink3} center>
                  Tidak ada sesi tidur aktif.
                </Txt>
              </View>
              <Button
                label="Mulai Tidur"
                icon="moon-outline"
                variant="primary"
                onPress={startSleep}
              />
              <View style={{ marginTop: 4 }}>
                <TimeAdjuster
                  value={startTs}
                  onChange={setStartTs}
                  label="Waktu mulai"
                />
              </View>
            </>
          )}
        </Card>
      </Section>
    </>
  );
}

/* ═══════════════════ BELI ROKOK TAB ═══════════════════ */

const UNIT_OPTIONS: { value: 'bungkus' | 'batang'; label: string }[] = [
  { value: 'bungkus', label: 'Bungkus' },
  { value: 'batang', label: 'Batang' },
];

const BRAND_CHIPS = ['Surya 16', 'Gudang Garam', 'Sampoerna', 'Djarum', 'Marlboro', 'LA', 'Esse', 'Lainnya'];

function PurchaseTab() {
  const { state, actions } = useApp();
  const { settings } = useToday();
  const toast = useToast();

  const [unit, setUnit] = useState<'bungkus' | 'batang'>('bungkus');
  const [qty, setQty] = useState(1);
  const defaultPrice = unit === 'bungkus' ? settings.packPrice : settings.singlePrice;
  const [price, setPrice] = useState(defaultPrice);
  const [brand, setBrand] = useState<string | undefined>();
  const [ts, setTs] = useState(() => Date.now());

  // Sync default price when unit changes
  const handleUnitChange = useCallback(
    (u: 'bungkus' | 'batang') => {
      setUnit(u);
      setPrice(u === 'bungkus' ? settings.packPrice : settings.singlePrice);
      setQty(1);
    },
    [settings.packPrice, settings.singlePrice],
  );

  const logPurchase = useCallback(async () => {
    const totalPrice = price * qty;
    const entry: NewEntry = {
      kind: 'purchase',
      at: ts,
      unit,
      qty,
      price: totalPrice,
      ...(brand ? { brand } : {}),
    };
    try {
      const id = await actions.add(entry);
      haptic.success();
      toast({
        title: 'Pembelian dicatat',
        icon: 'cart-outline',
        body: `${qty} ${unit} — ${rupiah(totalPrice)}`,
        undo: () => actions.remove(id),
      });
      setTs(Date.now());
      setBrand(undefined);
      setQty(1);
    } catch (err) {
      haptic.warning();
      toast({
        title: 'Gagal mencatat pembelian',
        body: (err as Error)?.message || 'Terjadi kesalahan saat menyimpan.',
        tone: 'danger',
      });
    }
  }, [ts, unit, qty, price, brand, actions, toast]);

  return (
    <>
      {/* Unit selector */}
      <Section title="Satuan" index={0}>
        <Segmented
          options={UNIT_OPTIONS}
          value={unit}
          onChange={handleUnitChange}
          size="sm"
          accessibilityLabel="Satuan pembelian"
        />
      </Section>

      {/* Quantity */}
      <Section title="Jumlah" index={1}>
        <Card>
          <View style={styles.centered}>
            <Stepper
              value={qty}
              onChange={setQty}
              min={1}
              max={unit === 'bungkus' ? 10 : 40}
              label={`Jumlah ${unit}`}
            />
          </View>
        </Card>
      </Section>

      {/* Price */}
      <Section title="Harga per satuan" index={2}>
        <Card>
          <View style={styles.centered}>
            <Stepper
              value={price}
              onChange={setPrice}
              min={500}
              max={100_000}
              step={500}
              format={(v) => rupiah(v)}
              label="Harga"
            />
          </View>
          <View style={{ height: 8 }} />
          <Txt variant="footnote" color={color.ink3} center>
            Total: {rupiah(price * qty)}
          </Txt>
        </Card>
      </Section>

      {/* Brand */}
      <Section title="Merek (opsional)" index={3}>
        <View style={styles.chipRow}>
          {BRAND_CHIPS.map((b) => (
            <Chip
              key={b}
              label={b}
              selected={brand === b}
              onPress={() => setBrand(brand === b ? undefined : b)}
            />
          ))}
        </View>
      </Section>

      {/* Time adjuster */}
      <Section title="Waktu" index={4}>
        <Card>
          <TimeAdjuster value={ts} onChange={setTs} />
        </Card>
      </Section>

      {/* Submit */}
      <Section index={5}>
        <Button
          label="Catat Pembelian"
          icon="cart-outline"
          onPress={logPurchase}
        />
      </Section>
    </>
  );
}

/* ─────────────────── Styles ─────────────────── */

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: space.md,
    paddingBottom: 12,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
