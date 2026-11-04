import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { NumberStepper } from '../common/NumberStepper';
import { COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { PMOEventType } from '../../types';

interface QuickLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSmoking: (count: number, note?: string, triggerTag?: string) => Promise<void>;
  onSavePMO: (pmoType: PMOEventType, note?: string, triggerTag?: string) => Promise<void>;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  visible,
  onClose,
  onSaveSmoking,
  onSavePMO,
}) => {
  const [selectedTab, setSelectedTab] = useState<'smoking' | 'pmo'>('smoking');

  // Smoking state
  const [cigaretteCount, setCigaretteCount] = useState<number>(1);
  const [smokingTrigger, setSmokingTrigger] = useState<string>('');
  const [smokingNote, setSmokingNote] = useState<string>('');

  // PMO state
  const [pmoType, setPmoType] = useState<PMOEventType>('combined');
  const [pmoTrigger, setPmoTrigger] = useState<string>('');
  const [pmoNote, setPmoNote] = useState<string>('');

  const smokingTriggers = ['Stres / Beban', 'Nongkrong / Teman', 'Ngopi', 'Setelah Makan', 'Bosan'];
  const pmoTriggers = ['Sendirian di Kamar', 'Larut Malam', 'Media Sosial', 'Kelelahan / Pelarian', 'Bosan'];

  const handleSave = async () => {
    if (selectedTab === 'smoking') {
      await onSaveSmoking(cigaretteCount, smokingNote || undefined, smokingTrigger || undefined);
    } else {
      await onSavePMO(pmoType, pmoNote || undefined, pmoTrigger || undefined);
    }
    // Reset and close
    setCigaretteCount(1);
    setSmokingTrigger('');
    setSmokingNote('');
    setPmoTrigger('');
    setPmoNote('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.indicator} />

          {/* Tab selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedTab('smoking')}
              style={[styles.tabButton, selectedTab === 'smoking' && styles.tabButtonActive]}
            >
              <Text
                style={[styles.tabText, selectedTab === 'smoking' && styles.tabTextActive]}
              >
                Catat Rokok
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedTab('pmo')}
              style={[styles.tabButton, selectedTab === 'pmo' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, selectedTab === 'pmo' && styles.tabTextActive]}>
                Catat PMO
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {selectedTab === 'smoking' ? (
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Jumlah Batang Rokok</Text>
                <View style={styles.stepperWrapper}>
                  <NumberStepper
                    value={cigaretteCount}
                    onChange={setCigaretteCount}
                    min={1}
                    max={40}
                    unit="batang"
                  />
                </View>

                <Text style={styles.fieldLabel}>Pemicu (Triggers)</Text>
                <View style={styles.triggerChipsRow}>
                  {smokingTriggers.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.7}
                      onPress={() => setSmokingTrigger(smokingTrigger === tag ? '' : tag)}
                      style={[
                        styles.chip,
                        smokingTrigger === tag && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          smokingTrigger === tag && styles.chipTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Catatan Pribadi (Opsional)</Text>
                <TextInput
                  value={smokingNote}
                  onChangeText={setSmokingNote}
                  placeholder="Di mana atau apa yang sedang terjadi?"
                  placeholderTextColor={COLORS.textTertiary}
                  style={styles.textInput}
                />
              </View>
            ) : (
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Jenis Pelanggaran PMO</Text>
                <View style={styles.pmoTypeGrid}>
                  {[
                    { type: 'combined' as const, label: 'Keduanya (PMO Lengkap)' },
                    { type: 'pornography' as const, label: 'Pornografi Saja' },
                    { type: 'masturbation' as const, label: 'Masturbasi Saja' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      activeOpacity={0.7}
                      onPress={() => setPmoType(item.type)}
                      style={[
                        styles.pmoTypeCard,
                        pmoType === item.type && styles.pmoTypeCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pmoTypeText,
                          pmoType === item.type && styles.pmoTypeTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Pemicu Utama</Text>
                <View style={styles.triggerChipsRow}>
                  {pmoTriggers.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      activeOpacity={0.7}
                      onPress={() => setPmoTrigger(pmoTrigger === tag ? '' : tag)}
                      style={[
                        styles.chip,
                        pmoTrigger === tag && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          pmoTrigger === tag && styles.chipTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Catatan Kejujuran</Text>
                <TextInput
                  value={pmoNote}
                  onChangeText={setPmoNote}
                  placeholder="Apa pemicu spesifik sebelum kompromi?"
                  placeholderTextColor={COLORS.textTertiary}
                  style={styles.textInput}
                />
              </View>
            )}

            <View style={styles.actionButtonsRow}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Simpan Kejujuran"
                variant="destructive"
                onPress={handleSave}
                style={{ flex: 2 }}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: COLORS.overlay,
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.screenPadding,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 24,
    maxHeight: '85%',
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  tabButtonActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  contentScroll: {
    maxHeight: 460,
  },
  formSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 8,
  },
  stepperWrapper: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  triggerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pmoTypeGrid: {
    gap: 8,
    marginBottom: 12,
  },
  pmoTypeCard: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSubtle,
  },
  pmoTypeCardActive: {
    borderColor: COLORS.critical.primary,
    backgroundColor: COLORS.critical.surfaceSubtle,
  },
  pmoTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pmoTypeTextActive: {
    color: COLORS.critical.deep,
    fontWeight: '700',
  },
  textInput: {
    minHeight: 44,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
