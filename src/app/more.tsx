import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useApp } from '@/data/store';
import { color } from '@/theme/tokens';
import {
  Group, Row, Screen, Section,
} from '@/components/ui/layout';
import { Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

export default function MoreScreen() {
  const { state, actions } = useApp();
  const toast = useToast();

  const handleResetDemo = () => {
    actions.resetDemo();
    toast({
      title: 'Data Demo Dimuat Ulang',
      body: 'Data simulasi telah disiapkan kembali.',
      icon: 'refresh',
    });
  };

  const handleRestartOnboarding = () => {
    actions.restartOnboarding();
    router.replace('/onboarding');
  };

  return (
    <Screen
      title="Lainnya"
      eyebrow="KUROSTOP"
    >
      {/* Pelacakan Lanjutan */}
      <Section title="Analisis & Riwayat">
        <Group>
          <Row
            title="Riwayat & Statistik"
            subtitle="Kalender interaktif, tren 30 hari, dan analisis streak"
            icon="bar-chart-outline"
            onPress={() => router.push('/history')}
          />
          <Row
            title="Uang & Pengeluaran"
            subtitle="Hitungan riil uang yang dibakar vs tabungan yang terselamatkan"
            icon="wallet-outline"
            onPress={() => router.push('/money')}
          />
        </Group>
      </Section>

      {/* Alat & Intervensi */}
      <Section title="Alat Kendali Diri">
        <Group>
          <Row
            title="Gue Lagi Pengen..."
            subtitle="Lawan dorongan dengan latihan napas 90 detik & tantangan tunda"
            icon="pulse-outline"
            onPress={() => router.push('/urge')}
          />
        </Group>
      </Section>

      {/* Preferensi & Konfigurasi */}
      <Section title="Aplikasi & Konfigurasi">
        <Group>
          <Row
            title="Pengaturan"
            subtitle="Atur target harian, jam tidur, harga rokok, dan intensitas teguran"
            icon="settings-outline"
            onPress={() => router.push('/settings')}
          />
          <Row
            title="Mulai Ulang Onboarding"
            subtitle="Buka wizard pengenalan dan konfigurasi awal"
            icon="refresh-outline"
            onPress={handleRestartOnboarding}
          />
          {state.isDemoMode && (
            <Row
              title="Reset Data Demo"
              subtitle="Segarkan kembali data contoh untuk simulasi antarmuka"
              icon="flask-outline"
              onPress={handleResetDemo}
            />
          )}
        </Group>
      </Section>

      {/* Footer Info */}
      <View style={{ alignItems: 'center', paddingVertical: 16, gap: 4 }}>
        <Txt variant="caption" color={color.ink3} weight="600">
          KUROSTOP
        </Txt>
        <Txt variant="caption" color={color.ink4}>
          Every Choice Leaves a Mark · v1.0 Local SQLite
        </Txt>
      </View>
    </Screen>
  );
}
