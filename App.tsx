import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useKuroStore } from './src/stores/useKuroStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SmokingDetailScreen } from './src/screens/SmokingDetailScreen';
import { PMODetailScreen } from './src/screens/PMODetailScreen';
import { SleepDetailScreen } from './src/screens/SleepDetailScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BuyCigarettesModal } from './src/components/modals/BuyCigarettesModal';
import { COLORS } from './src/theme/colors';

type ScreenName =
  | 'dashboard'
  | 'smokingDetail'
  | 'pmoDetail'
  | 'sleepDetail'
  | 'history'
  | 'wallet'
  | 'settings';

export default function App() {
  const { settings, isLoading, initialize, updateSettings, logPurchase } = useKuroStore();
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('dashboard');
  const [buyCigarettesModalVisible, setBuyCigarettesModalVisible] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.textPrimary} />
      </View>
    );
  }

  // First time launch onboarding
  if (!settings.onboardingCompleted) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="dark" />
          <OnboardingScreen
            onComplete={async (config) => {
              await updateSettings({
                dailyCigaretteSpendBaseline: config.dailyBaseline,
                targetBedtime: config.targetBedtime,
                targetWakeTime: config.targetWakeTime,
                accountabilityIntensity: config.intensity,
                onboardingCompleted: true,
              });
              setCurrentScreen('dashboard');
            }}
          />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateSmokingDetail={() => setCurrentScreen('smokingDetail')}
            onNavigatePMODetail={() => setCurrentScreen('pmoDetail')}
            onNavigateSleepDetail={() => setCurrentScreen('sleepDetail')}
            onNavigateHistory={() => setCurrentScreen('history')}
            onNavigateWallet={() => setCurrentScreen('wallet')}
            onNavigateSettings={() => setCurrentScreen('settings')}
          />
        );
      case 'smokingDetail':
        return (
          <SmokingDetailScreen
            onBack={() => setCurrentScreen('dashboard')}
            onOpenBuyCigarettes={() => setBuyCigarettesModalVisible(true)}
          />
        );
      case 'pmoDetail':
        return (
          <PMODetailScreen
            onBack={() => setCurrentScreen('dashboard')}
            onOpenUrge={() => setCurrentScreen('dashboard')}
          />
        );
      case 'sleepDetail':
        return <SleepDetailScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'history':
        return <HistoryScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'wallet':
        return <WalletScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'settings':
        return (
          <SettingsScreen
            onBack={() => setCurrentScreen('dashboard')}
            onResetOnboarding={async () => {
              await updateSettings({ onboardingCompleted: false });
            }}
          />
        );
    }
  };

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar style="dark" />
        {renderScreen()}

        <BuyCigarettesModal
          visible={buyCigarettesModalVisible}
          onClose={() => setBuyCigarettesModalVisible(false)}
          onSavePurchase={async (itemType, qty, price, brand, note) => {
            await logPurchase(itemType, qty, price, brand, note);
          }}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
