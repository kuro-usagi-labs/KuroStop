import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKuroStore } from '../stores/useKuroStore';
import { AtmosphereDecay } from '../animations/AtmosphereDecay';
import { HeroOrbSection } from '../components/dashboard/HeroOrbSection';
import { HabitSummaryCard } from '../components/dashboard/HabitSummaryCard';
import { QuickActionsRow } from '../components/dashboard/QuickActionsRow';
import { QuickLogModal } from '../components/modals/QuickLogModal';
import { BuyCigarettesModal } from '../components/modals/BuyCigarettesModal';
import { UrgeInterruptionModal } from '../components/modals/UrgeInterruptionModal';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { PMOEventType, PurchaseItemType, HabitType } from '../types';

interface DashboardScreenProps {
  onNavigateSmokingDetail: () => void;
  onNavigatePMODetail: () => void;
  onNavigateSleepDetail: () => void;
  onNavigateHistory: () => void;
  onNavigateWallet: () => void;
  onNavigateSettings: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateSmokingDetail,
  onNavigatePMODetail,
  onNavigateSleepDetail,
  onNavigateHistory,
  onNavigateWallet,
  onNavigateSettings,
}) => {
  const {
    settings,
    events,
    purchases,
    sleepSessions,
    activeDate,
    consequence,
    isSleeping,
    logSmoking,
    logPMO,
    logBedtimeStart,
    logWakeUp,
    logPurchase,
    logUrge,
    recomputeState,
  } = useKuroStore();

  const [quickLogVisible, setQuickLogVisible] = useState(false);
  const [buyCigarettesVisible, setBuyCigarettesVisible] = useState(false);
  const [urgeVisible, setUrgeVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    recomputeState();
    setTimeout(() => setRefreshing(false), 300);
  };

  const handleQuickAddSmoke = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    }
    await logSmoking(1);
  };

  const handleToggleSleep = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    if (isSleeping) {
      await logWakeUp();
    } else {
      await logBedtimeStart();
    }
  };

  // Compute today's spending for display
  const todayPurchases = purchases.filter((p) => p.localDate === activeDate);
  const spendingToday = todayPurchases.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Living Atmospheric Decay (Screen border and vignette) */}
      <AtmosphereDecay
        zone={consequence.zone}
        reduceMotion={settings.reduceMotion}
      />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandWrapper}>
          <Text style={styles.brandTitle}>KUROSTOP</Text>
          <View
            style={[
              styles.liveIndicator,
              { backgroundColor: consequence.accentColor },
            ]}
          />
        </View>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNavigateHistory}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="calendar-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNavigateWallet}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="wallet-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNavigateSettings}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Dynamic Living Orb Section & Honesty Banner */}
        <HeroOrbSection
          consequence={consequence}
          activeDate={activeDate}
          reduceMotion={settings.reduceMotion}
        />

        {/* Three Target Habits Summary */}
        <View style={styles.habitsSection}>
          <HabitSummaryCard
            habit="smoking"
            severity={consequence.smokingSeverity}
            smokingCount={consequence.smokingSeverity.count}
            spendingToday={spendingToday}
            onPressCard={onNavigateSmokingDetail}
            onQuickAddSmoke={handleQuickAddSmoke}
          />

          <HabitSummaryCard
            habit="pmo"
            severity={consequence.pmoSeverity}
            pmoCount={consequence.pmoSeverity.count}
            onPressCard={onNavigatePMODetail}
            onQuickLogPMO={() => setQuickLogVisible(true)}
          />

          <HabitSummaryCard
            habit="sleep"
            severity={consequence.sleepSeverity}
            targetBedtime={settings.targetBedtime}
            isSleeping={isSleeping}
            onPressCard={onNavigateSleepDetail}
            onToggleSleep={handleToggleSleep}
          />
        </View>

        {/* Quick Actions Row */}
        <QuickActionsRow
          onOpenUrge={() => setUrgeVisible(true)}
          onOpenQuickLog={() => setQuickLogVisible(true)}
          onOpenBuyCigarettes={() => setBuyCigarettesVisible(true)}
        />
      </ScrollView>

      {/* Modals */}
      <QuickLogModal
        visible={quickLogVisible}
        onClose={() => setQuickLogVisible(false)}
        onSaveSmoking={async (count, note, tag) => {
          await logSmoking(count, note, tag);
        }}
        onSavePMO={async (pmoType, note, tag) => {
          await logPMO(pmoType, note, tag);
        }}
      />

      <BuyCigarettesModal
        visible={buyCigarettesVisible}
        onClose={() => setBuyCigarettesVisible(false)}
        onSavePurchase={async (itemType, qty, price, brand, note) => {
          await logPurchase(itemType, qty, price, brand, note);
        }}
      />

      <UrgeInterruptionModal
        visible={urgeVisible}
        onClose={() => setUrgeVisible(false)}
        onResistedUrge={async (habit, duration, tag) => {
          await logUrge(habit, true, duration, tag);
        }}
        onRelapsedUrge={async (habit, tag) => {
          await logUrge(habit, false, 0, tag);
          if (habit === 'smoking') await logSmoking(1, undefined, tag);
          if (habit === 'pmo') await logPMO('combined', undefined, tag);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSubtle,
  },
  brandWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 7,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingBottom: 40,
  },
  habitsSection: {
    marginTop: 6,
    marginBottom: 4,
  },
});
