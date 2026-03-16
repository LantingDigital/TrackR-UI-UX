/**
 * WaitTimesList — Renders a vertical stack of WaitTimesCard components.
 * Receives pre-sorted data; sort logic lives in WaitTimesSection.
 */
import React, { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WaitTimesCard } from './WaitTimesCard';
import { spacing } from '../../../../theme/spacing';
import { RideWaitTimeData } from '../../types';

interface WaitTimesListProps {
  rides: RideWaitTimeData[];
  onRidePress?: (rideId: string) => void;
}

export const WaitTimesList = memo(function WaitTimesList({
  rides,
  onRidePress,
}: WaitTimesListProps) {
  return (
    <View style={styles.container}>
      {rides.map((ride, index) => (
        <WaitTimesCardWrapper
          key={ride.id}
          ride={ride}
          index={index}
          onRidePress={onRidePress}
        />
      ))}
    </View>
  );
});

/**
 * Stable onPress wrapper — prevents WaitTimesCard re-renders
 * from parent function ref changes.
 */
const WaitTimesCardWrapper = memo(function WaitTimesCardWrapper({
  ride,
  index,
  onRidePress,
}: {
  ride: RideWaitTimeData;
  index: number;
  onRidePress?: (rideId: string) => void;
}) {
  const handlePress = useCallback(
    () => onRidePress?.(ride.id),
    [onRidePress, ride.id],
  );

  return (
    <WaitTimesCard
      ride={ride}
      index={index}
      onPress={onRidePress ? handlePress : undefined}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
});
