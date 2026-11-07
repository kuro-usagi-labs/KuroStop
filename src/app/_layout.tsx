import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppLockProvider } from '@/components/security/AppLockProvider';
import { Button, Txt } from '@/components/ui/primitives';
import { ToastHost, ToastProvider } from '@/components/ui/toast';
import { AppProvider, useApp } from '@/data/store';
import { logMilestone } from '@/lib/milestone';
import { color } from '@/theme/tokens';

// Keep the splash screen visible while fonts and database resources load.
// Must be called at module level before any component mounts.
SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Txt variant="headline" color={color.vermilion}>Terjadi Kendala Aplikasi</Txt>
      <Txt variant="body" color={color.ink3} center style={{ marginVertical: 12 }}>
        {error.message || 'Aplikasi mengalami kesalahan tak terduga.'}
      </Txt>
      <Button label="Muat Ulang Aplikasi" onPress={retry} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    logMilestone('ROOT_LAYOUT_MOUNTED');
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      logMilestone('FONTS_READY', { fontsLoaded: !!fontsLoaded, fontError: !!fontError });
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // If fonts are not ready yet, render a porcelain-paper container instead of null.
  // This guarantees the display is NEVER left with a blank or black frame.
  if (!fontsLoaded && !fontError) {
    return (
      <View
        testID="root-loading"
        style={{ flex: 1, backgroundColor: color.paper }}
      />
    );
  }

  return (
    <AppProvider>
      <ToastProvider>
        <AppLockProvider>
          <View style={{ flex: 1, backgroundColor: color.paper }} testID="root-app-container">
            <StatusBar style="dark" />
            <RootNavigator />
            <ToastHost />
          </View>
        </AppLockProvider>
      </ToastProvider>
    </AppProvider>
  );
}

/**
 * Root Stack + declarative onboarding gate.
 *
 * `Stack.Protected` gives us auth-style routing without imperative redirects:
 * when onboarding finishes the guard flips, the onboarding screen is removed
 * from the navigator and the router lands on the tab group automatically.
 * This replaces the old pattern of mounting onboarding inside the Today screen
 * (duplicate source of truth) and calling `router.replace('/')` manually.
 */
function RootNavigator() {
  const { state, actions } = useApp();

  if (state.status === 'initializing') {
    return (
      <View testID="db-initializing" style={styles.boot}>
        <Txt variant="headline" color={color.ink2}>KuroStop</Txt>
        <Txt variant="caption" color={color.ink3} style={{ marginTop: 6 }}>
          Memuat data lokal...
        </Txt>
        <ActivityIndicator color={color.ink3} style={{ marginTop: 18 }} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View testID="db-error" style={styles.boot}>
        <Txt variant="headline" color={color.vermilion}>Gagal Memuat Database</Txt>
        <Txt variant="body" color={color.ink3} center style={{ marginVertical: 12 }}>
          {state.error || 'Terjadi kesalahan sistem penyimpanan lokal.'}
        </Txt>
        <Button label="Coba Lagi" onPress={() => actions.retryInit()} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.paper } }}>
      <Stack.Protected guard={!state.onboarded}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack.Protected>

      <Stack.Protected guard={state.onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="log" options={{ presentation: 'modal' }} />
        <Stack.Screen name="history" />
        <Stack.Screen name="money" />
        <Stack.Screen name="urge" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
        {/* Kept inside the guard so unknown links during onboarding fall back to
            the onboarding wizard instead of the not-found screen. */}
        <Stack.Screen name="+not-found" options={{ title: 'Tidak Ditemukan' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
