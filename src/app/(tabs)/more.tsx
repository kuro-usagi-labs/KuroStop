import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useApp } from '@/data/store';
import { color } from '@/theme/tokens';
import {
  Group, Row, Screen, Section,
} from '@/components/ui/layout';
import { Txt } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';

/**
 * MORE — the secondary shelf: analysis, self-control tools, app config.
 * Onboarding restart lives in Settings, so it is not repeated here.
 */
export default function MoreScreen() {
  const { state, actions } = useApp();
  const toast = useToast();

  const handleResetDemo = () => {
    actions.resetDemo();
    toast({
      title: 'Data demo dimuat ulang',
      body: 'Data simulasi telah disiapkan kembali.',
      icon: 'refresh',
    });
  };

  return (
    <Screen title="Lainnya" eyebrow="KUROSTOP">
      <Section title="Analisis & Riwayat" index={0}>
        <Group>
          <Row
            title="Riwayat & Statistik"
            subtitle="Kalender, tren 30 hari, dan streak"
            icon="bar-chart-outline"
            onPress={() => router.push('/history')}
          />
          <Row
            title="Uang & Pengeluaran"
            subtitle="Biaya rokok vs tabungan yang terselamatkan"
            icon="wallet-outline"
            onPress={() => router.push('/money')}
          />
        </Group>
      </Section>

      <Section title="Alat Kendali Diri" index={1}>
        <Group>
          <Row
            title="Gue Lagi Pengen..."
            subtitle="Latihan napas 90 detik dan tantangan tunda"
            icon="pulse-outline"
            onPress={() => router.push('/urge')}
          />
        </Group>
      </Section>

      <Section title="Aplikasi" index={2}>
        <Group>
          <Row
            title="Pengaturan"
            subtitle="Target harian, jam tidur, harga rokok, intensitas teguran"
            icon="settings-outline"
            onPress={() => router.push('/settings')}
          />
          {state.isDemoMode && (
            <Row
              title="Reset Data Demo"
              subtitle="Segarkan kembali data contoh"
              icon="flask-outline"
              onPress={handleResetDemo}
            />
          )}
        </Group>
      </Section>

      <View style={styles.footer}>
        <Txt variant="eyebrow" color={color.ink3}>KuroStop</Txt>
        <Txt variant="footnote" color={color.ink3} center>
          Setiap pilihan meninggalkan jejak.
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { alignItems: 'center', gap: 4, paddingVertical: 16 },
});
