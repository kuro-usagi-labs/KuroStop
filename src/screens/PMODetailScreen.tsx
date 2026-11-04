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
import { Badge } from '../components/common/Badge';
import { QuickLogModal } from '../components/modals/QuickLogModal';
import { COLORS } from '../theme/colors';
import { SPACING, RADIUS } from '../theme/spacing';
import { formatShortTime, formatIndonesianDate } from '../utils/date';

interface PMODetailScreenProps {
  onBack: () => void;
  onOpenUrge: () => void;
}

export const PMODetailScreen: React.FC<PMODetailScreenProps> = ({
  onBack,
  onOpenUrge,
}) => {
  const { events, activeDate, logPMO, deleteEvent } = useKuroStore();
  const [modalVisible, setModalVisible] = useState(false);

  const pmoEvents = events.filter((e) => e.habitType === 'pmo');
  const todayEvents = pmoEvents.filter((e) => e.localDate === activeDate);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Hapus Catatan',
      'Apakah kamu ingin menghapus sesi PMO ini dari riwayat?',
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

  const formatPMOTypeName = (type?: string) => {
    switch (type) {
      case 'pornography':
        return 'Pornografi Saja';
      case 'masturbation':
        return 'Masturbasi Saja';
      case 'combined':
      default:
        return 'Sesi Lengkap (PMO)';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Detail PMO & Masturbasi"
        subtitle={formatIndonesianDate(activeDate)}
        onBack={onBack}
        rightAction={{
          label: '+ Catat',
          onPress: () => setModalVisible(true),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Hari Ini</Text>
            <Text style={styles.metricValue}>{todayEvents.length}</Text>
            <Text style={styles.metricSub}>sesi tercatat</Text>
          </Card>

          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Target Pribadi</Text>
            <Text style={[styles.metricValue, { color: COLORS.clear.primary }]}>0</Text>
            <Text style={styles.metricSub}>nol toleransi harian</Text>
          </Card>
        </View>

        {/* Accountability Message */}
        <Card
          style={[
            styles.ruleCard,
            todayEvents.length > 0 && styles.ruleCardViolated,
          ]}
        >
          <Text style={styles.ruleTitle}>Prinsip Akuntabilitas:</Text>
          <Text style={styles.ruleBody}>
            {todayEvents.length === 0
              ? 'Pikiran dan energimu masih bersih hari ini. Jangan kompromi dengan scrolling tanpa arah atau sendirian melamun di kamar.'
              : 'Target harian terlanggar. Ingat bahwa dorongan hanya bertahan beberapa menit, tapi rasa bersalah dan hilangnya energi bertahan seharian.'}
          </Text>
        </Card>

        {/* Urge Interruption Button */}
        <Button
          title="Merasa Ada Dorongan? Tekan Ini"
          variant="primary"
          onPress={onOpenUrge}
          icon={<Ionicons name="shield-checkmark" size={17} color="#FFFFFF" />}
          style={styles.urgeButton}
        />

        {/* Today's Events Timeline */}
        <Text style={styles.sectionTitle}>Riwayat Sesi Hari Ini ({todayEvents.length})</Text>
        {todayEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="shield-checkmark-outline" size={32} color={COLORS.clear.primary} />
            <Text style={styles.emptyTitle}>0 Sesi • Pikiran Terjaga</Text>
            <Text style={styles.emptySub}>
              Tidak ada catatan pelanggaran PMO hari ini. Tetap waspada di jam-jam rawan.
            </Text>
          </Card>
        ) : (
          <View style={styles.listWrap}>
            {todayEvents.map((evt) => (
              <Card key={evt.id} style={styles.eventCard}>
                <View style={styles.eventLeft}>
                  <Text style={styles.eventTime}>{formatShortTime(evt.timestamp)}</Text>
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitle}>{formatPMOTypeName(evt.pmoType)}</Text>
                    {evt.triggerTag ? (
                      <Badge label={evt.triggerTag} variant="neutral" style={styles.tagBadge} />
                    ) : null}
                    {evt.note ? <Text style={styles.eventNote}>"{evt.note}"</Text> : null}
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleDelete(evt.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <QuickLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaveSmoking={async () => {}}
        onSavePMO={async (pmoType, note, tag) => {
          await logPMO(pmoType, note, tag);
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
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ruleCard: {
    backgroundColor: COLORS.surfaceSubtle,
    padding: 16,
    marginBottom: 16,
  },
  ruleCardViolated: {
    borderColor: COLORS.critical.border,
    backgroundColor: COLORS.critical.surfaceSubtle,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  ruleBody: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  urgeButton: {
    marginBottom: 20,
    minHeight: 48,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
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
});
