/**
 * AddTicketFlow Component
 *
 * Multi-step wizard for adding new tickets:
 * Step 1: Choose method (Camera/Library)
 * Step 2: CameraScanner OR ImagePicker
 * Step 3: Detection result (auto-detected info)
 * Step 4: Manual entry form (fill gaps)
 * Step 5: Confirmation
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { CameraScanner } from './CameraScanner';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  Ticket,
  ParkChain,
  PassType,
  PARK_CHAIN_LABELS,
  PASS_TYPE_LABELS,
  PARK_BRAND_COLORS,
  DetectionResult,
} from '../../types/wallet';
import { detectFromQRData } from '../../services/parkDetection';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';

// Animation constants
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

type FlowStep = 'method' | 'scan' | 'detection' | 'form' | 'confirm';

interface AddTicketFlowProps {
  /** Whether the flow is visible */
  visible: boolean;
  /** Called when flow is closed/cancelled */
  onClose: () => void;
  /** Called when ticket is successfully created */
  onComplete: (ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>) => void;
}

export const AddTicketFlow: React.FC<AddTicketFlowProps> = ({
  visible,
  onClose,
  onComplete,
}) => {
  const insets = useSafeAreaInsets();

  // Flow state
  const [step, setStep] = useState<FlowStep>('method');
  const [qrData, setQrData] = useState<string>('');
  const [qrFormat, setQrFormat] = useState<string>('qr');
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // Form state
  const [parkName, setParkName] = useState('');
  const [parkChain, setParkChain] = useState<ParkChain>('other');
  const [passType, setPassType] = useState<PassType>('day_pass');
  const [passholder, setPassholder] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reset flow when closed
  React.useEffect(() => {
    if (!visible) {
      setStep('method');
      setQrData('');
      setQrFormat('qr');
      setDetectionResult(null);
      setParkName('');
      setParkChain('other');
      setPassType('day_pass');
      setPassholder('');
      setValidFrom('');
      setValidUntil('');
      setNotes('');
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  // Handle QR scan
  const handleScan = useCallback((data: string, format: string) => {
    setQrData(data);
    setQrFormat(format);

    // Run detection
    const result = detectFromQRData(data);
    setDetectionResult(result);

    // Pre-fill form with detected values
    if (result.parkName) setParkName(result.parkName);
    if (result.parkChain) setParkChain(result.parkChain);
    if (result.passType) setPassType(result.passType);
    if (result.validFrom) setValidFrom(result.validFrom);
    if (result.validUntil) setValidUntil(result.validUntil);

    setStep('detection');
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    // Validate required fields
    if (!parkName.trim()) {
      Alert.alert('Missing Info', 'Please enter a park name');
      return;
    }
    if (!validFrom.trim() || !validUntil.trim()) {
      Alert.alert('Missing Info', 'Please enter valid dates');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    onComplete({
      parkName: parkName.trim(),
      parkChain,
      passType,
      passholder: passholder.trim() || undefined,
      validFrom,
      validUntil,
      qrData,
      qrFormat: qrFormat === 'qr' ? 'QR_CODE' : qrFormat === 'aztec' ? 'AZTEC' : qrFormat === 'datamatrix' ? 'DATA_MATRIX' : 'QR_CODE',
      status: 'active',
      notes: notes.trim() || undefined,
      autoDetected: detectionResult?.confidence !== 'low',
    });

    onClose();
  }, [parkName, parkChain, passType, passholder, validFrom, validUntil, qrData, qrFormat, notes, onComplete, onClose]);

  // Go back to previous step
  const goBack = useCallback(() => {
    switch (step) {
      case 'scan':
        setStep('method');
        break;
      case 'detection':
        setStep('scan');
        break;
      case 'form':
        setStep('detection');
        break;
      case 'confirm':
        setStep('form');
        break;
    }
  }, [step]);

  // Render step content
  const renderStep = () => {
    switch (step) {
      case 'method':
        return renderMethodStep();
      case 'scan':
        return renderScanStep();
      case 'detection':
        return renderDetectionStep();
      case 'form':
        return renderFormStep();
      case 'confirm':
        return renderConfirmStep();
    }
  };

  // Step 1: Choose method
  const renderMethodStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Add New Ticket</Text>
      <Text style={styles.stepSubtitle}>
        How would you like to add your ticket?
      </Text>

      <View style={styles.methodOptions}>
        <Pressable
          style={({ pressed }) => [
            styles.methodCard,
            pressed && styles.methodCardPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStep('scan');
          }}
        >
          <View style={styles.methodIcon}>
            <Ionicons name="camera" size={32} color={colors.accent.primary} />
          </View>
          <Text style={styles.methodTitle}>Scan QR Code</Text>
          <Text style={styles.methodDescription}>
            Use your camera to scan the QR code on your ticket
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.methodCard,
            pressed && styles.methodCardPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert('Coming Soon', 'Photo library import will be available in the next update.');
          }}
        >
          <View style={styles.methodIcon}>
            <Ionicons name="images" size={32} color={colors.accent.primary} />
          </View>
          <Text style={styles.methodTitle}>Photo Library</Text>
          <Text style={styles.methodDescription}>
            Import a screenshot or photo of your ticket
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // Step 2: Camera scan
  const renderScanStep = () => (
    <CameraScanner
      onScan={handleScan}
      onCancel={goBack}
      showLibraryOption={false}
    />
  );

  // Step 3: Detection result
  const renderDetectionStep = () => {
    const chain: ParkChain = detectionResult?.parkChain || 'other';
    const brandColor = PARK_BRAND_COLORS[chain];

    return (
      <ScrollView
        style={styles.stepContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.stepTitle}>QR Code Detected!</Text>

        {/* QR Code preview */}
        <View style={styles.qrPreviewCard}>
          <QRCodeDisplay data={qrData} size={120} />
        </View>

        {/* Detection results */}
        {detectionResult && (
          <View style={styles.detectionCard}>
            <View style={[styles.detectionHeader, { backgroundColor: brandColor }]}>
              <Text style={styles.detectionHeaderText}>
                {detectionResult.confidence === 'high' ? '✓ Auto-detected' :
                  detectionResult.confidence === 'medium' ? '? Partially detected' :
                    '! Manual entry needed'}
              </Text>
            </View>

            {detectionResult.parkName && (
              <View style={styles.detectionRow}>
                <Text style={styles.detectionLabel}>Park</Text>
                <Text style={styles.detectionValue}>{detectionResult.parkName}</Text>
              </View>
            )}

            {detectionResult.parkChain && (
              <View style={styles.detectionRow}>
                <Text style={styles.detectionLabel}>Chain</Text>
                <Text style={styles.detectionValue}>
                  {PARK_CHAIN_LABELS[detectionResult.parkChain]}
                </Text>
              </View>
            )}

            {detectionResult.passType && (
              <View style={styles.detectionRow}>
                <Text style={styles.detectionLabel}>Type</Text>
                <Text style={styles.detectionValue}>
                  {PASS_TYPE_LABELS[detectionResult.passType]}
                </Text>
              </View>
            )}

            {detectionResult.missingFields.length > 0 && (
              <View style={styles.missingFieldsNote}>
                <Text style={styles.missingFieldsText}>
                  Missing: {detectionResult.missingFields.join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Continue button */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => setStep('form')}
        >
          <Text style={styles.primaryButtonText}>
            {detectionResult?.missingFields.length === 0 ? 'Confirm Details' : 'Fill in Details'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    );
  };

  // Step 4: Manual entry form
  const renderFormStep = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.stepContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepTitle}>Ticket Details</Text>
        <Text style={styles.stepSubtitle}>
          Confirm or edit the ticket information
        </Text>

        {/* Park Name */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Park Name *</Text>
          <TextInput
            style={styles.textInput}
            value={parkName}
            onChangeText={setParkName}
            placeholder="e.g., Magic Kingdom"
            placeholderTextColor={colors.text.meta}
          />
        </View>

        {/* Park Chain */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Park Chain</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {(Object.keys(PARK_CHAIN_LABELS) as ParkChain[]).map((chain) => (
              <Pressable
                key={chain}
                style={[
                  styles.chip,
                  parkChain === chain && styles.chipSelected,
                  parkChain === chain && { backgroundColor: PARK_BRAND_COLORS[chain] },
                ]}
                onPress={() => setParkChain(chain)}
              >
                <Text
                  style={[
                    styles.chipText,
                    parkChain === chain && styles.chipTextSelected,
                  ]}
                >
                  {PARK_CHAIN_LABELS[chain]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Pass Type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Pass Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {(Object.keys(PASS_TYPE_LABELS) as PassType[]).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.chip,
                  passType === type && styles.chipSelected,
                ]}
                onPress={() => setPassType(type)}
              >
                <Text
                  style={[
                    styles.chipText,
                    passType === type && styles.chipTextSelected,
                  ]}
                >
                  {PASS_TYPE_LABELS[type]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Passholder Name */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Passholder Name (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={passholder}
            onChangeText={setPassholder}
            placeholder="e.g., John Doe"
            placeholderTextColor={colors.text.meta}
          />
        </View>

        {/* Valid From */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Valid From *</Text>
          <TextInput
            style={styles.textInput}
            value={validFrom}
            onChangeText={setValidFrom}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text.meta}
          />
        </View>

        {/* Valid Until */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Valid Until *</Text>
          <TextInput
            style={styles.textInput}
            value={validUntil}
            onChangeText={setValidUntil}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text.meta}
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor={colors.text.meta}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save button */}
        <Pressable
          style={styles.primaryButton}
          onPress={handleSubmit}
        >
          <Text style={styles.primaryButtonText}>Save Ticket</Text>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Step 5: Confirmation (optional - currently goes directly to save)
  const renderConfirmStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Ticket Added!</Text>
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header (hidden during scan step) */}
        {step !== 'scan' && (
          <View style={styles.header}>
            {step !== 'method' ? (
              <Pressable style={styles.backButton} onPress={goBack}>
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>
        )}

        {/* Step content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderStep()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },

  // Method step
  methodOptions: {
    gap: spacing.lg,
  },
  methodCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  methodCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  methodIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  methodDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Detection step
  qrPreviewCard: {
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  detectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  detectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  detectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  detectionLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detectionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },
  missingFieldsNote: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: '#F5A62310', // Warning amber
  },
  missingFieldsText: {
    fontSize: 13,
    color: '#D97706', // Warning amber
    fontWeight: '500',
  },

  // Form step
  formGroup: {
    marginBottom: spacing.lg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.actionPill,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.actionPill,
    marginTop: spacing.lg,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
