import React, { useState } from 'react';
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
import { BuyCigarettesModal } from '../components/modals/BuyCigarettesModal';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatIDR, formatSignedIDR } from '../utils/currency';
import { calculateMonthlyReports } from '../features/finance/calculator';

interface WalletScreenProps {
  onBack: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onBack }) => {
  const {
    settings,
    purchases,
    financeSummary,
    logPurchase,
    deletePurchase,
  } = useKuroStore();

  const [modalVisible, setModalVisible] = useState(false);

  const monthlyReports = calculateMonthlyReports(
    purchases,
    settings.dailyCigaretteSpendBaseline
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      'Hapus Transaksi',
      'Apakah kamu yakin ingin menghapus catatan pembelian ini?',
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
            await deletePurchase(id);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Kalkulator Keuangan Rokok"
        onBack={onBack}
        rightAction={{
          label: '+ Beli',
          onPress: () => setModalVisible(true),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avoided Spending Hero Card */}
        <Card
          style={[
            styles.heroCard,
            financeSummary.isOverspent && styles.heroCardOverspent,
          ]}
        >
          <Text style={styles.heroSubLabel}>Perkiraan Pengeluaran yang Dihindari</Text>
          <Text
            style={[
              styles.heroAmount,
              financeSummary.isOverspent && { color: COLORS.critical.primary },
            ]}
          >
            {formatSignedIDR(financeSummary.avoidedSpending)}
          </Text>
          <Text style={styles.heroDescription}>
            {financeSummary.isOverspent
              ? 'Pengeluaran rokokmu melampaui baseline harian. Kamu membakar lebih banyak uang dari kebiasaan lamamu.'
              : 'Estimasi uang sungguhan yang berhasil kamu tahan dan tidak jadi kamu bakar menjadi asap rokok.'}
          </Text>
        </Card>

        {/* Ledger Breakdown Cards */}
        <View style={styles.ledgerGrid}>
          <Card style={styles.ledgerCard}>
            <Text style={styles.ledgerLabel}>Total Pengeluaran Nyata</Text>
            <Text style={[styles.ledgerValue, { color: COLORS.critical.primary }]}>
              {formatIDR(financeSummary.actualSpending)}
            </Text>
            <Text style={styles.ledgerSub}>
              {financeSummary.totalPacksBought} bungkus • {financeSummary.totalSticksBought} batang
            </Text>
          </Card>

          <Card style={styles.ledgerCard}>
            <Text style={styles.ledgerLabel}>Ekspektasi Baseline</Text>
            <Text style={styles.ledgerValue}>
              {formatIDR(financeSummary.baselineExpectedSpending)}
            </Text>
            <Text style={styles.ledgerSub}>
              {formatIDR(settings.dailyCigaretteSpendBaseline)}/hari
            </Text>
          </Card>
        </View>

        {/* Long-term Projections Card */}
        <Card style={styles.projectionCard}>
          <Text style={styles.projectionTitle}>Potensi Penghematan Penuh</Text>
          <View style={styles.projectionRow}>
            <View>
              <Text style={styles.projectionItemLabel}>Proyeksi 1 Bulan (30 Hari)</Text>
              <Text style={styles.projectionItemValue}>
                {formatIDR(financeSummary.potentialMonthlySavings)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.projectionItemLabel}>Proyeksi 1 Tahun (365 Hari)</Text>
              <Text style={[styles.projectionItemValue, { color: COLORS.clear.primary }]}>
                {formatIDR(financeSummary.potentialYearlySavings)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Add Purchase Trigger Button */}
        <Button
          title="+ Catat Pembelian Rokok Baru"
          variant="outline"
          onPress={() => setModalVisible(true)}
          style={{ marginBottom: 20 }}
        />

        {/* Monthly Breakdown Reports */}
        {monthlyReports.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Laporan Bulanan</Text>
            <View style={styles.monthlyList}>
              {monthlyReports.map((report) => (
                <Card key={report.yearMonth} style={styles.monthlyCard}>
                  <View style={styles.monthlyLeft}>
                    <Text style={styles.monthlyTitle}>Bulan {report.yearMonth}</Text>
                    <Text style={styles.monthlySub}>
                      {report.purchaseCount} transaksi tercatat
                    </Text>
                  </View>
                  <View style={styles.monthlyRight}>
                    <Text style={styles.monthlySpent}>
                      Keluar: {formatIDR(report.actualSpending)}
                    </Text>
                    <Text
                      style={[
                        styles.monthlyAvoided,
                        report.isOverspent && { color: COLORS.critical.primary },
                      ]}
                    >
                      Dihindari: {formatSignedIDR(report.avoidedSpending)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Transaction History */}
        <Text style={styles.sectionHeader}>Riwayat Pembelian ({purchases.length})</Text>
        {purchases.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="cart-outline" size={32} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Belum Ada Pembelian Tercatat</Text>
            <Text style={styles.emptySub}>
              Setiap kali kamu membeli rokok ketengan atau bungkus, catat di sini agar
              kalkulasi pengeluaran akurat.
            </Text>
          </Card>
        ) : (
          <View style={styles.purchasesList}>
            {purchases.map((p) => (
              <Card key={p.id} style={styles.purchaseItem}>
                <View style={styles.purchaseLeft}>
                  <Text style={styles.purchaseBrand}>{p.brandName || 'Rokok'}</Text>
                  <Text style={styles.purchaseDetail}>
                    {p.quantity} {p.itemType === 'pack' ? 'bungkus' : 'batang'} • {p.localDate}
                  </Text>
                  {p.note ? <Text style={styles.purchaseNote}>"{p.note}"</Text> : null}
                </View>

                <View style={styles.purchaseRight}>
                  <Text style={styles.purchaseTotal}>{formatIDR(p.totalPrice)}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDelete(p.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={17} color={COLORS.textTertiary} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <BuyCigarettesModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSavePurchase={async (itemType, qty, price, brand, note) => {
          await logPurchase(itemType, qty, price, brand, note);
        }}
      />
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
  heroCard: {
    padding: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  heroCardOverspent: {
    borderColor: COLORS.critical.border,
    backgroundColor: COLORS.critical.surfaceSubtle,
  },
  heroSubLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.clear.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  ledgerGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ledgerCard: {
    flex: 1,
    padding: 14,
  },
  ledgerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  ledgerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  ledgerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  projectionCard: {
    padding: 16,
    backgroundColor: COLORS.surfaceSubtle,
    marginBottom: 16,
  },
  projectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectionItemLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  projectionItemValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    marginTop: 10,
  },
  monthlyList: {
    gap: 8,
    marginBottom: 16,
  },
  monthlyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  monthlyLeft: {
    flex: 1,
  },
  monthlyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monthlySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  monthlyRight: {
    alignItems: 'flex-end',
  },
  monthlySpent: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  monthlyAvoided: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.clear.primary,
    marginTop: 2,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
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
  purchasesList: {
    gap: 8,
  },
  purchaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  purchaseLeft: {
    flex: 1,
  },
  purchaseBrand: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  purchaseDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  purchaseNote: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  purchaseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  purchaseTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.critical.primary,
  },
  deleteBtn: {
    padding: 6,
  },
});
