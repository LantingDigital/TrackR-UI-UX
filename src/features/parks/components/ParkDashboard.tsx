import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../../theme/spacing';
import { WeatherStepsHeader } from './WeatherStepsHeader';
import { WaitTimesCard } from './WaitTimesCard';
import {
  WeatherData,
  StepsData,
  RideWaitTime,
} from '../data/mockDashboardData';

interface ParkDashboardProps {
  weather: WeatherData;
  steps: StepsData;
  waitTimes: RideWaitTime[];
  onRidePress?: (rideId: string) => void;
}

export const ParkDashboard = memo(function ParkDashboard({
  weather,
  steps,
  waitTimes,
  onRidePress,
}: ParkDashboardProps) {
  return (
    <View style={styles.container}>
      <WeatherStepsHeader weather={weather} steps={steps} />
      <View style={styles.gap} />
      <WaitTimesCard waitTimes={waitTimes} onRidePress={onRidePress} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
  },
  gap: {
    height: spacing.base,
  },
});
