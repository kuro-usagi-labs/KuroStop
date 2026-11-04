import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useKuroStore } from '../stores/useKuroStore';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatIDR } from '../utils/currency';
import { formatShortTime, formatIndonesianDate } from '../utils/date';

interface SmokingDetailScreenProps {
  onBack: () => void;
  onOpenBuyCigarettes: () => void;
}

export const SmokingDetailScreen: React.FC<SmokingDetailScreenProps> = ({
  onBack,
  onOpenBuyCigarettes,
}) => {
  const {
    events,
    purchases,
    activeDate,
    logSmoking,
    deleteEvent,
    deletePurchase,
  } = useKuroStore();

  const smokingEvents = events.filter((e) => e.habitType === 'smoking');
  const todaySmokingEvents = smokingEvents.filter((e) => e.localDate === activeDate);
  const todayCount = todaySmokingEvents.reduce((acc, curr) => acc + (curr.count || 1), 0);

  // Month purchases
  const currentMonth = activeDate.substring(0, 7);
  const monthPurchases = purchases.filter((p) => p.localDate.startsWith(currentMonth));
  const monthSpent = monthPurchases.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);

  const handleDeleteEvent = (id: string) => {
    Alert.alert(
      'Hapus Catatan',
      'Apakah kamu yakin ingin menghapus catatan rokok ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              try {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch {}
            }
            await deleteEvent(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Detail Merokok"
        subtitle={formatIndonesianDate(activeDate)}
        onBack={onBack}
        rightAction={{
          label: '+ Beli',
          onPress: onOpenBuyCigarettes,
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Metric Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Hari Ini</Text>
            <Text style={styles.metricValue}>{todayCount}</Text>
            <Text style={styles.metricSub}>batang rokok</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Uang Keluar Bulan Ini</Text>
            <Text style={[styles.metricValue, { fontSize: 20 }]}>{formatIDR(monthSpent)}</Text>
            <Text style={styles.metricSub}>{monthPurchases.length} kali transaksi</Text>
          </Card>
        </View>

        {/* Quick Add Button */}
        <Button
          title="+ Catat 1 Batang Rokok"
          variant="outline"
          onPress={async () => {
            await logSmoking(1);
          }}
          style={styles.addButton}
        />

        {/* Today's Events Timeline */}
        <Text style={styles.sectionTitle}>Catatan Hari Ini ({todaySmokingEvents.length})</Text>
        {todaySmokingEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={COLORS.clear.primary} />
            <Text style={styles.emptyTitle}>Belum Ada Rokok Hari Ini</Text>
            <Text style={styles.emptySub}>
              Paru-paru dan dompetmu berterima kasih. Pertahankan kendali sampai malam.
            </Text>
          </Card>
        ) : (
          <View style={styles.listWrap}>
            {todaySmokingEvents.map((evt) => (
              <Card key={evt.id} style={styles.eventCard}>
                <View style={styles.eventLeft}>
                  <Text style={styles.eventTime}>{formatShortTime(evt.timestamp)}</Text>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{evt.count} Batang Rokok</Text>
                    {evt.triggerTag ? (
                      <Badge label={evt.triggerTag} variant="neutral" style={styles.tagBadge} />
                    ) : null}
                    {evt.note ? <Text style={styles.eventNote}>{evt.note}</Text> : null}
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDeleteEvent(evt.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* Recent Purchases */}
        <Text style={styles.sectionTitle}>Pembelian Terakhir</Text>
        {purchases.slice(0, 5).map((p) => (
          <Card key={p.id} style={styles.purchaseCard}>
            <View>
              <Text style={styles.purchaseBrand}>{p.brandName || 'Rokok'}</Text>
              <Text style={styles.purchaseSub}>
                {p.quantity} {p.itemType === 'pack' ? 'bungkus' : 'batang'} • {p.localDate}
              </Text>
            </View>
            <Text style={styles.purchasePrice}>{formatIDR(p.totalPrice)}</Text>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.screenPadding,
    paddingVertical: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addButton: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listWrap: {
    gap: 8,
    marginBottom: 20,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 50,
  },
  eventDetails: {
    flex: 1,
    marginLeft: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  tagBadge: {
    marginTop: 4,
  },
  eventNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 8,
  },
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 8,
  },
  purchaseBrand: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  purchaseSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  purchasePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.critical.primary,
  },
});
