/**
 * CriteriaSetupScreen
 *
 * Rating criteria configuration screen.
 * - Templates picker for quick setup
 * - Weight sliders with locking mechanism
 * - Proportional distribution of unlocked weights
 * - Add/edit/delete criteria
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated as RNAnimated,
  TextInput,
  Alert,
  Dimensions,
  LayoutAnimation,
  UIManager,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import Animated from 'react-native-reanimated';
import { useSpringPress } from '../hooks/useSpringPress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radius } from '../theme/radius';
import {
  RatingCriteria,
  DEFAULT_CRITERIA,
  generateLogId,
} from '../types/rideLog';
import {
  getCriteriaConfig,
  updateCriteriaConfig,
  subscribe,
} from '../stores/rideLogStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation constants
const RESPONSIVE_SPRING = {
  damping: 16,
  stiffness: 180,
  mass: 0.8,
  useNativeDriver: true,
};

// Predefined templates
const CRITERIA_TEMPLATES = [
  {
    id: 'thrill-seeker',
    name: 'Thrill Seeker',
    icon: 'flash-outline' as const,
    criteria: [
      { id: 'intensity', name: 'Intensity', weight: 30, icon: 'flash-outline', description: 'Forces and thrill level' },
      { id: 'airtime', name: 'Airtime', weight: 25, icon: 'airplane-outline', description: 'Moments of weightlessness' },
      { id: 'speed', name: 'Speed', weight: 20, icon: 'speedometer-outline', description: 'Top speed and acceleration' },
      { id: 'inversions', name: 'Inversions', weight: 15, icon: 'sync-outline', description: 'Loops, rolls, and flips' },
      { id: 'smoothness', name: 'Smoothness', weight: 10, icon: 'water-outline', description: 'Ride comfort' },
    ],
  },
  {
    id: 'theme-park-fan',
    name: 'Theme Park Fan',
    icon: 'color-palette-outline' as const,
    criteria: [
      { id: 'theming', name: 'Theming', weight: 30, icon: 'color-palette-outline', description: 'Visual design and atmosphere' },
      { id: 'storytelling', name: 'Story', weight: 20, icon: 'book-outline', description: 'Narrative and immersion' },
      { id: 'airtime', name: 'Airtime', weight: 20, icon: 'airplane-outline', description: 'Moments of weightlessness' },
      { id: 'smoothness', name: 'Smoothness', weight: 15, icon: 'water-outline', description: 'Ride comfort' },
      { id: 'pacing', name: 'Pacing', weight: 15, icon: 'timer-outline', description: 'Flow and element variety' },
    ],
  },
  {
    id: 'balanced',
    name: 'Balanced',
    icon: 'scale-outline' as const,
    criteria: DEFAULT_CRITERIA.map(c => ({ ...c })),
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: 'create-outline' as const,
    criteria: [],
  },
];

// Available icons for new criteria
const AVAILABLE_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'flash-outline',
  'airplane-outline',
  'water-outline',
  'color-palette-outline',
  'speedometer-outline',
  'sync-outline',
  'timer-outline',
  'book-outline',
  'heart-outline',
  'star-outline',
  'musical-notes-outline',
  'glasses-outline',
  'fitness-outline',
  'rocket-outline',
];

interface CriteriaSetupScreenProps {
  onBack?: () => void;
}

export const CriteriaSetupScreen: React.FC<CriteriaSetupScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const slidingCriterionId = useRef<string | null>(null); // Track which criterion is being adjusted

  // Load initial criteria from store
  const initialConfig = getCriteriaConfig();
  const [criteria, setCriteria] = useState<RatingCriteria[]>(
    initialConfig.criteria.map(c => ({ ...c, isLocked: c.isLocked ?? false }))
  );
  const [originalCriteria, setOriginalCriteria] = useState<RatingCriteria[]>(
    initialConfig.criteria.map(c => ({ ...c, isLocked: c.isLocked ?? false }))
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSliding, setIsSliding] = useState(false); // Disable scroll while sliding
  const [templatesExpanded, setTemplatesExpanded] = useState(!initialConfig.hasCompletedSetup); // Expanded for new users

  // Handle sliding end - just re-enable scrolling (no auto-sort)
  const handleSlidingEnd = useCallback(() => {
    setIsSliding(false);
    slidingCriterionId.current = null;
  }, []);

  // Handle reorder - move criterion from one index to another
  const handleMoveCriterion = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= criteria.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate the reorder
    LayoutAnimation.configureNext({
      duration: 250,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    setCriteria(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, [criteria.length]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(criteria) !== JSON.stringify(originalCriteria);
    setHasChanges(changed);
  }, [criteria, originalCriteria]);

  // Calculate total weight
  const totalWeight = useMemo(() => {
    return criteria.reduce((sum, c) => sum + c.weight, 0);
  }, [criteria]);

  // Handle template toggle
  const handleToggleTemplates = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setTemplatesExpanded(prev => !prev);
  }, []);

  // Apply template (after confirmation)
  const applyTemplate = useCallback((template: typeof CRITERIA_TEMPLATES[0]) => {
    // Scroll to top smoothly first to avoid jarring scroll jump
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    // Animate the criteria list change
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
    });

    if (template.id === 'custom') {
      // Start fresh with empty list
      setCriteria([]);
    } else {
      setCriteria(template.criteria.map(c => ({ ...c, isLocked: false })));
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Collapse templates after selection
    setTemplatesExpanded(false);
  }, []);

  // Handle template selection with confirmation
  const handleSelectTemplate = useCallback((template: typeof CRITERIA_TEMPLATES[0]) => {
    if (template.id === 'custom') {
      Alert.alert(
        'Start Fresh?',
        'This will clear all your current criteria so you can build from scratch.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: () => applyTemplate(template) },
        ]
      );
    } else {
      Alert.alert(
        'Apply Template?',
        `This will replace all your current criteria with the "${template.name}" preset. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Apply', style: 'destructive', onPress: () => applyTemplate(template) },
        ]
      );
    }
  }, [applyTemplate]);

  // Track if we've already hit the wall (for single haptic feedback)
  const hitWallRef = useRef(false);

  // Handle weight change with TRUE proportional distribution
  // Bigger sliders absorb more of the change, preserving relative proportions
  const handleWeightChange = useCallback((criteriaId: string, newWeight: number) => {
    setCriteria(prev => {
      const index = prev.findIndex(c => c.id === criteriaId);
      if (index === -1) return prev;

      const criterion = prev[index];

      // Get locked criteria (excluding current one if it's locked)
      const lockedOthers = prev.filter(c => c.isLocked && c.id !== criteriaId);
      const lockedWeight = lockedOthers.reduce((sum, c) => sum + c.weight, 0);

      // Get unlocked criteria (excluding the one being changed)
      const unlockedOthers = prev.filter(c => !c.isLocked && c.id !== criteriaId);
      const unlockedOthersCount = unlockedOthers.length;

      // Calculate max weight: 100 - locked weights - (1 for each other unlocked criterion)
      const maxWeight = 100 - lockedWeight - unlockedOthersCount;

      // Calculate min weight: when all others are locked, this criterion must absorb ALL remaining weight
      // Formula: (100 - lockedWeight) - (maxPossibleOthers) where maxPossibleOthers = unlockedOthersCount * 99
      // When unlockedOthersCount = 0, minWeight = maxWeight (slider is locked in place)
      const minWeight = Math.max(1, (100 - lockedWeight) - (unlockedOthersCount * 99));

      // Clamp new weight
      const clampedWeight = Math.max(minWeight, Math.min(newWeight, maxWeight));

      // Check if hitting the wall
      const isHittingWall = newWeight > maxWeight || newWeight < minWeight;

      // Only fire haptic ONCE when first hitting the wall
      if (isHittingWall && !hitWallRef.current) {
        hitWallRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (!isHittingWall) {
        hitWallRef.current = false;
      }

      // If no change, return prev (this tells the slider to rubber band back)
      if (clampedWeight === criterion.weight) return prev;

      // Calculate how much weight needs to be distributed to others
      const remainingForOthers = 100 - lockedWeight - clampedWeight;

      if (unlockedOthersCount === 0) {
        // Only this criterion is unlocked
        const updated = [...prev];
        updated[index] = { ...criterion, weight: clampedWeight };
        return updated;
      }

      // TRUE PROPORTIONAL DISTRIBUTION
      // Each unlocked criterion gets a share proportional to its current weight
      const totalUnlockedOthersWeight = unlockedOthers.reduce((sum, c) => sum + c.weight, 0);

      // Calculate exact proportional values (with decimals)
      const exactWeights: { id: string; exact: number; floor: number; remainder: number }[] = [];
      unlockedOthers.forEach(c => {
        const proportion = totalUnlockedOthersWeight > 0
          ? c.weight / totalUnlockedOthersWeight
          : 1 / unlockedOthersCount;
        const exact = Math.max(1, remainingForOthers * proportion);
        const floor = Math.floor(exact);
        exactWeights.push({
          id: c.id,
          exact,
          floor: Math.max(1, floor), // Ensure minimum of 1
          remainder: exact - floor,
        });
      });

      // Calculate how many extra points we need to distribute (from rounding down)
      const floorTotal = exactWeights.reduce((sum, e) => sum + e.floor, 0);
      let extraPoints = remainingForOthers - floorTotal;

      // Use "largest remainder" method: give +1 to those with biggest fractional parts
      // Sort by remainder descending
      const sortedByRemainder = [...exactWeights].sort((a, b) => b.remainder - a.remainder);

      const newWeights: Record<string, number> = {};
      sortedByRemainder.forEach(e => {
        if (extraPoints > 0 && e.floor < remainingForOthers) {
          newWeights[e.id] = e.floor + 1;
          extraPoints--;
        } else {
          newWeights[e.id] = e.floor;
        }
      });

      // Build updated array
      const updated = prev.map(c => {
        if (c.id === criteriaId) {
          return { ...c, weight: clampedWeight };
        }
        if (c.isLocked) {
          return c;
        }
        return { ...c, weight: newWeights[c.id] ?? c.weight };
      });

      return updated;
    });
  }, []);

  // Handle lock toggle
  const handleToggleLock = useCallback((criteriaId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCriteria(prev =>
      prev.map(c =>
        c.id === criteriaId ? { ...c, isLocked: !c.isLocked } : c
      )
    );
  }, []);

  // Handle description toggle
  const handleToggleDescription = useCallback((criteriaId: string) => {
    setEditingCriteriaId(prev => prev === criteriaId ? null : criteriaId);
  }, []);

  // Distribute weights evenly
  const handleDistributeEvenly = useCallback(() => {
    // Animate the weight changes
    LayoutAnimation.configureNext({
      duration: 250,
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const unlockedCriteria = criteria.filter(c => !c.isLocked);
    const lockedWeight = criteria.filter(c => c.isLocked).reduce((sum, c) => sum + c.weight, 0);
    const availableWeight = 100 - lockedWeight;

    if (unlockedCriteria.length === 0) {
      Alert.alert('All Locked', 'Unlock at least one criterion to distribute evenly.');
      return;
    }

    const evenWeight = Math.floor(availableWeight / unlockedCriteria.length);
    const remainder = availableWeight - evenWeight * unlockedCriteria.length;

    let remainderAssigned = 0;
    setCriteria(prev =>
      prev.map(c => {
        if (c.isLocked) return c;
        const extra = remainderAssigned < remainder ? 1 : 0;
        remainderAssigned++;
        return { ...c, weight: evenWeight + extra };
      })
    );
  }, [criteria]);

  // Revert changes
  const handleRevert = useCallback(() => {
    // Scroll to top smoothly first to avoid jarring scroll jump
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });

    // Animate the criteria list change
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeOut, property: LayoutAnimation.Properties.opacity },
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCriteria(originalCriteria.map(c => ({ ...c })));
  }, [originalCriteria]);

  // Save changes
  const handleSave = useCallback(() => {
    if (criteria.length === 0) {
      Alert.alert('No Criteria', 'Add at least one rating criterion.');
      return;
    }

    if (totalWeight !== 100) {
      Alert.alert('Invalid Weights', `Weights must sum to 100%. Current: ${totalWeight}%`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCriteriaConfig({
      criteria,
      hasCompletedSetup: true,
      lastModifiedAt: new Date().toISOString(),
    });
    setOriginalCriteria(criteria.map(c => ({ ...c })));
    setHasChanges(false);

    Alert.alert('Saved', 'Your rating criteria have been updated.');
  }, [criteria, totalWeight]);

  // Add new criterion with slide-in animation
  const handleAddCriterion = useCallback(() => {
    if (criteria.length >= 10) {
      Alert.alert('Maximum Reached', 'You can have up to 10 criteria.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Configure slide-in animation before adding
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
    });

    // Calculate weight for new criterion
    const lockedWeight = criteria.filter(c => c.isLocked).reduce((sum, c) => sum + c.weight, 0);
    const availableWeight = 100 - lockedWeight;
    const unlockedCount = criteria.filter(c => !c.isLocked).length;
    const newWeight = Math.floor(availableWeight / (unlockedCount + 1));

    // Reduce unlocked criteria weights proportionally
    const updatedCriteria = criteria.map(c => {
      if (c.isLocked) return c;
      const newCriterionWeight = Math.floor(c.weight * (1 - newWeight / availableWeight));
      return { ...c, weight: Math.max(1, newCriterionWeight) };
    });

    // Pick a random unused icon
    const usedIcons = criteria.map(c => c.icon);
    const availableIcons = AVAILABLE_ICONS.filter(i => !usedIcons.includes(i));
    const randomIcon = availableIcons[Math.floor(Math.random() * availableIcons.length)] || 'star-outline';

    const newCriterion: RatingCriteria = {
      id: generateLogId(),
      name: 'New Criterion',
      weight: newWeight,
      icon: randomIcon,
      description: 'Tap to edit description',
      isLocked: false,
    };

    setCriteria([...updatedCriteria, newCriterion]);
    setEditingCriteriaId(newCriterion.id);
  }, [criteria]);

  // Delete criterion with slide-out animation
  const handleDeleteCriterion = useCallback((criteriaId: string) => {
    if (criteria.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one criterion.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Configure slide-out animation before deleting
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeOut,
        property: LayoutAnimation.Properties.scaleXY,
        duration: 250,
      },
    });

    const criterionToDelete = criteria.find(c => c.id === criteriaId);
    if (!criterionToDelete) return;

    const freedWeight = criterionToDelete.weight;
    const remainingCriteria = criteria.filter(c => c.id !== criteriaId);
    const unlockedRemaining = remainingCriteria.filter(c => !c.isLocked);

    if (unlockedRemaining.length === 0) {
      // All remaining are locked, unlock one
      Alert.alert('Weight Distribution', 'Please unlock at least one criterion to redistribute weight.');
      return;
    }

    // Distribute freed weight proportionally
    const totalUnlockedWeight = unlockedRemaining.reduce((sum, c) => sum + c.weight, 0);

    const updatedCriteria = remainingCriteria.map(c => {
      if (c.isLocked) return c;
      const proportion = c.weight / totalUnlockedWeight;
      const extra = Math.round(freedWeight * proportion);
      return { ...c, weight: c.weight + extra };
    });

    // Ensure total is 100
    const currentTotal = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (currentTotal !== 100) {
      const unlockIndex = updatedCriteria.findIndex(c => !c.isLocked);
      if (unlockIndex !== -1) {
        updatedCriteria[unlockIndex].weight += 100 - currentTotal;
      }
    }

    setCriteria(updatedCriteria);
    if (editingCriteriaId === criteriaId) {
      setEditingCriteriaId(null);
    }
  }, [criteria, editingCriteriaId]);

  // Update criterion name
  const handleUpdateName = useCallback((criteriaId: string, name: string) => {
    setCriteria(prev =>
      prev.map(c => (c.id === criteriaId ? { ...c, name } : c))
    );
  }, []);

  // Update criterion description
  const handleUpdateDescription = useCallback((criteriaId: string, description: string) => {
    setCriteria(prev =>
      prev.map(c => (c.id === criteriaId ? { ...c, description } : c))
    );
  }, []);

  // Handle back press
  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onBack },
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onBack?.();
    }
  }, [hasChanges, onBack]);

  // Toggle edit mode with smooth animation
  const handleToggleEditMode = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setIsEditMode(prev => !prev);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Rating Criteria</Text>
        <Pressable style={styles.editButton} onPress={handleToggleEditMode}>
          <Text style={[styles.editButtonText, isEditMode && styles.editButtonTextActive]}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSliding}
      >
        {/* Templates Section - Collapsible */}
        <View style={styles.section}>
          {templatesExpanded ? (
            <>
              <View style={styles.templateHeader}>
                <Text style={styles.sectionTitle}>Quick Setup</Text>
                <Pressable onPress={handleToggleTemplates} style={styles.templateCollapseButton}>
                  <Ionicons name="chevron-up" size={18} color={colors.text.meta} />
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.templatesContainer}
                style={styles.templatesScrollView}
              >
                {CRITERIA_TEMPLATES.map(template => (
                  <TemplateChip
                    key={template.id}
                    template={template}
                    onPress={() => handleSelectTemplate(template)}
                  />
                ))}
              </ScrollView>
            </>
          ) : (
            <Pressable onPress={handleToggleTemplates} style={styles.templatesCollapsed}>
              <View style={styles.templatesCollapsedContent}>
                <Ionicons name="layers-outline" size={18} color={colors.accent.primary} />
                <Text style={styles.templatesCollapsedText}>Use a template...</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.text.meta} />
            </Pressable>
          )}
        </View>

        {/* Criteria List */}
        <View style={styles.criteriaList}>
          {criteria.map((criterion, index) => (
            <CriterionRow
              key={criterion.id}
              criterion={criterion}
              index={index}
              totalCount={criteria.length}
              isExpanded={editingCriteriaId === criterion.id}
              isEditMode={isEditMode}
              onWeightChange={(weight) => handleWeightChange(criterion.id, weight)}
              onToggleLock={() => handleToggleLock(criterion.id)}
              onToggleExpand={() => handleToggleDescription(criterion.id)}
              onUpdateName={(name) => handleUpdateName(criterion.id, name)}
              onUpdateDescription={(desc) => handleUpdateDescription(criterion.id, desc)}
              onDelete={() => handleDeleteCriterion(criterion.id)}
              onMove={(toIndex) => handleMoveCriterion(index, toIndex)}
              onSlidingStart={() => {
                slidingCriterionId.current = criterion.id;
                setIsSliding(true);
              }}
              onSlidingEnd={handleSlidingEnd}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleAddCriterion}
          >
            <Ionicons name="add" size={18} color={colors.accent.primary} />
            <Text style={styles.actionButtonTextSecondary}>Add Criterion</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleDistributeEvenly}
          >
            <Ionicons name="git-compare-outline" size={18} color={colors.accent.primary} />
            <Text style={styles.actionButtonTextSecondary}>Distribute Evenly</Text>
          </Pressable>
        </View>

        {/* Save / Revert Buttons */}
        <View style={styles.bottomButtons}>
          {hasChanges && (
            <Pressable
              style={[styles.bottomButton, styles.revertButton]}
              onPress={handleRevert}
            >
              <Text style={styles.revertButtonText}>Revert Changes</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.bottomButton,
              styles.saveButton,
              !hasChanges && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges}
          >
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              Save Changes
            </Text>
          </Pressable>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// =========================================
// Template Chip Component
// =========================================
interface TemplateChipProps {
  template: typeof CRITERIA_TEMPLATES[0];
  onPress: () => void;
}

const TemplateChip: React.FC<TemplateChipProps> = ({ template, onPress }) => {
  const { pressHandlers, animatedStyle } = useSpringPress({
    scale: 0.95,
  });

  return (
    <Pressable onPress={onPress} onPressIn={pressHandlers.onPressIn} onPressOut={pressHandlers.onPressOut}>
      <Animated.View style={[styles.templateChip, animatedStyle]}>
        <Ionicons name={template.icon} size={18} color={colors.accent.primary} />
        <Text style={styles.templateChipText}>{template.name}</Text>
      </Animated.View>
    </Pressable>
  );
};

// =========================================
// Criterion Row Component
// =========================================
interface CriterionRowProps {
  criterion: RatingCriteria;
  index: number;
  totalCount: number;
  isExpanded: boolean;
  isEditMode: boolean;
  onWeightChange: (weight: number) => void;
  onToggleLock: () => void;
  onToggleExpand: () => void;
  onUpdateName: (name: string) => void;
  onUpdateDescription: (description: string) => void;
  onDelete: () => void;
  onMove: (toIndex: number) => void;
  onSlidingStart: () => void;
  onSlidingEnd: () => void;
}

const CriterionRow: React.FC<CriterionRowProps> = ({
  criterion,
  index,
  totalCount,
  isExpanded,
  isEditMode,
  onWeightChange,
  onToggleLock,
  onToggleExpand,
  onUpdateName,
  onUpdateDescription,
  onDelete,
  onMove,
  onSlidingStart,
  onSlidingEnd,
}) => {
  // Container padding (32) - icon (48) - gap (16)
  const sliderWidth = SCREEN_WIDTH - 32 - 48 - 16;

  // Use LayoutAnimation for smooth expand/collapse
  const handleToggleExpand = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    onToggleExpand();
  }, [onToggleExpand]);

  // Move up/down handlers
  const handleMoveUp = useCallback(() => {
    if (index > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext({
        duration: 250,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      onMove(index - 1);
    }
  }, [index, onMove]);

  const handleMoveDown = useCallback(() => {
    if (index < totalCount - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext({
        duration: 250,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      onMove(index + 1);
    }
  }, [index, totalCount, onMove]);

  // =========================================
  // EDIT MODE - Minimalist Layout with Up/Down Buttons
  // =========================================
  if (isEditMode) {
    return (
      <View style={styles.editCard}>
        {/* Row 1: Delete | Icon | Name | Up/Down Buttons */}
        <View style={styles.editCardRow}>
          {/* Delete button (iOS style) */}
          <Pressable style={styles.editDeleteButton} onPress={onDelete}>
            <Ionicons name="remove-circle" size={22} color={colors.status.error} />
          </Pressable>

          {/* Icon */}
          <View style={styles.editIcon}>
            <Ionicons
              name={(criterion.icon as keyof typeof Ionicons.glyphMap) || 'star-outline'}
              size={18}
              color={colors.accent.primary}
            />
          </View>

          {/* Name Input */}
          <TextInput
            style={styles.editNameInput}
            value={criterion.name}
            onChangeText={onUpdateName}
            placeholder="Criterion name"
            placeholderTextColor={colors.text.meta}
          />

          {/* Reorder Buttons */}
          <View style={styles.reorderButtons}>
            <Pressable
              style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
              onPress={handleMoveUp}
              disabled={index === 0}
            >
              <Ionicons
                name="chevron-up"
                size={16}
                color={index === 0 ? colors.text.meta : colors.text.secondary}
              />
            </Pressable>
            <Pressable
              style={[styles.reorderButton, index === totalCount - 1 && styles.reorderButtonDisabled]}
              onPress={handleMoveDown}
              disabled={index === totalCount - 1}
            >
              <Ionicons
                name="chevron-down"
                size={16}
                color={index === totalCount - 1 ? colors.text.meta : colors.text.secondary}
              />
            </Pressable>
          </View>
        </View>

        {/* Row 2: Description */}
        <TextInput
          style={styles.editDescriptionInput}
          value={criterion.description || ''}
          onChangeText={onUpdateDescription}
          placeholder="Add description..."
          placeholderTextColor={colors.text.meta}
          multiline
        />
      </View>
    );
  }

  // =========================================
  // NORMAL MODE - Full Layout with Slider
  // =========================================
  return (
    <View style={styles.criterionRow}>
      {/* Icon */}
      <View style={styles.criterionIcon}>
        <Ionicons
          name={(criterion.icon as keyof typeof Ionicons.glyphMap) || 'star-outline'}
          size={20}
          color={colors.accent.primary}
        />
      </View>

      {/* Content */}
      <View style={styles.criterionContent}>
        {/* Top Row: Name, Lock, Percentage */}
        <View style={styles.criterionTopRow}>
          <Text style={styles.criterionName}>{criterion.name}</Text>
          <View style={styles.criterionControls}>
            <Pressable onPress={onToggleLock} style={styles.lockButton}>
              <Ionicons
                name={criterion.isLocked ? 'lock-closed' : 'lock-open-outline'}
                size={16}
                color={criterion.isLocked ? colors.accent.primary : colors.text.meta}
              />
            </Pressable>
            <Text style={styles.criterionWeight}>{criterion.weight}%</Text>
          </View>
        </View>

        {/* Slider */}
        <WeightSlider
          value={criterion.weight}
          onChange={onWeightChange}
          isLocked={criterion.isLocked || false}
          isEditMode={false}
          width={sliderWidth}
          onSlidingStart={onSlidingStart}
          onSlidingEnd={onSlidingEnd}
        />

        {/* Bottom Row: Expand Button */}
        <View style={styles.bottomRow}>
          <Pressable onPress={handleToggleExpand} style={styles.expandButton}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.text.meta}
            />
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Hide description' : 'Show description'}
            </Text>
          </Pressable>
        </View>

        {/* Description (collapsible) */}
        {isExpanded && (
          <Text style={styles.criterionDescriptionReadOnly}>
            {criterion.description || 'No description'}
          </Text>
        )}
      </View>
    </View>
  );
};

// =========================================
// Weight Slider Component
// =========================================
interface WeightSliderProps {
  value: number;
  onChange: (value: number) => void;
  isLocked: boolean;
  isEditMode?: boolean;
  width: number;
  onSlidingStart?: () => void;
  onSlidingEnd?: () => void;
}

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;

const WeightSlider: React.FC<WeightSliderProps> = ({
  value,
  onChange,
  isLocked,
  isEditMode = false,
  width,
  onSlidingStart,
  onSlidingEnd,
}) => {
  // Slider is disabled if locked OR in edit mode
  const isDisabled = isLocked || isEditMode;
  // Track width is full width minus thumb size (so thumb stays within bounds)
  const trackWidth = width - THUMB_SIZE;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0); // Track Y for gesture direction detection
  const startValue = useRef(value);
  const lastReportedValue = useRef(value);
  const gestureDecided = useRef(false); // Have we decided if this is horizontal or vertical?

  // Convert value (1-100) to pixel position
  const valueToPosition = useCallback((val: number) => {
    // Map 1-100 to 0-trackWidth
    return ((val - 1) / 99) * trackWidth;
  }, [trackWidth]);

  // Convert pixel position to value (1-100) - unclamped for reporting
  const positionToValue = useCallback((pos: number) => {
    // Map 0-trackWidth to 1-100 (can go outside this range)
    return Math.round((pos / trackWidth) * 99 + 1);
  }, [trackWidth]);

  // Animated value for thumb position (in pixels)
  const thumbPositionPx = useRef(new RNAnimated.Value(valueToPosition(value))).current;

  // Update thumb position when value changes AND not dragging
  useEffect(() => {
    if (!isDragging.current) {
      RNAnimated.spring(thumbPositionPx, {
        toValue: valueToPosition(value),
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: false,
      }).start();
    }
  }, [value, valueToPosition, thumbPositionPx]);

  // Check if we should capture this gesture (horizontal movement)
  const shouldCaptureGesture = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (isDisabled) return false;

      const deltaX = Math.abs(evt.nativeEvent.pageX - startX.current);
      const deltaY = Math.abs(evt.nativeEvent.pageY - startY.current);

      // Only capture if horizontal movement is significantly greater than vertical
      // This allows vertical scrolling to pass through
      return deltaX > deltaY && deltaX > 5; // 5px threshold
    },
    [isDisabled]
  );

  const handleStartDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (isDisabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // Store initial position for gesture direction detection
      startX.current = evt.nativeEvent.pageX;
      startY.current = evt.nativeEvent.pageY;
      startValue.current = value;
      lastReportedValue.current = value;
      gestureDecided.current = false;
      isDragging.current = false; // Don't start dragging until we confirm horizontal
    },
    [isDisabled, value]
  );

  const handleMoveDrag = useCallback(
    (evt: { nativeEvent: { pageX: number; pageY: number } }) => {
      if (isDisabled) return;

      // If we haven't decided the gesture direction yet, check now
      if (!gestureDecided.current) {
        const deltaX = Math.abs(evt.nativeEvent.pageX - startX.current);
        const deltaY = Math.abs(evt.nativeEvent.pageY - startY.current);

        // Need at least 8px movement to decide
        if (deltaX < 8 && deltaY < 8) return;

        gestureDecided.current = true;

        // If vertical movement is greater, let scroll handle it
        if (deltaY >= deltaX) {
          isDragging.current = false;
          return;
        }

        // Horizontal! Start dragging
        isDragging.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSlidingStart?.();
      }

      if (!isDragging.current) return;

      const deltaX = evt.nativeEvent.pageX - startX.current;
      const startPosition = valueToPosition(startValue.current);
      const desiredPosition = startPosition + deltaX;
      const desiredValue = positionToValue(desiredPosition);

      // Report the desired value to parent (parent will clamp it)
      if (desiredValue !== lastReportedValue.current) {
        lastReportedValue.current = desiredValue;
        onChange(desiredValue);
      }

      // Apply rubber band resistance based on VALUE clamping, not position
      // The `value` prop is the clamped value from parent
      // If desiredValue differs from value, we're hitting a limit
      const actualPosition = valueToPosition(value);
      const maxOvershoot = 35; // Maximum visual overshoot in pixels (more flexible)

      let visualPosition: number;
      if (desiredValue > value + 1) {
        // Trying to go higher than allowed - show right overshoot
        const valueOvershoot = desiredValue - value;
        // sqrt gives diminishing returns, multiplier 3.5 for more flexibility
        const resistedOvershoot = Math.min(maxOvershoot, Math.sqrt(valueOvershoot) * 3.5);
        visualPosition = actualPosition + resistedOvershoot;
      } else if (desiredValue < value - 1) {
        // Trying to go lower than allowed - show left overshoot
        const valueOvershoot = value - desiredValue;
        const resistedOvershoot = Math.min(maxOvershoot, Math.sqrt(valueOvershoot) * 3.5);
        visualPosition = actualPosition - resistedOvershoot;
      } else {
        // Within bounds or value matches - position follows finger
        visualPosition = Math.max(0, Math.min(trackWidth, desiredPosition));
      }

      // Set thumb position with resistance applied
      thumbPositionPx.setValue(visualPosition);
    },
    [isDisabled, onChange, valueToPosition, positionToValue, trackWidth, thumbPositionPx, onSlidingStart, value]
  );

  const handleEndDrag = useCallback(() => {
    const wasDragging = isDragging.current;
    isDragging.current = false;
    gestureDecided.current = false;

    // Snap back to actual value position with spring animation
    RNAnimated.spring(thumbPositionPx, {
      toValue: valueToPosition(value),
      damping: 15,
      stiffness: 200,
      mass: 0.8,
      useNativeDriver: false,
    }).start();

    // Only call onSlidingEnd if we were actually dragging
    if (wasDragging) {
      onSlidingEnd?.();
    }
  }, [onSlidingEnd, thumbPositionPx, valueToPosition, value]);

  // Fill width is based on thumb position
  const fillWidth = thumbPositionPx.interpolate({
    inputRange: [0, trackWidth],
    outputRange: [0, trackWidth],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.sliderContainer, { width }, isDisabled && styles.sliderContainerLocked]}
      onStartShouldSetResponder={() => !isDisabled}
      onMoveShouldSetResponder={() => !isDisabled}
      onResponderGrant={handleStartDrag}
      onResponderMove={handleMoveDrag}
      onResponderRelease={handleEndDrag}
      onResponderTerminate={handleEndDrag}
      // Allow ScrollView to take over if we haven't started horizontal dragging
      onResponderTerminationRequest={() => !isDragging.current}
    >
      {/* Track Background */}
      <View style={[styles.sliderTrack, { width: trackWidth, marginLeft: THUMB_SIZE / 2 }]}>
        {/* Fill */}
        <RNAnimated.View
          style={[
            styles.sliderFill,
            { width: fillWidth },
            isDisabled && styles.sliderFillLocked,
          ]}
        />
      </View>

      {/* Thumb - positioned with left offset + translateX */}
      <RNAnimated.View
        style={[
          styles.sliderThumb,
          {
            left: 0,
            transform: [{ translateX: thumbPositionPx }],
          },
          isDisabled && styles.sliderThumbLocked,
        ]}
      />
    </View>
  );
};

// =========================================
// Styles
// =========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border.subtle,
    backgroundColor: colors.background.card,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
  },
  editButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    fontSize: 16,
    color: colors.accent.primary,
  },
  editButtonTextActive: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },

  // Templates
  section: {
    marginBottom: spacing.xl,
    zIndex: 10, // Ensure shadows are above other elements
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.base,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateCollapseButton: {
    padding: spacing.xs,
  },
  templatesScrollView: {
    overflow: 'visible', // Allow shadows to render outside bounds
  },
  templatesContainer: {
    paddingRight: spacing.lg,
    paddingVertical: spacing.sm, // Space for shadows above and below
    gap: spacing.sm,
  },
  templatesCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  templatesCollapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  templatesCollapsedText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    gap: spacing.sm,
    // Realistic shadow matching app card style
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
  },

  // Total Row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValueValid: {
    color: colors.status.success,
  },
  totalValueInvalid: {
    color: colors.status.error,
  },

  // Criteria List
  criteriaList: {
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  criterionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  criterionContent: {
    flex: 1,
  },
  criterionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  criterionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  criterionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lockButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criterionWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent.primary,
    minWidth: 44,
    textAlign: 'right',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  expandButtonText: {
    fontSize: 12,
    color: colors.text.meta,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  criterionDescriptionReadOnly: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background.page,
    borderRadius: radius.sm,
  },

  // Minimalist Edit Card
  editCard: {
    backgroundColor: colors.background.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  editCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editDeleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.accent.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.page,
    borderRadius: radius.sm,
  },
  editDescriptionInput: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.page,
    borderRadius: radius.sm,
    minHeight: 36,
  },
  reorderButtons: {
    flexDirection: 'row',
    backgroundColor: colors.background.page,
    borderRadius: radius.sm,
    gap: 2,
  },
  reorderButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },

  // Slider
  sliderContainer: {
    height: 32, // Enough height for thumb + touch area
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible', // Allow thumb to visually extend past bounds (rubber band)
  },
  sliderContainerLocked: {
    opacity: 0.5,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.border.subtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 3,
  },
  sliderFillLocked: {
    backgroundColor: colors.text.meta,
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.accent.primary,
    shadowColor: colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    top: 4, // Center vertically: (32 - 24) / 2 = 4
  },
  sliderThumbLocked: {
    borderColor: colors.text.meta,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  actionButtonSecondary: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent.primary,
  },

  // Bottom Buttons
  bottomButtons: {
    gap: spacing.base,
  },
  bottomButton: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  revertButton: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  revertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.border.subtle,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  saveButtonTextDisabled: {
    color: colors.text.meta,
  },
});
