import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/data/store';
import { AppLockProvider } from '@/components/security/AppLockProvider';
import { ToastHost, ToastProvider } from '@/components/ui/toast';
import { color } from '@/theme/tokens';

export default function RootLayout() {
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
          {/* Hide sub-screens from tabs */}
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

// Simple icon component for tab bar
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

function TabIcon({ name, color: c, size }: { name: ComponentProps<typeof Ionicons>['name']; color?: any; size: number }) {
  return <Ionicons name={name} size={size ?? 24} color={c || color.ink} />;
}
