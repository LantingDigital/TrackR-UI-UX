/**
 * AddTicketFlow Component
 *
 * Multi-step wizard for adding new tickets/passes:
 * Step 1: Choose pass type (Annual, Season, Day, Multi-Day)
 * Step 2: Choose method (Camera / Photo Library / Enter Manually)
 * Step 3: CameraScanner (live scan or library pick with barcode extraction)
 * Step 4: Detection result (auto-detected info + barcode preview)
 * Step 5a (manual): Barcode/QR input + type picker
 * Step 5b (manual): Park selection (park name + chain)
 * Step 5c (manual): Pass details (pass type + dates)
 * Step 5d (manual): Review/confirm
 * Step 5 (scanned): Combined form (fill gaps)
 *
 * Supports the hybrid approach:
 * - Extracts barcode data from scanned/imported images
 * - Falls back to IMAGE_ONLY when extraction fails
 * - Always saves original image URI as backup
 *
 * All animations use react-native-reanimated with timing/easing (no spring on transitions).
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '../../services/haptics';
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
import { GlassHeader } from '../GlassHeader';
import { SettingsBottomSheet } from '../settings/SettingsBottomSheet';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

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

const SCREEN_WIDTH = Dimensions.get('window').width;

type FlowStep =
  | 'method'
  | 'type_select'
  | 'scan'
  | 'detection'
  | 'form'
  | 'manual_barcode'
  | 'manual_park'
  | 'manual_details'
  | 'manual_review';

/** Step ordering for determining forward/backward direction */
const STEP_ORDER: Record<FlowStep, number> = {
  type_select: 0,
  method: 1,
  scan: 2,
  detection: 3,
  form: 4,
  manual_barcode: 2,
  manual_park: 3,
  manual_details: 4,
  manual_review: 5,
};

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
  /** Pre-fill park name when adding from a specific park screen */
  initialParkName?: string;
}

export const AddTicketFlow: React.FC<AddTicketFlowProps> = ({
  visible,
  onClose,
  onComplete,
  existingTickets = [],
  initialParkName,
}) => {
  const insets = useSafeAreaInsets();
  const { scrollRef, scrollHandler, handleInputFocus, keyboardPadding } = useKeyboardAvoidance();

  // Flow state — type_select is first step now
  const [step, setStep] = useState<FlowStep>('type_select');
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

  // Track whether user came from manual entry (to show disclaimer banner on form)
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Manual barcode number input
  const [manualBarcodeNumber, setManualBarcodeNumber] = useState('');
  const [manualBarcodeFormat, setManualBarcodeFormat] = useState<'qr' | '1d' | 'auto'>('auto');
  const [barcodeValidationError, setBarcodeValidationError] = useState('');

  // Bottom sheet states for replacing Alert.alert
  const [noBarcodeSheetVisible, setNoBarcodeSheetVisible] = useState(false);
  const [noBarcodeImageUri, setNoBarcodeImageUri] = useState<string>('');
  const [duplicateSheetVisible, setDuplicateSheetVisible] = useState(false);
  const [duplicateParkName, setDuplicateParkName] = useState('');
  const [errorSheetVisible, setErrorSheetVisible] = useState(false);
  const [errorSheetMessage, setErrorSheetMessage] = useState('');
  const [parkValidationError, setParkValidationError] = useState('');

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

  // Two-layer iOS push transition state
  const [displayedStep, setDisplayedStep] = useState<FlowStep>('type_select');
  const [previousStepState, setPreviousStepState] = useState<FlowStep | null>(null);
  const transitionProgress = useSharedValue(0); // 0 = start of transition, 1 = complete
  const isGoingForward = useRef(true);

  // Current (incoming) screen style — slides from right (forward) or from -33% left (back)
  const currentLayerStyle = useAnimatedStyle(() => {
    if (previousStepState === null) return {};
    const forward = isGoingForward.current;
    return {
      transform: [{
        translateX: interpolate(
          transitionProgress.value,
          [0, 1],
          [forward ? SCREEN_WIDTH : -SCREEN_WIDTH * 0.33, 0],
        ),
      }],
      // Subtle left-edge shadow on incoming screen (forward only)
      shadowColor: '#000',
      shadowOffset: { width: -3, height: 0 },
      shadowOpacity: interpolate(transitionProgress.value, [0, 1], [forward ? 0.15 : 0, 0]),
      shadowRadius: 12,
    };
  });

  // Previous (outgoing) screen style — slides to -33% left (forward) or off right (back)
  const previousLayerStyle = useAnimatedStyle(() => {
    if (previousStepState === null) return {};
    const forward = isGoingForward.current;
    return {
      transform: [{
        translateX: interpolate(
          transitionProgress.value,
          [0, 1],
          [0, forward ? -SCREEN_WIDTH * 0.33 : SCREEN_WIDTH],
        ),
      }],
      opacity: interpolate(
        transitionProgress.value,
        [0, 1],
        [1, forward ? 0.85 : 1],
      ),
    };
  });

  /** Navigate to a step with true iOS native-stack push animation */
  const navigateToStep = useCallback((targetStep: FlowStep, forward?: boolean) => {
    const autoForward = forward !== undefined ? forward : STEP_ORDER[targetStep] > STEP_ORDER[displayedStep];
    isGoingForward.current = autoForward;
    setPreviousStepState(displayedStep);
    setDisplayedStep(targetStep);
    transitionProgress.value = 0;
    transitionProgress.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.cubic),
    }, () => {
      runOnJS(setPreviousStepState)(null);
    });
  }, [displayedStep]);

  // Reset flow when closed, pre-fill park name when opened
  React.useEffect(() => {
    if (!visible) {
      setStep('type_select');
      setDisplayedStep('type_select');
      setPreviousStepState(null);
      transitionProgress.value = 0;
      isGoingForward.current = true;
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
      setIsManualEntry(false);
      setManualBarcodeNumber('');
      setManualBarcodeFormat('auto');
      setBarcodeValidationError('');
      setParkValidationError('');
      setNoBarcodeSheetVisible(false);
      setDuplicateSheetVisible(false);
      setErrorSheetVisible(false);
      setSelectedType(null);
      selectedTypeIndex.value = -1;
      continueButtonAnim.value = 0;
      fromPickerHeight.value = 0;
      untilPickerHeight.value = 0;
    } else if (initialParkName) {
      setParkName(initialParkName);
      setParkQuery(initialParkName);
      const chain = PARK_TO_CHAIN[initialParkName];
      if (chain) setParkChain(chain);
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

    // Jump directly (no slide) since camera is fullscreen
    setDisplayedStep('detection');
    setStep('detection');
    setPreviousStepState(null);
    transitionProgress.value = 0;
  }, []);

  // Handle image-only fallback (no barcode found in image)
  const handleImageOnlyFallback = useCallback((imageUri: string) => {
    setQrData('');
    setQrFormat('IMAGE_ONLY');
    setOriginalImageUri(imageUri);
    setDetectionResult(null);

    // Go to form since type is already selected — jump directly
    setDisplayedStep('form');
    setStep('form');
    setPreviousStepState(null);
    transitionProgress.value = 0;
  }, []);

  // Handle photo library import directly from method step
  const handlePickFromLibrary = useCallback(async () => {
    haptics.tap();

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
          haptics.success();

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
            haptics.success();
            handleScan(jsResult.data, jsResult.format);
            decoded = true;
          }
        } catch (jsError) {
          console.warn('JS barcode decoder failed:', jsError);
        }
      }

      // Step 3: If both failed, offer raw image fallback via bottom sheet
      if (!decoded) {
        haptics.warning();
        setNoBarcodeImageUri(imageUri);
        setNoBarcodeSheetVisible(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrorSheetMessage('Failed to pick image from library. Please try again.');
      setErrorSheetVisible(true);
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

    haptics.success();

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
      setParkValidationError('Please enter a park name');
      haptics.error();
      return;
    }

    // Validate barcode number for manual entry
    if (isManualEntry && !manualBarcodeNumber.trim()) {
      setBarcodeValidationError('Barcode number is required');
      haptics.error();
      return;
    }

    // Check for duplicate barcode/QR data
    if (qrData && qrFormat !== 'IMAGE_ONLY') {
      const duplicate = existingTickets.find(t => t.qrData === qrData);
      if (duplicate) {
        setDuplicateParkName(duplicate.parkName);
        setDuplicateSheetVisible(true);
        return;
      }
    }

    proceedWithSave();
  }, [parkName, qrData, qrFormat, existingTickets, proceedWithSave, isManualEntry, manualBarcodeNumber]);

  // Go back to previous step
  const goBack = useCallback(() => {
    haptics.tap();
    const currentStep = displayedStep;
    switch (currentStep) {
      case 'method':
        navigateToStep('type_select', false);
        setStep('type_select');
        break;
      case 'type_select':
        onClose();
        break;
      case 'scan':
        navigateToStep('method', false);
        setStep('method');
        break;
      case 'detection':
        navigateToStep('method', false);
        setStep('method');
        break;
      case 'form':
        if (isManualEntry) {
          navigateToStep('method', false);
          setStep('method');
        } else {
          navigateToStep('detection', false);
          setStep('detection');
        }
        break;
      // Multi-step manual entry back navigation
      case 'manual_barcode':
        navigateToStep('method', false);
        setStep('method');
        break;
      case 'manual_park':
        navigateToStep('manual_barcode', false);
        setStep('manual_barcode');
        break;
      case 'manual_details':
        navigateToStep('manual_park', false);
        setStep('manual_park');
        break;
      case 'manual_review':
        navigateToStep('manual_details', false);
        setStep('manual_details');
        break;
    }
  }, [displayedStep, isManualEntry, onClose, navigateToStep]);

  // Render step content — accepts a step arg so both layers can render different steps
  const renderStepContent = (targetStep: FlowStep) => {
    switch (targetStep) {
      case 'method':
        return renderMethodStep();
      case 'type_select':
        return renderTypeSelectStep();
      case 'scan':
        return renderScanStep();
      case 'detection':
        return renderDetectionStep();
      case 'form':
        return renderFormStep();
      case 'manual_barcode':
        return renderManualBarcodeStep();
      case 'manual_park':
        return renderManualParkStep();
      case 'manual_details':
        return renderManualDetailsStep();
      case 'manual_review':
        return renderManualReviewStep();
    }
  };

  // =============================================
  // Step 1: Choose method
  // =============================================
  const renderMethodStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepSubtitle}>
        Choose how you want to import your pass
      </Text>

      {/* Two main cards side by side */}
      <View style={styles.methodPrimaryRow}>
        {/* Camera scan option */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            haptics.tap();
            setDisplayedStep('scan');
            setStep('scan');
            setPreviousStepState(null);
            transitionProgress.value = 0;
          }}
          onPressIn={() => { cameraCardScale.value = withSpring(0.97, PRESS_SPRING); }}
          onPressOut={() => { cameraCardScale.value = withSpring(1, PRESS_SPRING); }}
        >
          <Animated.View style={[styles.methodPrimaryCard, cameraCardStyle]}>
            <View style={styles.methodPrimaryIcon}>
              <Ionicons name="camera" size={36} color={colors.accent.primary} />
            </View>
            <Text style={styles.methodPrimaryTitle}>Scan with Camera</Text>
            <Text style={styles.methodPrimaryDesc}>
              Point at your barcode or QR code
            </Text>
          </Animated.View>
        </Pressable>

        {/* Photo library option */}
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            handlePickFromLibrary();
          }}
          onPressIn={() => { libraryCardScale.value = withSpring(0.97, PRESS_SPRING); }}
          onPressOut={() => { libraryCardScale.value = withSpring(1, PRESS_SPRING); }}
        >
          <Animated.View style={[styles.methodPrimaryCard, libraryCardStyle]}>
            <View style={styles.methodPrimaryIcon}>
              <Ionicons name="images" size={36} color={colors.accent.primary} />
            </View>
            <Text style={styles.methodPrimaryTitle}>Upload from Photos</Text>
            <Text style={styles.methodPrimaryDesc}>
              Pick a screenshot or photo of your pass
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Tertiary manual entry — de-emphasized text button */}
      <Pressable
        style={styles.methodManualButton}
        onPress={() => {
          haptics.tap();
          setQrData('');
          setQrFormat('IMAGE_ONLY');
          setOriginalImageUri(undefined);
          setDetectionResult(null);
          setIsManualEntry(true);
          navigateToStep('manual_barcode', true);
          setStep('manual_barcode');
        }}
      >
        <Ionicons name="create-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.methodManualText}>Enter manually instead</Text>
      </Pressable>
    </View>
  );

  // =============================================
  // Step 1: Pass type selection (vertical card list)
  // =============================================
  const TYPE_SELECT_OPTIONS: { type: PassType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { type: 'annual_pass', label: 'Annual Pass', icon: 'calendar', description: 'Calendar year (Jan-Dec) or 365 days from purchase' },
    { type: 'season_pass', label: 'Season Pass', icon: 'sunny', description: 'Specific operating season with set start/end dates' },
    { type: 'day_pass', label: 'Day Pass', icon: 'ticket', description: 'Single day or multi-day admission ticket' },
    { type: 'express', label: 'Express / VIP', icon: 'flash', description: 'Skip-the-line, FastPass, or premium add-on' },
  ];

  // Track which card is selected (user must tap Continue to advance)
  const [selectedType, setSelectedType] = useState<PassType | null>(null);

  // Shared value tracking selected type index for useAnimatedReaction (-1 = none)
  const selectedTypeIndex = useSharedValue(-1);

  // Continue button animation — always visible, transitions between disabled/active
  const continueButtonAnim = useSharedValue(0); // 0 = disabled, 1 = active
  const continueScale = useSharedValue(1);

  const continueButtonAnimStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      continueButtonAnim.value,
      [0, 1],
      [colors.border.subtle, colors.accent.primary],
    );
    return {
      backgroundColor: bgColor,
      transform: [{ scale: continueScale.value }],
    };
  });

  const continueTextAnimStyle = useAnimatedStyle(() => {
    const textColor = interpolateColor(
      continueButtonAnim.value,
      [0, 1],
      [colors.text.meta, '#FFFFFF'],
    );
    return { color: textColor };
  });

  const continueIconAnimStyle = useAnimatedStyle(() => {
    const iconColor = interpolateColor(
      continueButtonAnim.value,
      [0, 1],
      [colors.text.meta, '#FFFFFF'],
    );
    return { color: iconColor };
  });

  /** Animated type card sub-component — uses useAnimatedReaction watching selectedTypeIndex */
  const TypeSelectCard = React.memo(({ option, index, onSelect }: {
    option: typeof TYPE_SELECT_OPTIONS[number];
    index: number;
    onSelect: () => void;
  }) => {
    const selectionAnim = useSharedValue(0);
    const pressScale = useSharedValue(1);

    // Drive color animation from the shared selectedTypeIndex value
    useAnimatedReaction(
      () => selectedTypeIndex.value,
      (currentIndex) => {
        const isNowSelected = currentIndex === index;
        selectionAnim.value = withTiming(isNowSelected ? 1 : 0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      },
      [index],
    );

    const cardAnimStyle = useAnimatedStyle(() => {
      const bgColor = interpolateColor(
        selectionAnim.value,
        [0, 1],
        [colors.background.card, colors.interactive.pressedAccent],
      );
      const borderColor = interpolateColor(
        selectionAnim.value,
        [0, 1],
        ['transparent', colors.accent.primary],
      );
      return {
        backgroundColor: bgColor,
        borderColor: borderColor,
        transform: [{ scale: pressScale.value }],
      };
    });

    const iconBgStyle = useAnimatedStyle(() => {
      const bgColor = interpolateColor(
        selectionAnim.value,
        [0, 1],
        [colors.accent.primaryLight, colors.accent.primary],
      );
      return { backgroundColor: bgColor };
    });

    const iconColorStyle = useAnimatedStyle(() => {
      const c = interpolateColor(
        selectionAnim.value,
        [0, 1],
        [colors.accent.primary, colors.text.inverse],
      );
      return { color: c };
    });

    const labelColorStyle = useAnimatedStyle(() => {
      const c = interpolateColor(
        selectionAnim.value,
        [0, 1],
        [colors.text.primary, colors.accent.primary],
      );
      return { color: c };
    });

    return (
      <Pressable
        onPress={onSelect}
        onPressIn={() => { pressScale.value = withSpring(0.97, PRESS_SPRING); }}
        onPressOut={() => { pressScale.value = withSpring(1, PRESS_SPRING); }}
      >
        <Animated.View style={[styles.typeSelectTallCard, cardAnimStyle]}>
          <Animated.View style={[styles.typeSelectTallIcon, iconBgStyle]}>
            <AnimatedIonicons name={option.icon} size={28} style={iconColorStyle} />
          </Animated.View>
          <Animated.Text style={[styles.typeSelectTallLabel, labelColorStyle]}>
            {option.label}
          </Animated.Text>
          <Text style={styles.typeSelectTallDesc}>{option.description}</Text>
        </Animated.View>
      </Pressable>
    );
  });

  const renderTypeSelectStep = () => (
    <View style={styles.typeSelectStepContainer}>
      <Text style={styles.typeSelectQuestion}>
        What type of pass?
      </Text>

      <View style={styles.typeSelectTallList}>
        {TYPE_SELECT_OPTIONS.map((option, index) => (
          <TypeSelectCard
            key={option.type}
            option={option}
            index={index}
            onSelect={() => {
              haptics.tap();
              setSelectedType(option.type);
              setPassType(option.type);
              selectedTypeIndex.value = index;
              continueButtonAnim.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
            }}
          />
        ))}
      </View>

      {/* Continue button — ALWAYS visible, disabled/gray when no selection */}
      <View style={styles.typeSelectContinueWrapper}>
        <Pressable
          onPress={() => {
            if (!selectedType) return;
            haptics.select();
            navigateToStep('method', true);
            setStep('method');
          }}
          onPressIn={() => {
            if (selectedType) continueScale.value = withSpring(0.96, PRESS_SPRING);
          }}
          onPressOut={() => {
            if (selectedType) continueScale.value = withSpring(1, PRESS_SPRING);
          }}
          disabled={!selectedType}
        >
          <Animated.View style={[styles.typeSelectContinueButton, continueButtonAnimStyle]}>
            <Animated.Text style={[styles.typeSelectContinueText, continueTextAnimStyle]}>Continue</Animated.Text>
            <AnimatedIonicons name="arrow-forward" size={20} style={continueIconAnimStyle} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
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
            haptics.tap();
            navigateToStep('form', true);
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
    haptics.tap();
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
    haptics.tap();
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
    haptics.tick();
    setParkName(name);
    setParkQuery(name);
    setShowParkSuggestions(false);
    const chain = PARK_TO_CHAIN[name];
    if (chain) {
      setParkChain(chain);
    }
  }, []);

  // =============================================
  // Manual Entry Step 1: Barcode/QR Input + Type Picker
  // =============================================
  const renderManualBarcodeStep = () => (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={styles.stepContainer}
      contentContainerStyle={styles.manualStepContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.manualStepHeader}>
        <Text style={styles.manualStepTitle}>Barcode Information</Text>
        <Text style={styles.manualStepSubtitle}>
          Enter the number from your pass barcode
        </Text>
      </View>

      {/* Barcode Number */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Barcode / Pass Number</Text>
        <TextInput
          style={[
            styles.manualTextInput,
            barcodeValidationError ? styles.textInputError : undefined,
          ]}
          value={manualBarcodeNumber}
          onChangeText={(text) => {
            setManualBarcodeNumber(text);
            setQrData(text);
            if (barcodeValidationError && text.trim()) {
              setBarcodeValidationError('');
            }
            if (text.trim()) {
              if (manualBarcodeFormat === 'qr') {
                setQrFormat('QR_CODE');
              } else if (manualBarcodeFormat === '1d') {
                setQrFormat('CODE_128');
              } else {
                setQrFormat('CODE_128');
              }
            } else {
              setQrFormat('IMAGE_ONLY');
            }
          }}
          onFocus={handleInputFocus}
          placeholder="Enter barcode or pass number"
          placeholderTextColor={colors.text.meta}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {barcodeValidationError ? (
          <Text style={styles.validationError}>{barcodeValidationError}</Text>
        ) : null}
      </View>

      {/* Barcode Type — large card selector instead of tiny pills */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Barcode Type</Text>
        <View style={styles.manualSelectorList}>
          {([
            { key: 'auto' as const, label: 'Auto-detect', icon: 'scan-outline' as const, desc: 'We\'ll figure it out' },
            { key: 'qr' as const, label: 'QR Code', icon: 'qr-code-outline' as const, desc: '2D square pattern' },
            { key: '1d' as const, label: 'Barcode (1D)', icon: 'barcode-outline' as const, desc: 'Standard line barcode' },
          ]).map((fmt) => {
            const isSel = manualBarcodeFormat === fmt.key;
            return (
              <Pressable
                key={fmt.key}
                onPress={() => {
                  haptics.tick();
                  setManualBarcodeFormat(fmt.key);
                  if (manualBarcodeNumber.trim()) {
                    if (fmt.key === 'qr') setQrFormat('QR_CODE');
                    else if (fmt.key === '1d') setQrFormat('CODE_128');
                    else setQrFormat('CODE_128');
                  }
                }}
              >
                <View style={[
                  styles.manualSelectorCard,
                  isSel && styles.manualSelectorCardSelected,
                ]}>
                  <View style={[
                    styles.manualSelectorIconWrap,
                    isSel && styles.manualSelectorIconWrapSelected,
                  ]}>
                    <Ionicons
                      name={fmt.icon}
                      size={24}
                      color={isSel ? colors.text.inverse : colors.accent.primary}
                    />
                  </View>
                  <View style={styles.manualSelectorTextWrap}>
                    <Text style={[
                      styles.manualSelectorLabel,
                      isSel && styles.manualSelectorLabelSelected,
                    ]}>
                      {fmt.label}
                    </Text>
                    <Text style={styles.manualSelectorDesc}>{fmt.desc}</Text>
                  </View>
                  {isSel && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent.primary} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.disclaimerBanner}>
        <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
        <Text style={styles.disclaimerBannerText}>
          Please double-check that the number matches your pass barcode exactly.
        </Text>
      </View>

      {/* Continue button — validates barcode before proceeding */}
      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          if (!manualBarcodeNumber.trim()) {
            setBarcodeValidationError('Please enter a barcode or pass number');
            haptics.error();
            return;
          }
          haptics.select();
          navigateToStep('manual_park', true);
          setStep('manual_park');
        }}
      >
        <Text style={styles.primaryButtonText}>Next: Choose Park</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>

      <Animated.View style={keyboardPadding} />
      <View style={{ height: insets.bottom + spacing.xxl }} />
    </Animated.ScrollView>
  );

  // =============================================
  // Manual Entry Step 2: Park Selection
  // =============================================
  const renderManualParkStep = () => (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={styles.stepContainer}
      contentContainerStyle={styles.manualStepContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.manualStepHeader}>
        <Text style={styles.manualStepTitle}>Select Your Park</Text>
        <Text style={styles.manualStepSubtitle}>
          Search for your park and select the chain
        </Text>
      </View>

      {/* Park Name with Autocomplete */}
      <View style={[styles.formGroup, { zIndex: 10 }]}>
        <Text style={styles.formLabel}>Park Name</Text>
        <TextInput
          style={styles.manualTextInput}
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

      {/* Park Chain — full-width cards instead of tiny pills */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Park Chain</Text>
        <View style={styles.manualSelectorList}>
          {(Object.keys(PARK_CHAIN_LABELS) as ParkChain[]).map((chain) => {
            const isSel = parkChain === chain;
            const brandColor = PARK_BRAND_COLORS[chain];
            return (
              <Pressable
                key={chain}
                onPress={() => {
                  haptics.tick();
                  setParkChain(chain);
                }}
              >
                <View style={[
                  styles.manualSelectorCard,
                  isSel && styles.manualSelectorCardSelected,
                  isSel && { borderColor: brandColor },
                ]}>
                  <View style={[
                    styles.manualSelectorChainDot,
                    { backgroundColor: brandColor },
                  ]} />
                  <View style={styles.manualSelectorTextWrap}>
                    <Text style={[
                      styles.manualSelectorLabel,
                      isSel && { color: brandColor },
                    ]}>
                      {PARK_CHAIN_LABELS[chain]}
                    </Text>
                  </View>
                  {isSel && (
                    <Ionicons name="checkmark-circle" size={22} color={brandColor} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Continue button */}
      <Pressable
        style={[styles.primaryButton, !parkName.trim() && styles.primaryButtonDisabled]}
        onPress={() => {
          if (!parkName.trim()) return;
          haptics.select();
          navigateToStep('manual_details', true);
          setStep('manual_details');
        }}
        disabled={!parkName.trim()}
      >
        <Text style={styles.primaryButtonText}>Next: Pass Details</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>

      <Animated.View style={keyboardPadding} />
      <View style={{ height: insets.bottom + spacing.xxl }} />
    </Animated.ScrollView>
  );

  // =============================================
  // Manual Entry Step 3: Pass Details (type + dates)
  // =============================================
  const renderManualDetailsStep = () => (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      style={styles.stepContainer}
      contentContainerStyle={styles.manualStepContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.manualStepHeader}>
        <Text style={styles.manualStepTitle}>Pass Details</Text>
        <Text style={styles.manualStepSubtitle}>
          Select the pass type and date information
        </Text>
      </View>

      {/* Pass Type — large card selector */}
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Pass Type</Text>
        <View style={styles.manualSelectorList}>
          {(Object.keys(PASS_TYPE_LABELS) as PassType[]).map((type) => {
            const isSel = passType === type;
            const iconMap: Record<PassType, keyof typeof Ionicons.glyphMap> = {
              day_pass: 'ticket-outline',
              multi_day: 'layers-outline',
              annual_pass: 'calendar-outline',
              season_pass: 'sunny-outline',
              vip: 'star-outline',
              parking: 'car-outline',
              express: 'flash-outline',
              unknown: 'help-circle-outline',
            };
            return (
              <Pressable
                key={type}
                onPress={() => {
                  haptics.tick();
                  setPassType(type);
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
                <View style={[
                  styles.manualSelectorCard,
                  isSel && styles.manualSelectorCardSelected,
                ]}>
                  <View style={[
                    styles.manualSelectorIconWrap,
                    isSel && styles.manualSelectorIconWrapSelected,
                  ]}>
                    <Ionicons
                      name={iconMap[type]}
                      size={22}
                      color={isSel ? colors.text.inverse : colors.accent.primary}
                    />
                  </View>
                  <View style={styles.manualSelectorTextWrap}>
                    <Text style={[
                      styles.manualSelectorLabel,
                      isSel && styles.manualSelectorLabelSelected,
                    ]}>
                      {PASS_TYPE_LABELS[type]}
                    </Text>
                  </View>
                  {isSel && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent.primary} />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
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
          style={styles.manualTextInput}
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
          style={[styles.manualTextInput, styles.textInputMultiline]}
          value={notes}
          onChangeText={setNotes}
          onFocus={handleInputFocus}
          placeholder="Any additional notes..."
          placeholderTextColor={colors.text.meta}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Continue button */}
      <Pressable
        style={styles.primaryButton}
        onPress={() => {
          haptics.select();
          navigateToStep('manual_review', true);
          setStep('manual_review');
        }}
      >
        <Text style={styles.primaryButtonText}>Next: Review</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </Pressable>

      <Animated.View style={keyboardPadding} />
      <View style={{ height: insets.bottom + spacing.xxl }} />
    </Animated.ScrollView>
  );

  // =============================================
  // Manual Entry Step 4: Review & Confirm
  // =============================================
  const renderManualReviewStep = () => {
    const brandColor = PARK_BRAND_COLORS[parkChain];
    return (
      <ScrollView
        style={styles.stepContainer}
        contentContainerStyle={styles.manualStepContent}
      >
        <View style={styles.manualStepHeader}>
          <Text style={styles.manualStepTitle}>Review Your Pass</Text>
          <Text style={styles.manualStepSubtitle}>
            Make sure everything looks right before saving
          </Text>
        </View>

        {/* Review card */}
        <View style={styles.reviewCard}>
          {/* Park info header */}
          <View style={[styles.reviewHeader, { backgroundColor: brandColor }]}>
            <Text style={styles.reviewHeaderPark}>{parkName.trim() || 'No park name'}</Text>
            <Text style={styles.reviewHeaderChain}>{PARK_CHAIN_LABELS[parkChain]}</Text>
          </View>

          {/* Details rows */}
          <View style={styles.reviewRow}>
            <Ionicons name="card-outline" size={18} color={colors.text.secondary} />
            <Text style={styles.reviewRowLabel}>Pass Type</Text>
            <Text style={styles.reviewRowValue}>{PASS_TYPE_LABELS[passType]}</Text>
          </View>

          <View style={styles.reviewDivider} />

          {manualBarcodeNumber.trim() ? (
            <>
              <View style={styles.reviewRow}>
                <Ionicons name="barcode-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.reviewRowLabel}>Barcode</Text>
                <Text style={styles.reviewRowValue} numberOfLines={1}>{manualBarcodeNumber}</Text>
              </View>
              <View style={styles.reviewDivider} />
            </>
          ) : null}

          {needsDateFields && (
            <>
              <View style={styles.reviewRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.reviewRowLabel}>
                  {passType === 'day_pass' ? 'Date' : 'From'}
                </Text>
                <Text style={styles.reviewRowValue}>{toISODate(validFromDate)}</Text>
              </View>
              <View style={styles.reviewDivider} />

              {passType !== 'day_pass' && (
                <>
                  <View style={styles.reviewRow}>
                    <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
                    <Text style={styles.reviewRowLabel}>Until</Text>
                    <Text style={styles.reviewRowValue}>
                      {passType === 'annual_pass' ? toISODate(annualExpiry) : toISODate(validUntilDate)}
                    </Text>
                  </View>
                  <View style={styles.reviewDivider} />
                </>
              )}
            </>
          )}

          {passholder.trim() ? (
            <>
              <View style={styles.reviewRow}>
                <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.reviewRowLabel}>Passholder</Text>
                <Text style={styles.reviewRowValue}>{passholder.trim()}</Text>
              </View>
              <View style={styles.reviewDivider} />
            </>
          ) : null}

          {notes.trim() ? (
            <View style={styles.reviewRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.reviewRowLabel}>Notes</Text>
              <Text style={styles.reviewRowValue} numberOfLines={2}>{notes.trim()}</Text>
            </View>
          ) : null}
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

        <View style={{ height: insets.bottom + spacing.xxl }} />
      </ScrollView>
    );
  };

  // =============================================
  // Scanned entry form (existing — for non-manual flow)
  // =============================================
  const renderFormStep = () => (
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.stepContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.stepSubtitle}>
          Confirm or edit the pass information
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
                  haptics.tick();
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
                  haptics.tick();
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
      <View style={styles.container}>
        {/* GlassHeader fog overlay (hidden during scan step) */}
        {displayedStep !== 'scan' && (
          <GlassHeader headerHeight={insets.top + 56} />
        )}

        {/* Header (hidden during scan step) — absolute, above fog */}
        {displayedStep !== 'scan' && (
          <View style={[styles.header, { top: insets.top, zIndex: 10 }]}>
            {displayedStep !== 'type_select' ? (
              <Pressable style={styles.backButton} onPress={goBack}>
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}

            {(displayedStep === 'type_select' || displayedStep === 'method' || displayedStep === 'detection' || displayedStep === 'form'
              || displayedStep === 'manual_barcode' || displayedStep === 'manual_park' || displayedStep === 'manual_details' || displayedStep === 'manual_review') && (
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>IMPORT PASS</Text>
              </View>
            )}

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>
        )}

        {/* Step content — two-layer iOS push transition */}
        <View style={[styles.content, displayedStep !== 'scan' ? { marginTop: insets.top + 56 } : { marginTop: 0 }]}>
          {displayedStep === 'scan' ? (
            // Scan step is full-screen camera, no slide wrapper
            renderStepContent('scan')
          ) : (
            <View style={styles.transitionContainer}>
              {/* Previous (outgoing) layer */}
              {previousStepState && previousStepState !== 'scan' && (
                <Animated.View style={[StyleSheet.absoluteFill, previousLayerStyle, styles.transitionLayer]}>
                  {renderStepContent(previousStepState)}
                </Animated.View>
              )}
              {/* Current (incoming) layer */}
              <Animated.View style={[StyleSheet.absoluteFill, currentLayerStyle, styles.transitionLayer]}>
                {renderStepContent(displayedStep)}
              </Animated.View>
            </View>
          )}
        </View>
      </View>

      {/* No Barcode Found — bottom sheet */}
      <SettingsBottomSheet
        visible={noBarcodeSheetVisible}
        onClose={() => setNoBarcodeSheetVisible(false)}
        title="No Barcode Found"
        warning
        warningMessage="We could not detect a barcode in this image. Would you like to save it as an image-only pass?"
        warningIcon="scan-outline"
        confirmLabel="Use Original Image"
        cancelLabel="Cancel"
        onConfirm={() => {
          setNoBarcodeSheetVisible(false);
          if (noBarcodeImageUri) handleImageOnlyFallback(noBarcodeImageUri);
        }}
      />

      {/* Duplicate Pass — bottom sheet */}
      <SettingsBottomSheet
        visible={duplicateSheetVisible}
        onClose={() => setDuplicateSheetVisible(false)}
        title="Duplicate Pass"
        warning
        warningMessage={`This barcode matches an existing pass for ${duplicateParkName}. Import anyway?`}
        warningIcon="copy-outline"
        confirmLabel="Import Anyway"
        cancelLabel="Cancel"
        onConfirm={() => {
          setDuplicateSheetVisible(false);
          proceedWithSave();
        }}
      />

      {/* Error — bottom sheet */}
      <SettingsBottomSheet
        visible={errorSheetVisible}
        onClose={() => setErrorSheetVisible(false)}
        title="Error"
        warning
        warningMessage={errorSheetMessage}
        warningIcon="alert-circle-outline"
        confirmLabel="OK"
        onConfirm={() => setErrorSheetVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    overflow: 'hidden',
  },
  transitionContainer: {
    flex: 1,
  },
  transitionLayer: {
    flex: 1,
    backgroundColor: colors.background.page,
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
  stepSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },

  // Method step — two primary cards side by side + tertiary manual button
  methodPrimaryRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  methodPrimaryCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
  },
  methodPrimaryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  methodPrimaryTitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold as any,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  methodPrimaryDesc: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.caption * 1.4,
  },
  methodManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: spacing.base,
  },
  methodManualText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium as any,
    color: colors.text.secondary,
  },
  // Disclaimer banner (persistent on manual entry form)
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colors.background.input,
    borderRadius: radius.md,
  },
  disclaimerBannerText: {
    flex: 1,
    fontSize: typography.sizes.small,
    color: colors.text.secondary,
    lineHeight: 16,
  },

  // Type selection step -- vertical tall cards centered
  typeSelectStepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  typeSelectQuestion: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  typeSelectTallList: {
    gap: spacing.base,
  },
  typeSelectTallCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    minHeight: 100,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  typeSelectTallIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  typeSelectTallLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
    marginBottom: 2,
  },
  typeSelectTallLabelSelected: {
    color: colors.accent.primary,
  },
  typeSelectTallDesc: {
    fontSize: typography.sizes.small,
    color: colors.text.secondary,
  },
  typeSelectContinueWrapper: {
    marginTop: spacing.xl,
  },
  typeSelectContinueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.actionPill,
    backgroundColor: colors.border.subtle,
  },
  typeSelectContinueText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.meta,
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
  textInputError: {
    borderColor: colors.status.error,
  },
  textInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  validationError: {
    fontSize: 13,
    color: colors.status.error,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  barcodeFormatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  barcodeFormatPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.actionPill,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  barcodeFormatPillSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  barcodeFormatPillText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  barcodeFormatPillTextSelected: {
    color: '#FFFFFF',
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
  primaryButtonDisabled: {
    backgroundColor: colors.border.subtle,
  },

  // =============================================
  // Manual multi-step styles
  // =============================================
  manualStepContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  manualStepHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  manualStepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  manualStepNumberText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
  },
  manualStepTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  manualStepSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  manualTextInput: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.sizes.input,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },

  // Large selector cards for manual steps
  manualSelectorList: {
    gap: spacing.md,
  },
  manualSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 56,
  },
  manualSelectorCardSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.interactive.pressedAccent,
  },
  manualSelectorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  manualSelectorIconWrapSelected: {
    backgroundColor: colors.accent.primary,
  },
  manualSelectorChainDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.base,
  },
  manualSelectorTextWrap: {
    flex: 1,
  },
  manualSelectorLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold as any,
    color: colors.text.primary,
  },
  manualSelectorLabelSelected: {
    color: colors.accent.primary,
  },
  manualSelectorDesc: {
    fontSize: typography.sizes.small,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Review step
  reviewCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reviewHeader: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  reviewHeaderPark: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  reviewHeaderChain: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  reviewRowLabel: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
    width: 80,
  },
  reviewRowValue: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
    textAlign: 'right',
  },
  reviewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.xl,
  },
});
