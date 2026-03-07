import React, { memo, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { ProgressRing } from './ProgressRing';
import { WeatherData, StepsData } from '../data/mockDashboardData';

// ============================================
// Weather icon helpers
// ============================================

const ICON_COLORS: Record<string, string> = {
  sunny: '#F9A825',
  'partly-sunny': '#F9A825',
  cloud: '#999999',
  rainy: '#5B8DEF',
};

function weatherIconName(icon: string): string {
  // Use outline variants for a cleaner look
  return `${icon}-outline`;
}

function weatherIconColor(icon: string): string {
  return ICON_COLORS[icon] ?? '#F9A825';
}

// ============================================
// Component
// ============================================

interface WeatherStepsHeaderProps {
  weather: WeatherData;
  steps: StepsData;
}

export const WeatherStepsHeader = memo(function WeatherStepsHeader({ weather, steps }: WeatherStepsHeaderProps) {
  // Animate ring from 0 on each screen focus
  const [ringProgress, setRingProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Short delay so the ring sweep is visible after the screen settles
      const timer = setTimeout(() => {
        setRingProgress(Math.min(steps.current / steps.goal, 1));
      }, 400);

      return () => {
        clearTimeout(timer);
        setRingProgress(0);
      };
    }, [steps.current, steps.goal]),
  );

  return (
    <View style={styles.row}>
      {/* Current weather */}
      <View style={styles.currentWeather}>
        <Ionicons
          name={weatherIconName(weather.icon) as any}
          size={20}
          color={weatherIconColor(weather.icon)}
        />
        <Text style={styles.currentTemp}>{weather.currentTempF}°</Text>
      </View>

      <View style={styles.separator} />

      {/* Hourly forecast — scrollable carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hourlyScroll}
        contentContainerStyle={styles.hourlyContent}
      >
        {weather.hourly.map((h) => (
          <View key={h.hour} style={styles.hourlyPill}>
            <Ionicons
              name={weatherIconName(h.icon) as any}
              size={14}
              color={weatherIconColor(h.icon)}
            />
            <Text style={styles.hourLabel}>{h.hour}</Text>
            <Text style={styles.hourTemp}>{h.tempF}°</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.separator} />

      {/* Steps */}
      <View style={styles.stepsGroup}>
        <View style={styles.ringContainer}>
          <ProgressRing progress={ringProgress} size={36} strokeWidth={3} />
          <View style={styles.ringIcon}>
            <Ionicons name="footsteps-outline" size={13} color={colors.accent.primary} />
          </View>
        </View>
        <Text style={styles.stepsText}>{steps.current.toLocaleString()}</Text>
      </View>
    </View>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  currentWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  currentTemp: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  separator: {
    width: 1,
    height: 20,
    backgroundColor: colors.border.subtle,
    marginHorizontal: spacing.md,
    flexShrink: 0,
  },
  hourlyScroll: {
    flex: 1,
  },
  hourlyContent: {
    gap: spacing.base,
    alignItems: 'center',
  },
  hourlyPill: {
    alignItems: 'center',
    gap: 2,
  },
  hourLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
  },
  hourTemp: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  stepsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 0,
  },
  ringContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringIcon: {
    position: 'absolute',
  },
  stepsText: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
});
