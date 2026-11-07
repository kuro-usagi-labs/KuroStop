import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color } from '@/theme/tokens';

/**
 * Bottom tab navigator — ONLY the five primary destinations live here.
 *
 * Every other screen (log, history, money, urge, settings) is a stack screen
 * declared in `src/app/_layout.tsx`. Mixing "push" screens into the tab
 * navigator made `router.back()` behave like a tab switch and bounce users
 * back to "Hari Ini", so the two navigators are now kept separate.
 *
 * Icons are filled variants and the labels don't follow Dynamic Type, per
 * HIG: tab titles identify destinations, they aren't reading content.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.ink,
        tabBarInactiveTintColor: color.ink3,
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          backgroundColor: color.sheet,
          borderTopColor: color.hair,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 6,
          paddingBottom: bottom,
          height: 50 + bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.1,
        },
        tabBarIconStyle: { marginTop: 1 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hari Ini',
          tabBarIcon: ({ color: c, size }) => (
            <TabIcon name="today" color={c} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="smoke"
        options={{
          title: 'Rokok',
          tabBarIcon: ({ color: c, size }) => (
            <TabIcon name="flame" color={c} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pmo"
        options={{
          title: 'PMO',
          tabBarIcon: ({ color: c, size }) => (
            <TabIcon name="eye-off" color={c} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Tidur',
          tabBarIcon: ({ color: c, size }) => (
            <TabIcon name="moon" color={c} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Lainnya',
          tabBarIcon: ({ color: c, size }) => (
            <TabIcon name="grid" color={c} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  name, color: c, size,
}: {
  name: ComponentProps<typeof Ionicons>['name'];
  color?: any;
  size: number;
}) {
  return <Ionicons name={name} size={Math.min(size ?? 24, 24)} color={c || color.ink} />;
}
