import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ParkPOI, POIType, ThrillLevel } from '../types';
import { getEnrichedCoaster } from '../data/coasterDetailData';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { SPRINGS, TIMING } from '../../../constants/animations';

const CARD_HEIGHT = 280;

/** Exported so sibling components (e.g. MapControls) can position relative to the card */
export const INFO_CARD_HEIGHT = CARD_HEIGHT;

const TYPE_ICONS: Record<POIType, string> = {
  ride: '\u{1F3A2}', food: '\u{1F355}', shop: '\u{1F6CD}',
  theater: '\u{1F3AD}', attraction: '\u{1F4F8}', service: '\u{1F6BB}',
};

const AREA_LABELS: Record<string, string> = {
  'camp-snoopy': 'Camp Snoopy', 'fiesta-village': 'Fiesta Village',
  'boardwalk': 'Boardwalk', 'ghost-town': 'Ghost Town',
  'california-marketplace': 'California Marketplace', 'western-trails': 'Western Trails',
};

const THRILL_COLORS: Record<ThrillLevel, string> = {
  low: '#28A745', mild: '#8BC34A', moderate: '#F9A825', high: '#FF9800', aggressive: '#DC3545',
};

const THRILL_LABELS: Record<ThrillLevel, string> = {
  low: 'Low', mild: 'Mild', moderate: 'Moderate', high: 'High', aggressive: 'Aggressive',
};

// ============================================
// Helpers
// ============================================

function formatHeight(req: ParkPOI['heightRequirement']): string {
  if (!req) return '';
  const parts: string[] = [];
  if (req.min) parts.push(`Min ${req.min}" solo`);
  if (req.withCompanion) parts.push(`${req.withCompanion}" with companion`);
  if (req.max) parts.push(`Max ${req.max}"`);
  return parts.join(', ');
}

// ============================================
// MapInfoCard
// ============================================

interface MapInfoCardProps {
  poi: ParkPOI | null;
  onClose: () => void;
  onNavigate?: (poi: ParkPOI) => void;
  onViewDetails?: (poiId: string) => void;
}

export function MapInfoCard({ poi, onClose, onNavigate, onViewDetails }: MapInfoCardProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(CARD_HEIGHT + insets.bottom + 40);
  const isAnimating = useRef(false);
  const currentPoi = useRef<ParkPOI | null>(null);

  const handleAnimationEnd = useCallback(() => { isAnimating.current = false; }, []);

  useEffect(() => {
    if (poi) {
      currentPoi.current = poi;
      isAnimating.current = true;
      translateY.value = withSpring(0, SPRINGS.responsive, (finished) => {
        if (finished) runOnJS(handleAnimationEnd)();
      });
    } else {
      isAnimating.current = true;
      translateY.value = withTiming(CARD_HEIGHT + insets.bottom + 40, { duration: TIMING.fast }, (finished) => {
        if (finished) runOnJS(handleAnimationEnd)();
      });
    }
  }, [poi, translateY, insets.bottom, handleAnimationEnd]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  const handleNavigate = useCallback(() => {
    if (currentPoi.current && onNavigate) onNavigate(currentPoi.current);
  }, [onNavigate]);

  const handleViewDetails = useCallback(() => {
    if (currentPoi.current && onViewDetails) onViewDetails(currentPoi.current.id);
  }, [onViewDetails]);

  // Keep content visible during slide-out animation
  const displayPoi = poi ?? currentPoi.current;
  if (!displayPoi) return null;

  return (
    <Animated.View style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }, animatedStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>{TYPE_ICONS[displayPoi.type]}</Text>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={2}>{displayPoi.name}</Text>
          <View style={styles.areaPill}>
            <Text style={styles.areaLabel}>{AREA_LABELS[displayPoi.area] ?? displayPoi.area}</Text>
          </View>
          {displayPoi.approximateLocation && (
            <View style={styles.approxRow}>
              <Ionicons name="location-outline" size={11} color={colors.text.meta} />
              <Text style={styles.approxLabel}>Approximate location</Text>
            </View>
          )}
        </View>
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}>
          <Ionicons name="close" size={18} color={colors.text.secondary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        {displayPoi.type === 'ride' && <RideDetails poi={displayPoi} />}
        {displayPoi.type === 'food' && <FoodDetails poi={displayPoi} />}
        {(displayPoi.type === 'shop' || displayPoi.type === 'theater' || displayPoi.type === 'attraction') &&
          displayPoi.description && <Text style={styles.description}>{displayPoi.description}</Text>}
        {displayPoi.type === 'service' && displayPoi.description && (
          <Text style={styles.description}>{displayPoi.description}</Text>
        )}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {onViewDetails && displayPoi.type === 'ride' &&
          !!getEnrichedCoaster(displayPoi.coasterId || displayPoi.id) && (
          <Pressable onPress={handleViewDetails} style={styles.detailsButton}>
            <Ionicons name="stats-chart" size={14} color={colors.accent.primary} />
            <Text style={styles.detailsLabel}>View Details</Text>
          </Pressable>
        )}
        {onNavigate && (
          <Pressable onPress={handleNavigate} style={styles.navigateButton}>
            <Ionicons name="navigate-outline" size={16} color={colors.text.inverse} />
            <Text style={styles.navigateLabel}>Navigate Here</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================
// Sub-components
// ============================================

function RideDetails({ poi }: { poi: ParkPOI }) {
  const req = poi.heightRequirement;
  return (
    <View style={styles.detailsContainer}>
      {poi.thrillLevel && (
        <View style={[styles.badge, { backgroundColor: THRILL_COLORS[poi.thrillLevel] + '18' }]}>
          <View style={[styles.badgeDot, { backgroundColor: THRILL_COLORS[poi.thrillLevel] }]} />
          <Text style={[styles.badgeText, { color: THRILL_COLORS[poi.thrillLevel] }]}>
            {THRILL_LABELS[poi.thrillLevel]} Thrill
          </Text>
        </View>
      )}
      {req && (
        <View style={styles.detailRow}>
          <Ionicons name="resize-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.detailText}>{formatHeight(req)}</Text>
        </View>
      )}
      {poi.fastLaneEligible && (
        <View style={[styles.badge, { backgroundColor: 'rgba(255,152,0,0.12)' }]}>
          <Ionicons name="flash" size={12} color="#FF9800" />
          <Text style={[styles.badgeText, { color: '#FF9800' }]}>Fast Lane Eligible</Text>
        </View>
      )}
      {poi.waitTimeMinutes != null && (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
          <Text style={styles.detailText}>{poi.waitTimeMinutes} min wait</Text>
        </View>
      )}
      {poi.underConstruction && (
        <View style={[styles.badge, { backgroundColor: colors.banner.warningBg }]}>
          <Text style={{ fontSize: 11 }}>{'\u{1F6A7}'}</Text>
          <Text style={[styles.badgeText, { color: colors.banner.warningText, fontWeight: typography.weights.medium }]}>
            Under Construction
          </Text>
        </View>
      )}
    </View>
  );
}

function FoodDetails({ poi }: { poi: ParkPOI }) {
  return (
    <View style={styles.detailsContainer}>
      {poi.menuDescription && <Text style={styles.description}>{poi.menuDescription}</Text>}
      <View style={styles.badgeRow}>
        {poi.servesAlcohol && (
          <View style={[styles.badge, { backgroundColor: 'rgba(156,39,176,0.10)' }]}>
            <Text style={[styles.badgeText, { color: '#9C27B0', fontWeight: typography.weights.medium }]}>
              Serves Alcohol
            </Text>
          </View>
        )}
        {poi.openSelectDays && (
          <View style={[styles.badge, { backgroundColor: 'rgba(33,150,243,0.10)' }]}>
            <Text style={[styles.badgeText, { color: '#2196F3', fontWeight: typography.weights.medium }]}>
              Open Select Days
            </Text>
          </View>
        )}
      </View>
      {poi.menuItems && poi.menuItems.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginTop: spacing.xs }} contentContainerStyle={{ gap: spacing.sm }}>
          {poi.menuItems.map((item) => (
            <View key={item} style={styles.menuPill}>
              <Text style={styles.menuPillText}>{item}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background.card,
    borderTopLeftRadius: radius.modal, borderTopRightRadius: radius.modal,
    paddingTop: spacing.lg, paddingHorizontal: spacing.xl,
    minHeight: CARD_HEIGHT, ...shadows.modal,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerIcon: { fontSize: 28, marginRight: spacing.base, marginTop: 2 },
  headerText: { flex: 1 },
  name: {
    fontSize: typography.sizes.large, fontWeight: typography.weights.semibold,
    color: colors.text.primary, lineHeight: typography.sizes.large * typography.lineHeights.tight,
  },
  areaPill: {
    alignSelf: 'flex-start', backgroundColor: colors.accent.primaryLight,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  areaLabel: { fontSize: typography.sizes.small, fontWeight: typography.weights.medium, color: colors.accent.primary },
  approxRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs,
  },
  approxLabel: {
    fontSize: typography.sizes.small, color: colors.text.meta, fontStyle: 'italic',
  },
  closeButton: {
    width: 32, height: 32, borderRadius: radius.closeButton,
    backgroundColor: colors.background.input, alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.md,
  },
  content: { marginTop: spacing.base, maxHeight: 140 },
  detailsContainer: { gap: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: typography.sizes.caption, color: colors.text.secondary, fontWeight: typography.weights.regular },
  description: {
    fontSize: typography.sizes.caption, color: colors.text.secondary,
    lineHeight: typography.sizes.caption * typography.lineHeights.relaxed,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: spacing.xs, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: typography.sizes.small, fontWeight: typography.weights.semibold },
  menuPill: { backgroundColor: colors.background.input, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  menuPillText: { fontSize: typography.sizes.small, fontWeight: typography.weights.regular, color: colors.text.secondary, textTransform: 'capitalize' },
  buttonRow: {
    flexDirection: 'row', gap: spacing.md, marginTop: spacing.base,
  },
  detailsButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.background.input, borderRadius: radius.button,
    paddingVertical: spacing.base,
  },
  detailsLabel: {
    fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, color: colors.accent.primary,
  },
  navigateButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.accent.primary, borderRadius: radius.button,
    paddingVertical: spacing.base,
  },
  navigateLabel: { fontSize: typography.sizes.label, fontWeight: typography.weights.semibold, color: colors.text.inverse },
});
