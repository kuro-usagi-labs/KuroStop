import { useEffect, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppProvider } from '@/data/store';
import { AppLockProvider } from '@/components/security/AppLockProvider';
import { ToastHost, ToastProvider } from '@/components/ui/toast';
import { Button, Txt } from '@/components/ui/primitives';
import { color } from '@/theme/tokens';

// Prevent splash screen from auto-hiding before fonts and core resources are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={styles.errorContainer}>
      <Txt variant="headline" color={color.vermilion}>Terjadi Kesalahan</Txt>
      <Txt variant="callout" color={color.ink2} center style={{ marginTop: 8, maxWidth: 320 }}>
        {error?.message || 'Aplikasi mengalami kesalahan tak terduga.'}
      </Txt>
      <Button label="Muat Ulang" onPress={retry} style={{ marginTop: 20 }} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    console.log('[KuroStop] ROOT_LAYOUT_MOUNTED');
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      console.log('[KuroStop] FONTS_READY (loaded:', fontsLoaded, 'error:', !!fontError, ')');
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AppProvider>
      <ToastProvider>
        <AppLockProvider>
          <StatusBar style="dark" />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: color.ink,
              tabBarInactiveTintColor: color.ink4,
              tabBarStyle: {
                backgroundColor: color.sheet,
                borderTopColor: color.hair,
                borderTopWidth: 0.5,
                paddingTop: 6,
                height: 88,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 0.2,
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Hari Ini',
                tabBarIcon: ({ color: c, size }) => (
                  <TabIcon name="today-outline" color={c} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="smoke"
              options={{
                title: 'Rokok',
                tabBarIcon: ({ color: c, size }) => (
                  <TabIcon name="flame-outline" color={c} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="pmo"
              options={{
                title: 'PMO',
                tabBarIcon: ({ color: c, size }) => (
                  <TabIcon name="eye-off-outline" color={c} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="sleep"
              options={{
                title: 'Tidur',
                tabBarIcon: ({ color: c, size }) => (
                  <TabIcon name="moon-outline" color={c} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="more"
              options={{
                title: 'Lainnya',
                tabBarIcon: ({ color: c, size }) => (
                  <TabIcon name="grid-outline" color={c} size={size} />
                ),
              }}
            />
            {/* Hide sub-screens from tab bar */}
            <Tabs.Screen name="log" options={{ href: null }} />
            <Tabs.Screen name="history" options={{ href: null }} />
            <Tabs.Screen name="money" options={{ href: null }} />
            <Tabs.Screen name="urge" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="onboarding" options={{ href: null }} />
          </Tabs>
          <ToastHost />
        </AppLockProvider>
      </ToastProvider>
    </AppProvider>
  );
}

function TabIcon({ name, color: c, size }: { name: ComponentProps<typeof Ionicons>['name']; color?: any; size: number }) {
  return <Ionicons name={name} size={size ?? 24} color={c || color.ink} />;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: color.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
