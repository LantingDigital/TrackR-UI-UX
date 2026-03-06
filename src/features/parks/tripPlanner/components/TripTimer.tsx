// ============================================
// Trip Timer — Isolated timer component
//
// Owns its own setInterval. Re-renders 1/sec
// WITHOUT cascading to parent. Parent passes
// stable props: startTime + mode.
// ============================================

import React, { memo, useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';

import { colors } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';

// ============================================
// Props
// ============================================

interface TripTimerProps {
  startTime: number; // epoch ms
  mode: 'countdown' | 'countup';
  durationSec?: number; // only for countdown mode
}

// ============================================
// Formatting
// ============================================

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

// ============================================
// Component
// ============================================

function TripTimerInner({ startTime, mode, durationSec = 0 }: TripTimerProps) {
  const [display, setDisplay] = useState('0:00');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (mode === 'countdown') {
        setDisplay(formatTime(Math.max(0, durationSec - elapsed)));
      } else {
        setDisplay(formatTime(elapsed));
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, mode, durationSec]);

  return <Text style={styles.timer}>{display}</Text>;
}

export const TripTimer = memo(TripTimerInner);

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  timer: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.accent.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    textAlign: 'center',
  },
});
