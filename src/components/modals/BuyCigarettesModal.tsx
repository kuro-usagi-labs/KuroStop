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
import { Button } from '../common/Button';
import { NumberStepper } from '../common/NumberStepper';
import { COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { PurchaseItemType } from '../../types';
import { formatIDR, parseIDRInput } from '../../utils/currency';

interface BuyCigarettesModalProps {
  visible: boolean;
  onClose: () => void;
  onSavePurchase: (
    itemType: PurchaseItemType,
    quantity: number,
    totalPrice: number,
    brandName?: string,
    note?: string
  ) => Promise<void>;
}

export const BuyCigarettesModal: React.FC<BuyCigarettesModalProps> = ({
  visible,
  onClose,
  onSavePurchase,
}) => {
  const [itemType, setItemType] = useState<PurchaseItemType>('pack');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedPresetPrice, setSelectedPresetPrice] = useState<number>(28000);
  const [customPriceText, setCustomPriceText] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('Marlboro');
  const [note, setNote] = useState<string>('');

  const packPresets = [20000, 25000, 28000, 35000, 42000];
  const stickPresets = [3000, 5000, 10000];

  const presets = itemType === 'pack' ? packPresets : stickPresets;
  const unitPrice = customPriceText ? parseIDRInput(customPriceText) : selectedPresetPrice;
  const totalPrice = unitPrice * quantity;

  const handleSave = async () => {
    if (totalPrice <= 0) return;
    await onSavePurchase(
      itemType,
      quantity,
      totalPrice,
      brandName || undefined,
      note || undefined
    );
    // Reset
    setQuantity(1);
    setCustomPriceText('');
    setNote('');
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
          <Text style={styles.sheetTitle}>Catat Pembelian Rokok</Text>
          <Text style={styles.sheetSubtitle}>
            Uang sungguhan yang keluar untuk kebiasaan yang ingin kamu hilangkan.
          </Text>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setItemType('pack');
                  setSelectedPresetPrice(28000);
                  setCustomPriceText('');
                }}
                style={[styles.typeButton, itemType === 'pack' && styles.typeButtonActive]}
              >
                <Text style={[styles.typeText, itemType === 'pack' && styles.typeTextActive]}>
                  Bungkus (Pack)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setItemType('stick');
                  setSelectedPresetPrice(5000);
                  setCustomPriceText('');
                }}
                style={[styles.typeButton, itemType === 'stick' && styles.typeButtonActive]}
              >
                <Text style={[styles.typeText, itemType === 'stick' && styles.typeTextActive]}>
                  Batangan (Ketengan)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quantity */}
            <Text style={styles.fieldLabel}>Jumlah Pembelian</Text>
            <View style={styles.stepperWrapper}>
              <NumberStepper
                value={quantity}
                onChange={setQuantity}
                min={1}
                max={20}
                unit={itemType === 'pack' ? 'bungkus' : 'batang'}
              />
            </View>

            {/* Price Presets */}
            <Text style={styles.fieldLabel}>Harga Satuan</Text>
            <View style={styles.presetRow}>
              {presets.map((price) => (
                <TouchableOpacity
                  key={price}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedPresetPrice(price);
                    setCustomPriceText('');
                  }}
                  style={[
                    styles.presetChip,
                    !customPriceText && selectedPresetPrice === price && styles.presetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      !customPriceText && selectedPresetPrice === price && styles.presetChipTextActive,
                    ]}
                  >
                    {formatIDR(price)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Price */}
            <Text style={styles.fieldLabel}>Atau Masukkan Harga Satuan Lain</Text>
            <TextInput
              value={customPriceText}
              onChangeText={setCustomPriceText}
              placeholder="Contoh: 31000"
              keyboardType="number-pad"
              placeholderTextColor={COLORS.textTertiary}
              style={styles.textInput}
            />

            {/* Brand */}
            <Text style={styles.fieldLabel}>Merek Rokok</Text>
            <TextInput
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Marlboro, Sampoerna, Surya, dll."
              placeholderTextColor={COLORS.textTertiary}
              style={styles.textInput}
            />

            {/* Total calculation banner */}
            <View style={styles.totalBanner}>
              <Text style={styles.totalLabel}>Total Pengeluaran:</Text>
              <Text style={styles.totalAmount}>{formatIDR(totalPrice)}</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <Button title="Batal" variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button
                title="Catat Pengeluaran"
                variant="primary"
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
    maxHeight: '90%',
  },
  indicator: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.borderStrong,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  contentScroll: {
    maxHeight: 480,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  typeButtonActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeTextActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 10,
  },
  stepperWrapper: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  presetChipActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  presetChipTextActive: {
    color: '#FFFFFF',
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
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
