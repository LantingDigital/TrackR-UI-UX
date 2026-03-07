/**
 * AddTicketFlow Component
 *
 * Multi-step wizard for adding new tickets/passes:
 * Step 1: Choose method (Camera / Photo Library)
 * Step 2: CameraScanner (live scan or library pick with barcode extraction)
 * Step 3: Detection result (auto-detected info + barcode preview)
 * Step 4: Manual entry form (fill gaps)
 *
 * Supports the hybrid approach:
 * - Extracts barcode data from scanned/imported images
 * - Falls back to IMAGE_ONLY when extraction fails
 * - Always saves original image URI as backup
 *
 * All animations use react-native-reanimated with spring physics.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  Alert,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  Easing,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { CameraScanner } from './CameraScanner';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  Ticket,
  BarcodeFormat,
  ParkChain,
  PassType,
  PARK_CHAIN_LABELS,
  PASS_TYPE_LABELS,
  PARK_BRAND_COLORS,
  DetectionResult,
} from '../../types/wallet';
import { detectFromQRData } from '../../services/parkDetection';
import { WalletStorage } from '../../services/walletStorage';
import { decodeFromImageUri } from '../../services/barcodeDecoder';
import { PARK_INDEX } from '../../data/parkIndex';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { typography } from '../../theme/typography';
import { useKeyboardAvoidance } from '../../hooks/useKeyboardAvoidance';
import { getCardArtForPark, getLogoForPark, getHeroUrlForPark } from '../../utils/parkAssets';

/**
 * Park name -> ParkChain mapping for autocomplete auto-fill.
 * Cedar Fair + Six Flags merged in 2024 -> "Six Flags Entertainment"
 * mapped to the closest existing ParkChain type.
 */
/**
 * Derive chain from park index entry (owner field + name heuristics).
 * Six Flags acquired Cedar Fair in 2024 — owner is "Six Flags" for both legacy chains.
 * We distinguish them by name patterns for now.
 */
function deriveChain(park: { name: string; owner?: string }): ParkChain {
  const name = park.name.toLowerCase();
  const owner = (park.owner || '').toLowerCase();
  if (name.includes('disney') || owner.includes('disney')) return 'disney';
  if (name.includes('universal') || owner.includes('universal')) return 'universal';
  if (name.includes('seaworld') || owner.includes('seaworld')) return 'seaworld';
  if (name.includes('busch gardens')) return 'busch_gardens';
  // Legacy Cedar Fair parks (now owned by Six Flags)
  const cedarFairParks = ['cedar point', 'kings island', 'carowinds', 'kings dominion',
    "canada's wonderland", "knott's berry farm", 'dorney park', 'valleyfair',
    "michigan's adventure", 'worlds of fun', "california's great america"];
  if (cedarFairParks.some((cf) => name.includes(cf))) return 'cedar_fair';
  if (name.includes('six flags') || owner.includes('six flags')) return 'six_flags';
  return 'other';
}

/** Build park name list + chain lookup from park index */
const UNIQUE_PARK_NAMES: string[] = [];
const PARK_TO_CHAIN: Record<string, ParkChain> = {};

(() => {
  const seen = new Set<string>();
  for (const park of PARK_INDEX) {
    if (!park.name || seen.has(park.name) || park.name === 'Unknown Park') continue;
    seen.add(park.name);
    UNIQUE_PARK_NAMES.push(park.name);
    PARK_TO_CHAIN[park.name] = deriveChain(park);
  }
  UNIQUE_PARK_NAMES.sort();
})();

/** Format a Date to ISO date string (YYYY-MM-DD) in local timezone */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse ISO date string to Date, fallback to today */
function fromISODate(str: string): Date {
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Add one year to a date */
function addOneYear(date: Date): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + 1);
  return result;
}

// Spring config for button presses
const PRESS_SPRING = { damping: 16, stiffness: 180, mass: 0.8 };

type FlowStep = 'method' | 'scan' | 'detection' | 'form';

/**
 * Human-readable barcode format labels
 */
const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  QR_CODE: 'QR Code',
  AZTEC: 'Aztec',
  PDF417: 'PDF417',
  DATA_MATRIX: 'Data Matrix',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  EAN_13: 'EAN-13',
  UPC_A: 'UPC-A',
  IMAGE_ONLY: 'Image Only',
};

interface AddTicketFlowProps {
  /** Whether the flow is visible */
  visible: boolean;
  /** Called when flow is closed/cancelled */
  onClose: () => void;
  /** Called when ticket is successfully created */
  onComplete: (ticketData: Omit<Ticket, 'id' | 'addedAt' | 'isDefault' | 'isFavorite'>) => void;
  /** Existing tickets for duplicate detection */
  existingTickets?: Ticket[];
}

export const AddTicketFlow: React.FC<AddTicketFlowProps> = ({
  visible,
  onClose,
  onComplete,
  existingTickets = [],
}) => {
  const insets = useSafeAreaInsets();
  const { scrollRef, scrollHandler, handleInputFocus, keyboardPadding } = useKeyboardAvoidance();

  // Flow state
  const [step, setStep] = useState<FlowStep>('method');
  const [qrData, setQrData] = useState<string>('');
  const [qrFormat, setQrFormat] = useState<BarcodeFormat>('QR_CODE');
  const [originalImageUri, setOriginalImageUri] = useState<string | undefined>();
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  // Form state
  const [parkName, setParkName] = useState('');
  const [parkChain, setParkChain] = useState<ParkChain>('other');
  const [passType, setPassType] = useState<PassType>('day_pass');
  const [passholder, setPassholder] = useState('');
  const [validFromDate, setValidFromDate] = useState<Date>(new Date());
  const [validUntilDate, setValidUntilDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  // Date picker visibility
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showUntilPicker, setShowUntilPicker] = useState(false);

  // Park autocomplete
  const [parkQuery, setParkQuery] = useState('');
  const [showParkSuggestions, setShowParkSuggestions] = useState(false);

  // Animated heights for date pickers
  const fromPickerHeight = useSharedValue(0);
  const untilPickerHeight = useSharedValue(0);

  const fromPickerStyle = useAnimatedStyle(() => ({
    height: fromPickerHeight.value,
    opacity: fromPickerHeight.value > 0 ? 1 : 0,
    overflow: 'hidden' as const,
  }));
  const untilPickerStyle = useAnimatedStyle(() => ({
    height: untilPickerHeight.value,
    opacity: untilPickerHeight.value > 0 ? 1 : 0,
    overflow: 'hidden' as const,
  }));

  // Filter park suggestions based on query
  const parkSuggestions = useMemo(() => {
    if (!parkQuery || parkQuery.length < 3) return [];
    const lower = parkQuery.toLowerCase();
    return UNIQUE_PARK_NAMES.filter((name) =>
      name.toLowerCase().includes(lower)
    ).slice(0, 6);
  }, [parkQuery]);

  // Computed: annual pass auto-calculates expiry
  const annualExpiry = useMemo(() => {
    return addOneYear(validFromDate);
  }, [validFromDate]);

  // Whether this pass type needs date fields
  const needsDateFields = passType !== 'vip' && passType !== 'parking' && passType !== 'express' && passType !== 'unknown';

  // Button press animations
  const cameraCardScale = useSharedValue(1);
  const libraryCardScale = useSharedValue(1);
  const submitButtonScale = useSharedValue(1);

  const cameraCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraCardScale.value }],
  }));
  const libraryCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: libraryCardScale.value }],
  }));
  const submitButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitButtonScale.value }],
  }));

  // Reset flow when closed
  React.useEffect(() => {
    if (!visible) {
      setStep('method');
      setQrData('');
      setQrFormat('QR_CODE');
      setOriginalImageUri(undefined);
      setDetectionResult(null);
      setParkName('');
      setParkChain('other');
      setPassType('day_pass');
      setPassholder('');
      setValidFromDate(new Date());
      setValidUntilDate(new Date());
      setNotes('');
      setShowFromPicker(false);
      setShowUntilPicker(false);
      setParkQuery('');
      setShowParkSuggestions(false);
      fromPickerHeight.value = 0;
      untilPickerHeight.value = 0;
    }
  }, [visible]);

  // Handle successful barcode scan (from camera or library)
  const handleScan = useCallback((data: string, format: BarcodeFormat) => {
    setQrData(data);
    setQrFormat(format);

    // Run park detection on the barcode data
    const result = detectFromQRData(data);
    setDetectionResult(result);

    // Pre-fill form with detected values
    if (result.parkName) {
      setParkName(result.parkName);
      setParkQuery(result.parkName);
    }
    if (result.parkChain) setParkChain(result.parkChain);
    if (result.passType) setPassType(result.passType);
    if (result.validFrom) setValidFromDate(fromISODate(result.validFrom));
    if (result.validUntil) setValidUntilDate(fromISODate(result.validUntil));

    setStep('detection');
  }, []);

  // Handle image-only fallback (no barcode found in image)
  const handleImageOnlyFallback = useCallback((imageUri: string) => {
    setQrData('');
    setQrFormat('IMAGE_ONLY');
    setOriginalImageUri(imageUri);
    setDetectionResult(null);

    // Go straight to form since we have no data to detect from
    setStep('form');
  }, []);

  // Handle photo library import directly from method step
  const handlePickFromLibrary = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets[0]) return;

      const imageUri = pickerResult.assets[0].uri;
      setOriginalImageUri(imageUri);

      // Step 1: Try expo-camera scanFromURLAsync (handles QR codes well)
      let decoded = false;
      try {
        const scanResults = await Camera.scanFromURLAsync(imageUri, [
          'qr', 'aztec', 'pdf417', 'datamatrix', 'code128', 'code39', 'ean13', 'upc_a',
        ]);

        if (scanResults && scanResults.length > 0) {
          const firstResult = scanResults[0];
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          const formatMap: Record<string, BarcodeFormat> = {
            qr: 'QR_CODE', aztec: 'AZTEC', pdf417: 'PDF417', datamatrix: 'DATA_MATRIX',
            code128: 'CODE_128', code39: 'CODE_39', ean13: 'EAN_13', upc_a: 'UPC_A',
          };

          const format = formatMap[firstResult.type] || 'QR_CODE';
          handleScan(firstResult.data, format);
          decoded = true;
        }
      } catch (scanError) {
        console.warn('expo-camera scan failed, trying JS decoder:', scanError);
      }

      // Step 2: If expo-camera failed, try JS barcode decoder (handles 1D barcodes)
      if (!decoded) {
        try {
          const jsResult = await decodeFromImageUri(imageUri);
          if (jsResult) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleScan(jsResult.data, jsResult.format);
            decoded = true;
          }
        } catch (jsError) {
          console.warn('JS barcode decoder failed:', jsError);
        }
      }

      // Step 3: If both failed, offer raw image fallback
      if (!decoded) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'No Barcode Found',
          'We could not detect a barcode in this image. Would you like to save it as an image-only pass?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use Original Image',
              onPress: () => handleImageOnlyFallback(imageUri),
            },
          ],
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from library');
    }
  }, [handleScan, handleImageOnlyFallback]);

  // Save logic extracted so duplicate check can call it after confirmation
  const proceedWithSave = useCallback(() => {
    // Compute final date strings based on pass type
    let finalValidFrom = toISODate(validFromDate);
    let finalValidUntil = toISODate(validUntilDate);

    if (passType === 'day_pass') {
      finalValidUntil = finalValidFrom;
    } else if (passType === 'annual_pass') {
      finalValidUntil = toISODate(annualExpiry);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let savedOriginalUri = originalImageUri;
    if (originalImageUri) {
      try {
        savedOriginalUri = originalImageUri;
      } catch (err) {
        console.error('Failed to save original image:', err);
      }
    }

    const trimmedParkName = parkName.trim();
    onComplete({
      parkName: trimmedParkName,
      parkChain,
      passType,
      passholder: passholder.trim() || undefined,
      validFrom: finalValidFrom,
      validUntil: finalValidUntil,
      qrData: qrData || '',
      qrFormat,
      originalPhotoUri: savedOriginalUri,
      heroImageSource: getCardArtForPark(trimmedParkName),
      heroImageUri: getHeroUrlForPark(trimmedParkName),
      logoImageSource: getLogoForPark(trimmedParkName),
      status: 'active',
      notes: notes.trim() || undefined,
      autoDetected: detectionResult?.confidence !== 'low',
    });

    onClose();
  }, [parkName, parkChain, passType, passholder, validFromDate, validUntilDate, annualExpiry, qrData, qrFormat, originalImageUri, notes, detectionResult, onComplete, onClose]);

  // Handle form submission with duplicate detection
  const handleSubmit = useCallback(() => {
    if (!parkName.trim()) {
      Alert.alert('Missing Info', 'Please enter a park name');
      return;
    }

    // Check for duplicate barcode/QR data
    if (qrData && qrFormat !== 'IMAGE_ONLY') {
      const duplicate = existingTickets.find(t => t.qrData === qrData);
      if (duplicate) {
        Alert.alert(
          'Duplicate Pass',
          `This barcode matches an existing pass for ${duplicate.parkName}. Import anyway?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Import Anyway', onPress: proceedWithSave },
          ],
        );
        return;
      }
    }

    proceedWithSave();
  }, [parkName, qrData, qrFormat, existingTickets, proceedWithSave]);

  // Go back to previous step
  const goBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (step) {
      case 'scan':
        setStep('method');
        break;
      case 'detection':
        setStep('method');
        break;
      case 'form':
        if (qrFormat === 'IMAGE_ONLY') {
          setStep('method');
        } else {
          setStep('detection');
        }
        break;
    }
  }, [step, qrFormat]);

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
    }
  };

  // =============================================
  // Step 1: Choose method
  // =============================================
  const renderMethodStep = () => (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={styles.stepContainer}
    >
      <Text style={styles.stepTitle}>Add New Pass</Text>
      <Text style={styles.stepSubtitle}>
        How would you like to add your pass?
      </Text>

      <View style={styles.methodOptions}>
        {/* Camera scan option */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStep('scan');
          }}
          onPressIn={() => { cameraCardScale.value = withSpring(0.97, PRESS_SPRING); }}
          onPressOut={() => { cameraCardScale.value = withSpring(1, PRESS_SPRING); }}
        >
          <Animated.View style={[styles.methodCard, cameraCardStyle]}>
            <View style={styles.methodIcon}>
              <Ionicons name="camera" size={32} color={colors.accent.primary} />
            </View>
            <Text style={styles.methodTitle}>Scan with Camera</Text>
            <Text style={styles.methodDescription}>
              Point your camera at the barcode or QR code on your pass
            </Text>
          </Animated.View>
        </Pressable>

        {/* Photo library option */}
        <Pressable
          onPress={handlePickFromLibrary}
          onPressIn={() => { libraryCardScale.value = withSpring(0.97, PRESS_SPRING); }}
          onPressOut={() => { libraryCardScale.value = withSpring(1, PRESS_SPRING); }}
        >
          <Animated.View style={[styles.methodCard, libraryCardStyle]}>
            <View style={styles.methodIcon}>
              <Ionicons name="images" size={32} color={colors.accent.primary} />
            </View>
            <Text style={styles.methodTitle}>Import from Photos</Text>
            <Text style={styles.methodDescription}>
              Pick a screenshot or photo of your pass from your library
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );

  // =============================================
  // Step 2: Camera scan
  // =============================================
  const renderScanStep = () => (
    <CameraScanner
      onScan={handleScan}
      onCancel={goBack}
      showLibraryOption={true}
      onImageOnlyFallback={handleImageOnlyFallback}
    />
  );

  // =============================================
  // Step 3: Detection result
  // =============================================
  const renderDetectionStep = () => {
    const chain: ParkChain = detectionResult?.parkChain || 'other';
    const brandColor = PARK_BRAND_COLORS[chain];
    const hasDetection = !!detectionResult;
    const confidence = detectionResult?.confidence ?? 'low';
    const missingCount = detectionResult?.missingFields.length ?? 0;

    return (
      <Animated.ScrollView
        entering={FadeIn.duration(250)}
        style={styles.stepContainer}
        contentContainerStyle={styles.detectionScrollContent}
      >
        {/* Barcode preview card */}
        <View style={styles.qrPreviewCard}>
          <QRCodeDisplay
            data={qrData}
            format={qrFormat}
            size={qrFormat === 'QR_CODE' || qrFormat === 'AZTEC' || qrFormat === 'DATA_MATRIX' ? 140 : 220}
            originalPhotoUri={originalImageUri}
          />
          <Text style={styles.formatBadge}>
            {FORMAT_LABELS[qrFormat]}
          </Text>
        </View>

        {/* Detection info card -- always shows, fills space with what we know */}
        <View style={styles.detectionCard}>
          {/* Confidence banner */}
          <View style={[styles.detectionHeader, { backgroundColor: brandColor }]}>
            <Ionicons
              name={confidence === 'high' ? 'checkmark-circle' : confidence === 'medium' ? 'alert-circle' : 'create'}
              size={16}
              color="#FFFFFF"
              style={{ marginRight: spacing.sm }}
            />
            <Text style={styles.detectionHeaderText}>
              {confidence === 'high'
                ? 'Auto-detected'
                : confidence === 'medium'
                  ? 'Partially detected'
                  : 'Manual entry needed'}
            </Text>
          </View>

          {/* Always show rows -- detected values or placeholders */}
          <View style={styles.detectionRow}>
            <View style={styles.detectionRowIcon}>
              <Ionicons name="location-outline" size={16} color={colors.text.meta} />
            </View>
            <View style={styles.detectionRowContent}>
              <Text style={styles.detectionLabel}>Park Name</Text>
              <Text style={[styles.detectionValue, !detectionResult?.parkName && styles.detectionPlaceholder]}>
                {detectionResult?.parkName || 'Not detected — add in next step'}
              </Text>
            </View>
          </View>

          <View style={styles.detectionDivider} />

          <View style={styles.detectionRow}>
            <View style={styles.detectionRowIcon}>
              <Ionicons name="business-outline" size={16} color={colors.text.meta} />
            </View>
            <View style={styles.detectionRowContent}>
              <Text style={styles.detectionLabel}>Park Chain</Text>
              <Text style={[styles.detectionValue, !detectionResult?.parkChain && styles.detectionPlaceholder]}>
                {detectionResult?.parkChain ? PARK_CHAIN_LABELS[detectionResult.parkChain] : 'Not detected'}
              </Text>
            </View>
          </View>

          <View style={styles.detectionDivider} />

          <View style={styles.detectionRow}>
            <View style={styles.detectionRowIcon}>
              <Ionicons name="card-outline" size={16} color={colors.text.meta} />
            </View>
            <View style={styles.detectionRowContent}>
              <Text style={styles.detectionLabel}>Pass Type</Text>
              <Text style={[styles.detectionValue, !detectionResult?.passType && styles.detectionPlaceholder]}>
                {detectionResult?.passType ? PASS_TYPE_LABELS[detectionResult.passType] : 'Not detected'}
              </Text>
            </View>
          </View>

          {detectionResult?.passholder && (
            <>
              <View style={styles.detectionDivider} />
              <View style={styles.detectionRow}>
                <View style={styles.detectionRowIcon}>
                  <Ionicons name="person-outline" size={16} color={colors.text.meta} />
                </View>
                <View style={styles.detectionRowContent}>
                  <Text style={styles.detectionLabel}>Passholder</Text>
                  <Text style={styles.detectionValue}>{detectionResult.passholder}</Text>
                </View>
              </View>
            </>
          )}

          {detectionResult?.validFrom && (
            <>
              <View style={styles.detectionDivider} />
              <View style={styles.detectionRow}>
                <View style={styles.detectionRowIcon}>
                  <Ionicons name="calendar-outline" size={16} color={colors.text.meta} />
                </View>
                <View style={styles.detectionRowContent}>
                  <Text style={styles.detectionLabel}>Valid From</Text>
                  <Text style={styles.detectionValue}>
                    {new Date(detectionResult.validFrom).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Missing fields summary */}
        {missingCount > 0 && (
          <View style={styles.missingFieldsSummary}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.missingFieldsSummaryText}>
              {missingCount} {missingCount === 1 ? 'field needs' : 'fields need'} your input on the next step
            </Text>
          </View>
        )}

        {/* Continue button */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setStep('form');
          }}
        >
          <Text style={styles.primaryButtonText}>
            {missingCount === 0 ? 'Confirm Details' : 'Fill in Details'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.ScrollView>
    );
  };

  // Helper: toggle date picker with animated expand/collapse
  const toggleFromPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const opening = !showFromPicker;
    setShowFromPicker(opening);
    fromPickerHeight.value = withTiming(opening ? 216 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    if (opening && showUntilPicker) {
      setShowUntilPicker(false);
      untilPickerHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
    }
  }, [showFromPicker, showUntilPicker]);

  const toggleUntilPicker = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const opening = !showUntilPicker;
    setShowUntilPicker(opening);
    untilPickerHeight.value = withTiming(opening ? 216 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
    if (opening && showFromPicker) {
      setShowFromPicker(false);
      fromPickerHeight.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.ease) });
    }
  }, [showUntilPicker, showFromPicker]);

  // Handle park name input with autocomplete
  const handleParkNameChange = useCallback((text: string) => {
    setParkQuery(text);
    setParkName(text);
    setShowParkSuggestions(text.length >= 2);
  }, []);

  const handleParkSelect = useCallback((name: string) => {
    Haptics.selectionAsync();
    setParkName(name);
    setParkQuery(name);
    setShowParkSuggestions(false);
    const chain = PARK_TO_CHAIN[name];
    if (chain) {
      setParkChain(chain);
    }
  }, []);

  // =============================================
  // Step 4: Manual entry form
  // =============================================
  const renderFormStep = () => (
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        entering={SlideInRight.springify().damping(20).stiffness(200)}
        style={styles.stepContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.stepTitle}>Pass Details</Text>
        <Text style={styles.stepSubtitle}>
          {qrFormat === 'IMAGE_ONLY'
            ? 'Enter the details for your pass'
            : 'Confirm or edit the pass information'}
        </Text>

        {/* Original image preview for IMAGE_ONLY */}
        {qrFormat === 'IMAGE_ONLY' && originalImageUri && (
          <View style={styles.imageOnlyPreview}>
            <Image
              source={{ uri: originalImageUri }}
              style={styles.imageOnlyImage}
              resizeMode="contain"
            />
            <Text style={styles.imageOnlyLabel}>Saved as image (no barcode detected)</Text>
          </View>
        )}

        {/* Barcode preview for scanned passes */}
        {qrFormat !== 'IMAGE_ONLY' && qrData && (
          <View style={styles.miniPreview}>
            <QRCodeDisplay
              data={qrData}
              format={qrFormat}
              size={qrFormat === 'QR_CODE' || qrFormat === 'AZTEC' ? 80 : 140}
            />
          </View>
        )}

        {/* Park Name with Autocomplete */}
        <View style={[styles.formGroup, { zIndex: 10 }]}>
          <Text style={styles.formLabel}>Park Name *</Text>
          <TextInput
            style={styles.textInput}
            value={parkQuery}
            onChangeText={handleParkNameChange}
            onFocus={(e) => {
              handleInputFocus(e);
              if (parkQuery.length >= 3) setShowParkSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowParkSuggestions(false), 200);
            }}
            placeholder="e.g., Cedar Point"
            placeholderTextColor={colors.text.meta}
          />
          {showParkSuggestions && parkSuggestions.length > 0 && (
            <View style={styles.autocompleteDropdown}>
              {parkSuggestions.map((name) => (
                <Pressable
                  key={name}
                  style={styles.autocompleteItem}
                  onPress={() => handleParkSelect(name)}
                >
                  <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
                  <Text style={styles.autocompleteText} numberOfLines={1}>{name}</Text>
                  {PARK_TO_CHAIN[name] && (
                    <Text style={styles.autocompleteChain} numberOfLines={1}>
                      {PARK_CHAIN_LABELS[PARK_TO_CHAIN[name]]}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
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
                  parkChain === chain && { backgroundColor: PARK_BRAND_COLORS[chain], borderColor: PARK_BRAND_COLORS[chain] },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setParkChain(chain);
                }}
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
                onPress={() => {
                  Haptics.selectionAsync();
                  setPassType(type);
                  // Close any open date pickers when switching type
                  if (showFromPicker) {
                    setShowFromPicker(false);
                    fromPickerHeight.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
                  }
                  if (showUntilPicker) {
                    setShowUntilPicker(false);
                    untilPickerHeight.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
                  }
                }}
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

        {/* Dynamic Date Fields based on pass type */}
        {needsDateFields && (
          <Animated.View entering={FadeIn.duration(200)}>
            {/* Day Pass: single "Date of Visit" */}
            {passType === 'day_pass' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date of Visit</Text>
                <Pressable style={styles.dateButton} onPress={toggleFromPicker}>
                  <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                  <Text style={styles.dateButtonText}>{toISODate(validFromDate)}</Text>
                  <Ionicons
                    name={showFromPicker ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.text.meta}
                  />
                </Pressable>
                <Animated.View style={fromPickerStyle}>
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={validFromDate}
                      mode="date"
                      display="spinner"
                      onChange={(_, date) => {
                        if (date) {
                          setValidFromDate(date);
                          setValidUntilDate(date);
                        }
                      }}
                      style={styles.datePicker}
                      textColor={colors.text.primary}
                    />
                  </View>
                </Animated.View>
              </View>
            )}

            {/* Multi-Day: start + end date pickers */}
            {passType === 'multi_day' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <Pressable style={styles.dateButton} onPress={toggleFromPicker}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.dateButtonText}>{toISODate(validFromDate)}</Text>
                    <Ionicons
                      name={showFromPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.meta}
                    />
                  </Pressable>
                  <Animated.View style={fromPickerStyle}>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={validFromDate}
                        mode="date"
                        display="spinner"
                        onChange={(_, date) => { if (date) setValidFromDate(date); }}
                        style={styles.datePicker}
                        textColor={colors.text.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <Pressable style={styles.dateButton} onPress={toggleUntilPicker}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.dateButtonText}>{toISODate(validUntilDate)}</Text>
                    <Ionicons
                      name={showUntilPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.meta}
                    />
                  </Pressable>
                  <Animated.View style={untilPickerStyle}>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={validUntilDate}
                        mode="date"
                        display="spinner"
                        minimumDate={validFromDate}
                        onChange={(_, date) => { if (date) setValidUntilDate(date); }}
                        style={styles.datePicker}
                        textColor={colors.text.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
              </>
            )}

            {/* Season Pass: start + end date pickers */}
            {passType === 'season_pass' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <Pressable style={styles.dateButton} onPress={toggleFromPicker}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.dateButtonText}>{toISODate(validFromDate)}</Text>
                    <Ionicons
                      name={showFromPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.meta}
                    />
                  </Pressable>
                  <Animated.View style={fromPickerStyle}>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={validFromDate}
                        mode="date"
                        display="spinner"
                        onChange={(_, date) => { if (date) setValidFromDate(date); }}
                        style={styles.datePicker}
                        textColor={colors.text.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>End Date</Text>
                  <Pressable style={styles.dateButton} onPress={toggleUntilPicker}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.dateButtonText}>{toISODate(validUntilDate)}</Text>
                    <Ionicons
                      name={showUntilPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.meta}
                    />
                  </Pressable>
                  <Animated.View style={untilPickerStyle}>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={validUntilDate}
                        mode="date"
                        display="spinner"
                        minimumDate={validFromDate}
                        onChange={(_, date) => { if (date) setValidUntilDate(date); }}
                        style={styles.datePicker}
                        textColor={colors.text.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
              </>
            )}

            {/* Annual Pass: start date + auto-calculated read-only expiry */}
            {passType === 'annual_pass' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Start Date</Text>
                  <Pressable style={styles.dateButton} onPress={toggleFromPicker}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.dateButtonText}>{toISODate(validFromDate)}</Text>
                    <Ionicons
                      name={showFromPicker ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.text.meta}
                    />
                  </Pressable>
                  <Animated.View style={fromPickerStyle}>
                    <View style={styles.pickerContainer}>
                      <DateTimePicker
                        value={validFromDate}
                        mode="date"
                        display="spinner"
                        onChange={(_, date) => { if (date) setValidFromDate(date); }}
                        style={styles.datePicker}
                        textColor={colors.text.primary}
                      />
                    </View>
                  </Animated.View>
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Expires (auto-calculated)</Text>
                  <View style={[styles.dateButton, styles.dateButtonReadOnly]}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.meta} />
                    <Text style={[styles.dateButtonText, { color: colors.text.meta }]}>
                      {toISODate(annualExpiry)}
                    </Text>
                    <Ionicons name="lock-closed-outline" size={14} color={colors.text.meta} />
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* Passholder Name */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Passholder Name (optional)</Text>
          <TextInput
            style={styles.textInput}
            value={passholder}
            onChangeText={setPassholder}
            onFocus={handleInputFocus}
            placeholder="e.g., Caleb Lanting"
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
            onFocus={handleInputFocus}
            placeholder="Any additional notes..."
            placeholderTextColor={colors.text.meta}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save button */}
        <Pressable
          onPress={handleSubmit}
          onPressIn={() => { submitButtonScale.value = withSpring(0.96, PRESS_SPRING); }}
          onPressOut={() => { submitButtonScale.value = withSpring(1, PRESS_SPRING); }}
        >
          <Animated.View style={[styles.primaryButton, submitButtonStyle]}>
            <Text style={styles.primaryButtonText}>Save Pass</Text>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </Animated.View>
        </Pressable>

        {/* Animated keyboard spacer -- smoothly grows/shrinks with keyboard */}
        <Animated.View style={keyboardPadding} />
        <View style={{ height: insets.bottom + spacing.xxl }} />
      </Animated.ScrollView>
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

            {(step === 'detection' || step === 'form') && (
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>IMPORT PASS</Text>
              </View>
            )}

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>
        )}

        {/* Step content */}
        <View style={styles.content}>
          {renderStep()}
        </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    letterSpacing: 4,
    color: colors.text.primary,
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
  detectionScrollContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.xl,
    gap: spacing.xxl,
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
    padding: spacing.xxl,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formatBadge: {
    marginTop: spacing.base,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  barcodeHriText: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.text.meta,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  detectionCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  detectionRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  detectionRowContent: {
    flex: 1,
  },
  detectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginLeft: spacing.lg + 32 + spacing.base,
    marginRight: spacing.lg,
  },
  detectionLabel: {
    fontSize: 12,
    color: colors.text.meta,
    fontWeight: '500',
    marginBottom: 2,
  },
  detectionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  detectionPlaceholder: {
    color: colors.text.meta,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  missingFieldsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
  },
  missingFieldsSummaryText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // Form step
  miniPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  imageOnlyPreview: {
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imageOnlyImage: {
    width: 200,
    height: 200,
    borderRadius: radius.md,
  },
  imageOnlyLabel: {
    marginTop: spacing.base,
    fontSize: 12,
    color: colors.text.meta,
    fontWeight: '500',
  },
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

  // Date picker
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  dateButtonReadOnly: {
    backgroundColor: colors.background.input,
    borderColor: colors.border.subtle,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  pickerContainer: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  datePicker: {
    height: 200,
  },

  // Park autocomplete
  autocompleteDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    ...shadows.card,
    zIndex: 100,
  },
  autocompleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  autocompleteText: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  autocompleteChain: {
    fontSize: 12,
    color: colors.text.meta,
    fontWeight: '500',
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
