import { View } from 'react-native';
import { router } from 'expo-router';

import { Button, Txt } from '@/components/ui/primitives';
import { color } from '@/theme/tokens';

/** Fallback for unknown deep links or routes that are currently guarded off. */
export default function NotFoundScreen() {
  return (
    <View
      testID="not-found"
      style={{
        flex: 1,
        backgroundColor: color.paper,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        gap: 12,
      }}
    >
      <Txt variant="title" weight="700">Halaman Tidak Ditemukan</Txt>
      <Txt variant="body" color={color.ink3} center>
        Tautan yang lo buka sudah tidak tersedia atau sedang tidak bisa diakses.
      </Txt>
      <Button label="Kembali ke Hari Ini" onPress={() => router.replace('/')} />
    </View>
  );
}
