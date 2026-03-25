/**
 * ImportRideDataScreen — Multi-step ride data import flow
 *
 * Steps:
 * 1. File Upload — pick a file, send to CF for parsing
 * 2. Field Mapping Review — confirm/adjust AI-detected column mappings
 * 3. Coaster Matching — fuzzy match imported names to TrackR database
 * 4. Preview — review rides, flag duplicates, select which to import
 * 5. Import Progress — batch write to Firestore with progress bar
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  FadeOut,
  Layout,
  Easing,
} from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { radius } from '../../theme/radius';
import { shadows } from '../../theme/shadows';
import { SPRINGS, TIMING } from '../../constants/animations';
import { useSpringPress } from '../../hooks/useSpringPress';
import { haptics } from '../../services/haptics';
import { GlassHeader } from '../../components/GlassHeader';
import { useConfirmModal } from '../../contexts/ConfirmModalContext';
import { getAuthUser } from '../../stores/authStore';
import {
  callProcessImportFile,
  callMatchCoasterNames,
} from '../../services/firebase/functions';
import type { CoasterMatchResult } from '../../services/firebase/functions';
import { useImportStore } from '../../stores/importStore';
import {
  resolveImportRides,
  detectDuplicates,
  writeImportBatch,
} from '../../services/firebase/importService';
import { COASTER_INDEX } from '../../data/coasterIndex';
import { getAllLogs } from '../../stores/rideLogStore';

const HEADER_HEIGHT = 52;

// ============================================
// Main Screen
// ============================================

export const ImportRideDataScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const store = useImportStore();
  const { alert: showAlert } = useConfirmModal();

  const topBarHeight = insets.top + HEADER_HEIGHT;

  const handleBack = useCallback(() => {
    if (store.step === 'upload') {
      navigation.goBack();
    } else if (store.step === 'complete') {
      store.reset();
      navigation.goBack();
    } else {
      // Go back one step
      const steps = ['upload', 'field-mapping', 'coaster-matching', 'preview', 'importing'] as const;
      const idx = steps.indexOf(store.step as typeof steps[number]);
      if (idx > 0) {
        store.setStep(steps[idx - 1]);
      }
    }
  }, [store.step, navigation]);

  const stepTitle = useMemo(() => {
    switch (store.step) {
      case 'upload': return 'Import Ride Data';
      case 'field-mapping': return 'Confirm Mapping';
      case 'coaster-matching': return 'Match Coasters';
      case 'preview': return 'Preview Import';
      case 'importing': return 'Importing...';
      case 'complete': return 'Import Complete';
    }
  }, [store.step]);

  return (
    <View style={[styles.container, { paddingTop: topBarHeight }]}>
      {/* Header */}
      <View style={[styles.header, { top: insets.top, height: HEADER_HEIGHT }]}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <Ionicons
            name={store.step === 'complete' ? 'close' : 'chevron-back'}
            size={24}
            color={colors.text.primary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>{stepTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <GlassHeader headerHeight={topBarHeight} />

      {/* Step Content */}
      {store.step === 'upload' && <UploadStep />}
      {store.step === 'field-mapping' && <FieldMappingStep />}
      {store.step === 'coaster-matching' && <CoasterMatchingStep />}
      {store.step === 'preview' && <PreviewStep />}
      {store.step === 'importing' && <ImportingStep />}
      {store.step === 'complete' && <CompleteStep />}
    </View>
  );
};

// ============================================
// Step 1: File Upload
// ============================================

const UploadStep: React.FC = () => {
  const store = useImportStore();
  const { pressHandlers: uploadPress, animatedStyle: uploadAnim } = useSpringPress();

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/tab-separated-values',
          'application/json',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          '*/*', // Fallback for any file
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      const ext = file.name.split('.').pop() ?? '';
      store.setFile(file.name, ext);

      // Read file as base64
      store.setLoading(true, 'Analyzing your ride data...');
      haptics.tap();

      const fileObj = new File(file.uri);
      const base64 = await fileObj.base64();

      // Send to Cloud Function
      const parseResult = await callProcessImportFile({
        fileBase64: base64,
        fileExtension: ext,
        fileName: file.name,
      });

      store.setParseResult(parseResult);
      haptics.success();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to process file';
      store.setError(msg);
      haptics.error();
    }
  }, []);

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        style={styles.uploadSection}
      >
        <View style={styles.uploadIconContainer}>
          <Ionicons
            name="cloud-upload-outline"
            size={48}
            color={colors.accent.primary}
          />
        </View>
        <Text style={styles.uploadTitle}>
          Import from another app
        </Text>
        <Text style={styles.uploadDescription}>
          Upload a CSV, Excel, JSON, or TSV file with your ride history.
          We'll match your rides to our coaster database.
        </Text>

        <Pressable
          {...uploadPress}
          onPress={handlePickFile}
          disabled={store.isLoading}
        >
          <Animated.View style={[styles.uploadButton, uploadAnim]}>
            {store.isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <>
                <Ionicons
                  name="document-outline"
                  size={20}
                  color={colors.text.inverse}
                />
                <Text style={styles.uploadButtonText}>Choose File</Text>
              </>
            )}
          </Animated.View>
        </Pressable>

        {store.isLoading && (
          <Text style={styles.loadingMessage}>{store.loadingMessage}</Text>
        )}

        {store.error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.status.error} />
            <Text style={styles.errorText}>{store.error}</Text>
          </View>
        )}

        {store.fileName && !store.isLoading && (
          <View style={styles.fileInfo}>
            <Ionicons name="document-text" size={16} color={colors.text.secondary} />
            <Text style={styles.fileInfoText}>{store.fileName}</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.supportedFormats}>
        <Text style={styles.supportedTitle}>Supported Formats</Text>
        {['CSV (.csv)', 'Excel (.xlsx, .xls)', 'JSON (.json)', 'TSV (.tsv)'].map((format) => (
          <View key={format} style={styles.formatRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            <Text style={styles.formatText}>{format}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// ============================================
// Step 2: Field Mapping Review
// ============================================

const FieldMappingStep: React.FC = () => {
  const store = useImportStore();
  const { pressHandlers: confirmPress, animatedStyle: confirmAnim } = useSpringPress();

  const parseResult = store.parseResult;
  if (!parseResult) return null;

  const handleConfirm = useCallback(() => {
    store.confirmFieldMapping();
    haptics.tap();

    // Start coaster matching
    store.setLoading(true, 'Matching coasters...');

    const uniqueNames = new Map<string, string | null>();
    for (const ride of parseResult.rides) {
      if (!uniqueNames.has(ride.rawCoasterName)) {
        uniqueNames.set(ride.rawCoasterName, ride.rawParkName);
      }
    }

    const names = Array.from(uniqueNames.entries()).map(([rawName, rawParkName]) => ({
      rawName,
      rawParkName,
    }));

    // Send compact coaster DB (id, name, park only)
    const coasterDatabase = COASTER_INDEX.map((c) => ({
      id: c.id,
      name: c.name,
      park: c.park,
    }));

    callMatchCoasterNames({ names, coasterDatabase })
      .then((result) => {
        store.setMatchResults(result.results);
        haptics.success();
      })
      .catch((error) => {
        const msg = error instanceof Error ? error.message : 'Failed to match coasters';
        store.setError(msg);
        store.setStep('field-mapping'); // Go back
        haptics.error();
      });
  }, [parseResult]);

  const TRACKR_FIELDS = [
    { key: 'coasterName', label: 'Coaster Name' },
    { key: 'parkName', label: 'Park Name' },
    { key: 'date', label: 'Date' },
    { key: 'rating', label: 'Rating' },
    { key: 'seat', label: 'Seat' },
    { key: 'notes', label: 'Notes' },
    { key: 'rideCount', label: 'Ride Count' },
    { key: '', label: 'Skip (unmapped)' },
  ];

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
    >
      <Animated.View entering={FadeIn.duration(200)}>
        <Text style={styles.stepSubtitle}>
          {parseResult.rides.length} rides found in {parseResult.sourceFormat.toUpperCase()} file
        </Text>

        {parseResult.warnings.length > 0 && (
          <View style={styles.warningBanner}>
            {parseResult.warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>{w}</Text>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>Column Mapping</Text>
        <Text style={styles.sectionDescription}>
          We detected these column mappings. Adjust if needed.
        </Text>

        {Object.entries(store.fieldMapping).map(([sourceCol, targetField]) => (
          <View key={sourceCol} style={styles.mappingRow}>
            <View style={styles.mappingSource}>
              <Text style={styles.mappingLabel}>{sourceCol}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.text.meta} />
            <View style={styles.mappingTarget}>
              <Text style={styles.mappingValue}>
                {TRACKR_FIELDS.find((f) => f.key === targetField)?.label ?? targetField}
              </Text>
            </View>
          </View>
        ))}

        <Pressable {...confirmPress} onPress={handleConfirm}>
          <Animated.View style={[styles.primaryButton, confirmAnim]}>
            {store.isLoading ? (
              <ActivityIndicator color={colors.text.inverse} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Looks Good</Text>
            )}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

// ============================================
// Step 3: Coaster Matching
// ============================================

const CoasterMatchingStep: React.FC = () => {
  const store = useImportStore();
  const { pressHandlers: advancePress, animatedStyle: advanceAnim } = useSpringPress();

  const allResolved = useMemo(() => {
    const { matchResults, confirmedMatches, skippedNames } = store;
    return matchResults.every(
      (r) => confirmedMatches.has(r.rawName) || skippedNames.has(r.rawName),
    );
  }, [store.matchResults, store.confirmedMatches, store.skippedNames]);

  const handleAdvance = useCallback(() => {
    if (!store.parseResult) return;

    const resolved = resolveImportRides(
      store.parseResult.rides,
      store.matchResults,
      store.confirmedMatches,
    );

    const existingLogs = getAllLogs().map((l) => ({
      coasterId: l.coasterId,
      timestamp: l.timestamp,
    }));

    const withDuplicates = detectDuplicates(resolved, existingLogs);
    store.setResolvedRides(withDuplicates);
    store.advanceToPreview();
    haptics.tap();
  }, [store.parseResult, store.matchResults, store.confirmedMatches]);

  const confirmedCount = store.confirmedMatches.size;
  const skippedCount = store.skippedNames.size;
  const totalCount = store.matchResults.length;
  const unresolvedCount = totalCount - confirmedCount - skippedCount;

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
    >
      <Animated.View entering={FadeIn.duration(200)}>
        <Text style={styles.stepSubtitle}>
          {confirmedCount} matched, {skippedCount} skipped, {unresolvedCount} remaining
        </Text>

        {store.matchResults.map((result, index) => (
          <MatchRow
            key={result.rawName}
            result={result}
            index={index}
            isConfirmed={store.confirmedMatches.has(result.rawName)}
            isSkipped={store.skippedNames.has(result.rawName)}
            confirmedMatch={store.confirmedMatches.get(result.rawName)}
            onConfirm={(match) => {
              store.confirmMatch(result.rawName, match);
              haptics.tap();
            }}
            onSkip={() => {
              store.skipName(result.rawName);
              haptics.tap();
            }}
          />
        ))}

        <Pressable
          {...advancePress}
          onPress={handleAdvance}
          disabled={!allResolved}
        >
          <Animated.View
            style={[
              styles.primaryButton,
              advanceAnim,
              !allResolved && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {allResolved ? 'Review Import' : `${unresolvedCount} coasters need matching`}
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

// ============================================
// Match Row Component
// ============================================

interface MatchRowProps {
  result: CoasterMatchResult;
  index: number;
  isConfirmed: boolean;
  isSkipped: boolean;
  confirmedMatch?: { coasterId: string; coasterName: string; parkName: string };
  onConfirm: (match: { coasterId: string; coasterName: string; parkName: string }) => void;
  onSkip: () => void;
}

const MatchRow: React.FC<MatchRowProps> = ({
  result,
  index,
  isConfirmed,
  isSkipped,
  confirmedMatch,
  onConfirm,
  onSkip,
}) => {
  const { pressHandlers: confirmPress, animatedStyle: confirmAnim } = useSpringPress();
  const { pressHandlers: skipPress, animatedStyle: skipAnim } = useSpringPress();

  const confidence = result.bestMatch?.confidence ?? 0;
  const isHighConfidence = confidence >= 0.85;

  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(index * 30)}
      layout={Layout.duration(200)}
      style={[
        styles.matchRow,
        isConfirmed && styles.matchRowConfirmed,
        isSkipped && styles.matchRowSkipped,
      ]}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.matchRawName}>{result.rawName}</Text>
        {isConfirmed && (
          <Ionicons name="checkmark-circle" size={18} color={colors.status.success} />
        )}
        {isSkipped && (
          <Ionicons name="close-circle" size={18} color={colors.text.meta} />
        )}
      </View>

      {isConfirmed && confirmedMatch && (
        <Text style={styles.matchConfirmedText}>
          {confirmedMatch.coasterName} at {confirmedMatch.parkName}
        </Text>
      )}

      {isSkipped && (
        <Text style={styles.matchSkippedText}>Skipped (rides won't be imported)</Text>
      )}

      {!isConfirmed && !isSkipped && result.bestMatch && (
        <View style={styles.matchSuggestion}>
          <View style={styles.matchSuggestionRow}>
            <View style={styles.matchSuggestionInfo}>
              <Text style={styles.matchSuggestionName}>
                {result.bestMatch.coasterName}
              </Text>
              <Text style={styles.matchSuggestionPark}>
                {result.bestMatch.parkName}
              </Text>
            </View>
            <View style={[
              styles.confidenceBadge,
              isHighConfidence ? styles.confidenceHigh : styles.confidenceLow,
            ]}>
              <Text style={[
                styles.confidenceText,
                isHighConfidence ? styles.confidenceTextHigh : styles.confidenceTextLow,
              ]}>
                {Math.round(confidence * 100)}%
              </Text>
            </View>
          </View>

          <View style={styles.matchActions}>
            <Pressable
              {...confirmPress}
              onPress={() => onConfirm({
                coasterId: result.bestMatch!.coasterId,
                coasterName: result.bestMatch!.coasterName,
                parkName: result.bestMatch!.parkName,
              })}
            >
              <Animated.View style={[styles.matchConfirmButton, confirmAnim]}>
                <Text style={styles.matchConfirmButtonText}>Confirm</Text>
              </Animated.View>
            </Pressable>

            <Pressable {...skipPress} onPress={onSkip}>
              <Animated.View style={[styles.matchSkipButton, skipAnim]}>
                <Text style={styles.matchSkipButtonText}>Skip</Text>
              </Animated.View>
            </Pressable>
          </View>

          {result.alternatives.length > 0 && (
            <View style={styles.alternatives}>
              <Text style={styles.alternativesLabel}>Or did you mean:</Text>
              {result.alternatives.map((alt) => (
                <Pressable
                  key={alt.coasterId}
                  onPress={() => {
                    onConfirm({
                      coasterId: alt.coasterId,
                      coasterName: alt.coasterName,
                      parkName: alt.parkName,
                    });
                  }}
                  style={styles.alternativeRow}
                >
                  <Text style={styles.alternativeName}>
                    {alt.coasterName} — {alt.parkName}
                  </Text>
                  <Text style={styles.alternativeConfidence}>
                    {Math.round(alt.confidence * 100)}%
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {!isConfirmed && !isSkipped && !result.bestMatch && (
        <View style={styles.matchNoResult}>
          <Text style={styles.matchNoResultText}>
            No match found. This ride will be skipped.
          </Text>
          <Pressable {...skipPress} onPress={onSkip}>
            <Animated.View style={[styles.matchSkipButton, skipAnim]}>
              <Text style={styles.matchSkipButtonText}>Skip</Text>
            </Animated.View>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};

// ============================================
// Step 4: Preview
// ============================================

const PreviewStep: React.FC = () => {
  const store = useImportStore();
  const { alert: showAlert } = useConfirmModal();
  const { pressHandlers: importPress, animatedStyle: importAnim } = useSpringPress();

  const selectedCount = store.resolvedRides.filter((r) => r.selected).length;
  const totalCount = store.resolvedRides.length;
  const duplicateCount = store.resolvedRides.filter((r) => r.isDuplicate).length;

  const handleStartImport = useCallback(async () => {
    const user = getAuthUser();
    if (!user) {
      showAlert({ title: 'Sign In Required', message: 'You need to be signed in to import ride data.' });
      return;
    }

    store.setStep('importing');
    haptics.tap();

    const imported = await writeImportBatch(
      user.uid,
      store.resolvedRides,
      (progress) => store.setProgress(progress),
    );

    if (imported > 0) {
      haptics.success();
    }
  }, [store.resolvedRides]);

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
    >
      <Animated.View entering={FadeIn.duration(200)}>
        <View style={styles.previewSummary}>
          <Text style={styles.previewSummaryText}>
            {selectedCount} of {totalCount} rides will be imported
          </Text>
          {duplicateCount > 0 && (
            <Text style={styles.previewDuplicateNote}>
              {duplicateCount} potential duplicates detected (unchecked by default)
            </Text>
          )}
        </View>

        <View style={styles.selectAllRow}>
          <Pressable
            onPress={() => {
              store.setAllSelected(true);
              haptics.tap();
            }}
            style={styles.selectAllButton}
          >
            <Text style={styles.selectAllText}>Select All</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              store.setAllSelected(false);
              haptics.tap();
            }}
            style={styles.selectAllButton}
          >
            <Text style={styles.selectAllText}>Deselect All</Text>
          </Pressable>
        </View>

        {store.resolvedRides.map((ride, index) => (
          <Animated.View
            key={`${ride.matchedCoaster.coasterId}-${ride.parsedRide.rowIndex}`}
            entering={FadeIn.duration(200).delay(Math.min(index * 20, 400))}
            layout={Layout.duration(200)}
          >
            <Pressable
              onPress={() => {
                store.toggleRideSelected(ride.parsedRide.rowIndex);
                haptics.tap();
              }}
              style={[
                styles.previewRow,
                ride.isDuplicate && styles.previewRowDuplicate,
                !ride.selected && styles.previewRowDeselected,
              ]}
            >
              <View style={styles.previewCheckbox}>
                <Ionicons
                  name={ride.selected ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={ride.selected ? colors.accent.primary : colors.text.meta}
                />
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewCoasterName}>
                  {ride.matchedCoaster.coasterName}
                </Text>
                <Text style={styles.previewParkName}>
                  {ride.matchedCoaster.parkName}
                </Text>
                <Text style={styles.previewDate}>
                  {ride.parsedRide.parsedDate
                    ? new Date(ride.parsedRide.parsedDate).toLocaleDateString()
                    : 'No date'}
                </Text>
              </View>
              {ride.isDuplicate && (
                <View style={styles.duplicateBadge}>
                  <Text style={styles.duplicateBadgeText}>Already logged</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}

        <Pressable
          {...importPress}
          onPress={handleStartImport}
          disabled={selectedCount === 0}
        >
          <Animated.View
            style={[
              styles.primaryButton,
              importAnim,
              selectedCount === 0 && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Import {selectedCount} Rides
            </Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
};

// ============================================
// Step 5: Importing
// ============================================

const ImportingStep: React.FC = () => {
  const store = useImportStore();
  const progress = store.progress;
  const percentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;

  return (
    <View style={styles.importingContainer}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.importingContent}>
        <ActivityIndicator
          size="large"
          color={colors.accent.primary}
          style={styles.importingSpinner}
        />
        <Text style={styles.importingTitle}>
          Importing rides...
        </Text>
        <Text style={styles.importingCount}>
          {progress.completed}/{progress.total}
        </Text>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>

        {progress.status === 'error' && progress.error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.status.error} />
            <Text style={styles.errorText}>{progress.error}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

// ============================================
// Step 6: Complete
// ============================================

const CompleteStep: React.FC = () => {
  const store = useImportStore();
  const navigation = useNavigation();
  const { pressHandlers: donePress, animatedStyle: doneAnim } = useSpringPress();

  return (
    <View style={styles.importingContainer}>
      <Animated.View entering={FadeIn.duration(200)} style={styles.importingContent}>
        <View style={styles.completeIcon}>
          <Ionicons name="checkmark-circle" size={64} color={colors.status.success} />
        </View>
        <Text style={styles.importingTitle}>Import Complete</Text>
        <Text style={styles.completeCount}>
          {store.progress.completed} rides added to your logbook
        </Text>
        <Text style={styles.completeNote}>
          Imported rides appear in your logbook's pending tab.
        </Text>

        <Pressable
          {...donePress}
          onPress={() => {
            store.reset();
            navigation.goBack();
            haptics.success();
          }}
        >
          <Animated.View style={[styles.primaryButton, doneAnim]}>
            <Text style={styles.primaryButtonText}>Done</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

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
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },

  // Step containers
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },

  // Upload step
  uploadSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  uploadIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  uploadTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  uploadDescription: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.base,
    borderRadius: radius.button,
    gap: spacing.md,
    ...shadows.small,
  },
  uploadButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  loadingMessage: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF0F0',
    padding: spacing.base,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: typography.sizes.caption,
    color: colors.status.error,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  fileInfoText: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
  },
  supportedFormats: {
    backgroundColor: colors.background.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.small,
  },
  supportedTitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  formatText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
  },

  // Field mapping
  stepSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  warningBanner: {
    backgroundColor: colors.banner.warningBg,
    borderWidth: 1,
    borderColor: colors.banner.warningBorder,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: typography.sizes.caption,
    color: colors.banner.warningText,
  },
  sectionTitle: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.sizes.caption,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  mappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  mappingSource: {
    flex: 1,
  },
  mappingLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  mappingTarget: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mappingValue: {
    fontSize: typography.sizes.body,
    color: colors.accent.primary,
    fontWeight: typography.weights.medium,
  },

  // Primary button
  primaryButton: {
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing.base + spacing.xs,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.xxl,
    ...shadows.small,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },

  // Coaster matching
  matchRow: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.small,
  },
  matchRowConfirmed: {
    borderLeftWidth: 3,
    borderLeftColor: colors.status.success,
  },
  matchRowSkipped: {
    opacity: 0.6,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  matchRawName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  matchConfirmedText: {
    fontSize: typography.sizes.caption,
    color: colors.status.success,
  },
  matchSkippedText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
  },
  matchSuggestion: {
    marginTop: spacing.sm,
  },
  matchSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchSuggestionInfo: {
    flex: 1,
  },
  matchSuggestionName: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  matchSuggestionPark: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  confidenceHigh: {
    backgroundColor: '#E8F5E9',
  },
  confidenceLow: {
    backgroundColor: '#FFF8E1',
  },
  confidenceText: {
    fontSize: typography.sizes.meta,
    fontWeight: typography.weights.semibold,
  },
  confidenceTextHigh: {
    color: colors.status.success,
  },
  confidenceTextLow: {
    color: '#F9A825',
  },
  matchActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  matchConfirmButton: {
    backgroundColor: colors.accent.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  matchConfirmButtonText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  matchSkipButton: {
    backgroundColor: colors.background.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  matchSkipButtonText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  alternatives: {
    marginTop: spacing.base,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  alternativesLabel: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginBottom: spacing.sm,
  },
  alternativeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  alternativeName: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
    flex: 1,
  },
  alternativeConfidence: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
  },
  matchNoResult: {
    marginTop: spacing.sm,
  },
  matchNoResultText: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    marginBottom: spacing.sm,
  },

  // Preview
  previewSummary: {
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  previewSummaryText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  previewDuplicateNote: {
    fontSize: typography.sizes.meta,
    color: colors.status.warning,
    marginTop: spacing.xs,
  },
  selectAllRow: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.lg,
  },
  selectAllButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  selectAllText: {
    fontSize: typography.sizes.caption,
    color: colors.accent.primary,
    fontWeight: typography.weights.medium,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  previewRowDuplicate: {
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  previewRowDeselected: {
    opacity: 0.5,
  },
  previewCheckbox: {
    marginRight: spacing.base,
  },
  previewInfo: {
    flex: 1,
  },
  previewCoasterName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.primary,
  },
  previewParkName: {
    fontSize: typography.sizes.meta,
    color: colors.text.secondary,
  },
  previewDate: {
    fontSize: typography.sizes.meta,
    color: colors.text.meta,
    marginTop: spacing.xs,
  },
  duplicateBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  duplicateBadgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: '#F9A825',
  },

  // Importing
  importingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  importingContent: {
    alignItems: 'center',
    width: '100%',
  },
  importingSpinner: {
    marginBottom: spacing.xl,
  },
  importingTitle: {
    fontSize: typography.sizes.heading,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  importingCount: {
    fontSize: typography.sizes.large,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.background.input,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },

  // Complete
  completeIcon: {
    marginBottom: spacing.xl,
  },
  completeCount: {
    fontSize: typography.sizes.large,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  completeNote: {
    fontSize: typography.sizes.caption,
    color: colors.text.meta,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
});
