import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useApp } from '@/data/store';
import { SAMPLE_BY_INTENSITY } from '@/data/messages';
import type { Intensity, MotionPref, Sensitivity } from '@/data/types';
import { minutesToClock, rupiah } from '@/lib/format';
import { color, space } from '@/theme/tokens';
import { ClockStepper, Segmented, Stepper, Toggle } from '@/components/ui/controls';
import {
  Group, Row, Screen, Section,
} from '@/components/ui/layout';
import { Card, IconButton, Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { authenticateAsync } from '@/lib/biometrics';
import { requestNotificationPermission, syncNotificationSchedules } from '@/lib/notifications';
import { createBackup, restoreBackup, validateBackup } from '@/lib/backup';

export default function SettingsScreen() {
  const { state, actions } = useApp();
  const s = state.settings;
  const toast = useToast();

  const handleSensitivityChange = (sensitivity: Sensitivity) => {
    actions.setSettings({ sensitivity });
    toast({ title: 'Sensitivitas Diubah', body: `Zona konsekuensi disetel ke mode ${sensitivity}` });
  };

  const handleIntensityChange = (intensity: Intensity) => {
    actions.setSettings({ intensity });
    toast({ title: 'Intensitas Pesan Diubah', body: `Gaya kritik disetel ke ${intensity}` });
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Data Contoh?',
      'Data aktivitas akan diisi ulang dengan riwayat contoh simulasi 75 hari.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            actions.resetDemo();
            toast({ title: 'Data Demo Direset', body: 'Riwayat simulasi telah dimuat ulang.' });
          },
        },
      ],
    );
  };

  const handleWipeData = () => {
    Alert.alert(
      'Hapus Seluruh Data?',
      'Semua catatan aktivitas di database lokal akan dihapus permanen. Pengaturan tetap disimpan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus Bersih',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.wipe();
              toast({ title: 'Data Dikosongkan', body: 'Database catatan kini dalam keadaan bersih.' });
            } catch (err) {
              toast({ title: 'Gagal mengosongkan data', body: (err as Error)?.message, tone: 'danger' });
            }
          },
        },
      ],
    );
  };

  const handleRestartOnboarding = () => {
    actions.restartOnboarding();
    router.replace('/onboarding');
  };

  const handleToggleAppLock = async (enable: boolean) => {
    if (enable) {
      const res = await authenticateAsync('Verifikasi biometrik untuk mengaktifkan kunci aplikasi');
      if (res.success) {
        await actions.setSettings({ appLock: true });
        toast({ title: 'Kunci Aplikasi Aktif', body: 'Face ID / Touch ID berhasil dikonfigurasi.' });
      } else {
        toast({
          title: 'Gagal Mengaktifkan',
          body: res.error || 'Verifikasi biometrik tidak berhasil atau dibatalkan.',
          tone: 'danger',
        });
      }
    } else {
      const res = await authenticateAsync('Verifikasi biometrik untuk menonaktifkan kunci aplikasi');
      if (res.success) {
        await actions.setSettings({ appLock: false });
        toast({ title: 'Kunci Aplikasi Dimatikan', body: 'Autentikasi biometrik dinonaktifkan.' });
      } else {
        toast({
          title: 'Gagal Mematikan',
          body: 'Verifikasi identitas diperlukan untuk menonaktifkan kunci aplikasi.',
          tone: 'danger',
        });
      }
    }
  };

  const handleToggleNotif = async (key: 'bedtime' | 'daily' | 'weekly', value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Izin Notifikasi Diperlukan',
          'Aktifkan izin notifikasi di Pengaturan iOS agar KuroStop dapat mengirimkan pengingat waktu tidur dan evaluasi.',
        );
        return;
      }
    }
    const newNotif = { ...s.notif, [key]: value };
    await actions.setSettings({ notif: newNotif });
    await syncNotificationSchedules({ ...s, notif: newNotif });
    toast({
      title: value ? 'Pengingat Diaktifkan' : 'Pengingat Dinonaktifkan',
      body: 'Preferensi notifikasi lokal berhasil disimpan.',
    });
  };

  const handleExportBackup = async () => {
    const db = actions.getDatabase();
    if (!db) {
      toast({ title: 'Gagal Ekspor', body: 'Database tidak siap.', tone: 'danger' });
      return;
    }
    try {
      const backup = await createBackup(db);
      const totalEvents =
        backup.data.smoking.length +
        backup.data.pmo.length +
        backup.data.sleep.length +
        backup.data.purchases.length +
        backup.data.urges.length +
        backup.data.checkins.length;
      Alert.alert(
        'Cadangan Berhasil Dibuat',
        `Format: KuroStop JSON v${backup.version}\nTotal aktivitas: ${totalEvents} catatan\nChecksum: ${backup.checksum}\nWaktu: ${new Date(backup.exportedAt).toLocaleString('id-ID')}\n\nCadangan tersimpan aman dan siap digunakan sebelum melakukan pembaruan sideload IPA.`,
        [{ text: 'Mengerti' }],
      );
    } catch (err) {
      toast({ title: 'Gagal membuat cadangan', body: (err as Error)?.message, tone: 'danger' });
    }
  };

  return (
    <Screen
      title="Pengaturan"
      eyebrow="PREFERENSI & ATURAN"
      right={
        <IconButton
          icon="close"
          label="Tutup"
          tone="fill"
          onPress={() => router.back()}
        />
      }
    >

      {/* Target Harian */}
      <Section title="Target Batas Harian">
        <Group>
          <Row
            title="Batas Rokok per Hari"
            subtitle="Maksimal batang sebelum masuk zona peringatan"
            right={
              <Stepper
                value={s.smokeTarget}
                min={0}
                max={30}
                compact
                format={(v) => `${v} btg`}
                onChange={(smokeTarget) => actions.setSettings({ smokeTarget })}
              />
            }
          />
          <Row
            title="Batas Sesi PMO per Hari"
            subtitle="Target ideal mutlak adalah 0"
            right={
              <Stepper
                value={s.pmoTarget}
                min={0}
                max={5}
                compact
                format={(v) => `${v} sesi`}
                onChange={(pmoTarget) => actions.setSettings({ pmoTarget })}
              />
            }
          />
          <Row
            title="Target Jam Tidur"
            subtitle="Waktu masuk kamar / mati layar"
            right={
              <ClockStepper
                value={s.bedtime}
                onChange={(bedtime) => actions.setSettings({ bedtime })}
              />
            }
          />
          <Row
            title="Target Jam Bangun"
            subtitle="Jadwal bangun pagi"
            right={
              <ClockStepper
                value={s.wake}
                onChange={(wake) => actions.setSettings({ wake })}
              />
            }
          />
          <Row
            title="Toleransi Keterlambatan"
            subtitle="Batas menit keterlambatan tidur yang masih ditoleransi"
            right={
              <Stepper
                value={s.lateGrace}
                min={0}
                max={60}
                step={5}
                compact
                format={(v) => `${v} mnt`}
                onChange={(lateGrace) => actions.setSettings({ lateGrace })}
              />
            }
          />
        </Group>
      </Section>

      {/* Baseline Keuangan */}
      <Section title="Baseline Rokok & Biaya">
        <Group>
          <Row
            title="Konsumsi Biasa (Baseline)"
            subtitle="Rata-rata batang yang biasa dihabiskan per hari"
            right={
              <Stepper
                value={s.baselinePerDay}
                min={1}
                max={60}
                compact
                format={(v) => `${v} btg`}
                onChange={(baselinePerDay) => actions.setSettings({ baselinePerDay })}
              />
            }
          />
          <Row
            title="Harga 1 Bungkus"
            subtitle="Harga beli reguler merk utama lo"
            right={
              <Stepper
                value={s.packPrice}
                min={15000}
                max={60000}
                step={500}
                compact
                format={(v) => rupiah(v, { compact: true })}
                onChange={(packPrice) => actions.setSettings({ packPrice })}
              />
            }
          />
          <Row
            title="Isi per Bungkus"
            subtitle="Jumlah batang dalam satu kemasan"
            right={
              <Stepper
                value={s.packSize}
                min={10}
                max={24}
                step={2}
                compact
                format={(v) => `${v} btg`}
                onChange={(packSize) => actions.setSettings({ packSize })}
              />
            }
          />
          <Row
            title="Harga Eceran per Batang"
            subtitle="Harga rokok satuan di warung"
            right={
              <Stepper
                value={s.singlePrice}
                min={1000}
                max={5000}
                step={500}
                compact
                format={(v) => rupiah(v)}
                onChange={(singlePrice) => actions.setSettings({ singlePrice })}
              />
            }
          />
        </Group>
      </Section>

      {/* Konsekuensi & Kritik */}
      <Section title="Sistem Konsekuensi & Kritik">
        <Group>
          <Row
            title="Sensitivitas Zona Konsekuensi"
            subtitle="Toleransi poin sebelum berpindah ke Bahaya / Kritis"
            stacked={
              <Segmented
                options={[
                  { value: 'lunak', label: 'Lunak' },
                  { value: 'standar', label: 'Standar' },
                  { value: 'keras', label: 'Keras' },
                ]}
                value={s.sensitivity}
                onChange={handleSensitivityChange}
              />
            }
          />
          <Row
            title="Pesan Akuntabilitas"
            subtitle="Aktifkan kalimat teguran langsung di layar utama"
            right={
              <Toggle
                label="Pesan Akuntabilitas"
                value={s.messagesOn}
                onChange={(messagesOn) => actions.setSettings({ messagesOn })}
              />
            }
          />
          {s.messagesOn && (
            <Row
              title="Intensitas Bahasa Teguran"
              subtitle="Tingkat ketegasan kalimat evaluasi"
              stacked={
                <View style={{ gap: 10 }}>
                  <Segmented
                    options={[
                      { value: 'normal', label: 'Normal' },
                      { value: 'strict', label: 'Tegas' },
                      { value: 'brutal', label: 'Brutal' },
                    ]}
                    value={s.intensity}
                    onChange={handleIntensityChange}
                  />
                  <Card style={{ backgroundColor: color.fill }}>
                    <Txt variant="caption" color={color.ink3} weight="600">CONTOH PESAN:</Txt>
                    <Txt variant="subhead" color={color.ink} style={{ fontStyle: 'italic', marginTop: 4 }}>
                      &ldquo;{SAMPLE_BY_INTENSITY[s.intensity]}&rdquo;
                    </Txt>
                  </Card>
                </View>
              }
            />
          )}
        </Group>
      </Section>

      {/* Privasi & Akses */}
      <Section title="Privasi & Tampilan">
        <Group>
          <Row
            title="Samarkan Catatan PMO"
            subtitle="Sembunyikan rincian eksplisit di ringkasan umum"
            right={
              <Toggle
                label="Samarkan PMO"
                value={s.pmoCover}
                onChange={(pmoCover) => actions.setSettings({ pmoCover })}
              />
            }
          />
          <Row
            title="Kunci Aplikasi (Biometrik / PIN)"
            subtitle="Minta autentikasi saat membuka KuroStop"
            right={
              <Toggle
                label="Kunci Aplikasi"
                value={s.appLock}
                onChange={handleToggleAppLock}
              />
            }
          />
          <Row
            title="Kurangi Animasi (Reduce Motion)"
            subtitle="Pilihan transisi gerakan"
            stacked={
              <Segmented
                options={[
                  { value: 'system', label: 'Sistem' },
                  { value: 'on', label: 'Kurangi' },
                  { value: 'off', label: 'Normal' },
                ]}
                value={s.reduceMotion}
                onChange={(reduceMotion: MotionPref) => actions.setSettings({ reduceMotion })}
              />
            }
          />
          <Row
            title="Jam Batas Pergantian Hari"
            subtitle="Jam perhitungan lembar harian baru (Default 04.00)"
            right={
              <Stepper
                value={s.dayBoundary}
                min={0}
                max={8}
                compact
                format={(v) => `${v}.00`}
                onChange={(dayBoundary) => actions.setSettings({ dayBoundary })}
              />
            }
          />
        </Group>
      </Section>

      {/* Notifikasi & Pengingat */}
      <Section title="Notifikasi & Pengingat Lokal">
        <Group>
          <Row
            title="Pengingat Jam Tidur"
            subtitle="Notifikasi 30 menit sebelum jadwal tidur"
            right={
              <Toggle
                label="Pengingat Tidur"
                value={s.notif.bedtime}
                onChange={(v) => handleToggleNotif('bedtime', v)}
              />
            }
          />
          <Row
            title="Check-in Lembar Harian"
            subtitle="Pengingat malam hari (21.30) untuk konfirmasi evaluasi"
            right={
              <Toggle
                label="Check-in Harian"
                value={s.notif.daily}
                onChange={(v) => handleToggleNotif('daily', v)}
              />
            }
          />
          <Row
            title="Ringkasan Mingguan"
            subtitle="Pengingat setiap Minggu malam (20.00)"
            right={
              <Toggle
                label="Ringkasan Mingguan"
                value={s.notif.weekly}
                onChange={(v) => handleToggleNotif('weekly', v)}
              />
            }
          />
        </Group>
      </Section>

      {/* Cadangan & Pemulihan */}
      <Section title="Cadangan Data (Offline Backup)">
        <Group>
          <Row
            title="Ekspor Cadangan (JSON)"
            subtitle="Simpan salinan data lengkap sebelum update/reinstall sideload"
            icon="download-outline"
            onPress={handleExportBackup}
          />
        </Group>
      </Section>

      {/* Kelola Data */}
      <Section title="Pengelolaan Data">
        <Group>
          <Row
            title="Mulai Ulang Alur Onboarding"
            subtitle="Buka kembali wizard panduan setup awal aplikasi"
            icon="refresh-outline"
            onPress={handleRestartOnboarding}
          />
          {state.isDemoMode && (
            <Row
              title="Reset Data Demo"
              subtitle="Muat kembali riwayat contoh simulasi"
              icon="flask-outline"
              onPress={handleResetDemo}
            />
          )}
          <Row
            title="Kosongkan Semua Catatan"
            subtitle="Hapus seluruh data aktivitas yang tersimpan di SQLite lokal"
            icon="trash-outline"
            destructive
            onPress={handleWipeData}
          />
        </Group>
      </Section>

      {/* App Info Footer */}
      <View style={{ alignItems: 'center', paddingVertical: 20, gap: 4 }}>
        <Txt variant="caption" color={color.ink3} weight="600">
          KUROSTOP · EVERY CHOICE LEAVES A MARK
        </Txt>
        <Txt variant="caption" color={color.ink4}>
          Versi 1.0 (Offline-First SQLite) · Waktu Lokal Asia/Jakarta (UTC+7)
        </Txt>
      </View>
    </Screen>
  );
}
