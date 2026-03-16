/**
 * WaitTimesSection — Composed wait times experience for ParksScreen.
 * Header (LIVE badge + sort controls) → Favorites → Full list.
 * Manages sort/filter state internally.
 */
import React, { memo, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WaitTimesHeader, SortMode } from './WaitTimesHeader';
import { WaitTimesFavorites } from './WaitTimesFavorites';
import { WaitTimesList } from './WaitTimesList';
import { spacing } from '../../../../theme/spacing';
import { RideWaitTimeData } from '../../types';

interface WaitTimesSectionProps {
  rides: RideWaitTimeData[];
  lastUpdated: number;
  onRidePress?: (rideId: string) => void;
}

export const WaitTimesSection = memo(function WaitTimesSection({
  rides,
  lastUpdated,
  onRidePress,
}: WaitTimesSectionProps) {
  const [sortMode, setSortMode] = useState<SortMode>('waitTime');
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const toggleOpenOnly = useCallback(() => setShowOpenOnly((v) => !v), []);

  // Counts
  const openCount = useMemo(() => rides.filter((r) => r.status === 'open').length, [rides]);

  // Featured rides: top 3 open rides by wait time
  const featured = useMemo(() => {
    return rides
      .filter((r) => r.status === 'open')
      .sort((a, b) => b.waitMinutes - a.waitMinutes)
      .slice(0, 3);
  }, [rides]);

  // Sorted + filtered ride list
  const displayedRides = useMemo(() => {
    let result = showOpenOnly ? rides.filter((r) => r.status === 'open') : [...rides];

    if (sortMode === 'waitTime') {
      // Open rides first (by wait desc), then closed
      result.sort((a, b) => {
        const aOpen = a.status === 'open' ? 1 : 0;
        const bOpen = b.status === 'open' ? 1 : 0;
        if (aOpen !== bOpen) return bOpen - aOpen;
        return b.waitMinutes - a.waitMinutes;
      });
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [rides, sortMode, showOpenOnly]);

  if (rides.length === 0) return null;

  return (
    <View style={styles.container}>
      <WaitTimesHeader
        lastUpdated={lastUpdated}
        sortMode={sortMode}
        onSortChange={setSortMode}
        openCount={openCount}
        totalCount={rides.length}
        showOpenOnly={showOpenOnly}
        onToggleOpenOnly={toggleOpenOnly}
      />

      <View style={styles.gap} />

      <WaitTimesFavorites rides={featured} onRidePress={onRidePress} />

      <View style={styles.gap} />

      <WaitTimesList rides={displayedRides} onRidePress={onRidePress} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // No horizontal padding — children manage their own
  },
  gap: {
    height: spacing.lg,
  },
});
