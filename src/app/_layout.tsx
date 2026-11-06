import { ComponentProps, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppLockProvider } from '@/components/security/AppLockProvider';
import { Button, Txt } from '@/components/ui/primitives';
import { ToastHost, ToastProvider } from '@/components/ui/toast';
import { AppProvider, useApp } from '@/data/store';
import { color } from '@/theme/tokens';

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
    console.log('[KuroStop] ROOT_LAYOUT_MOUNTED');
    SplashScreen.preventAutoHideAsync().catch(() => {});
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
          <RootTabs />
          <ToastHost />
        </AppLockProvider>
      </ToastProvider>
    </AppProvider>
  );
}

function RootTabs() {
  const { state } = useApp();
  const hideTabs = state.isReady && !state.onboarded;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.ink4,
        tabBarStyle: hideTabs
          ? { display: 'none' }
          : {
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
