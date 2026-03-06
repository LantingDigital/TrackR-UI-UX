/**
 * ConfettiBurst — Lightweight confetti particle effect
 *
 * Driven by a single shared value (0→1). Pre-computes 14 particles
 * with random trajectories, colors, and rotations. Gravity pulls
 * particles downward as progress advances.
 *
 * Usage:
 *   const progress = useSharedValue(0);
 *   progress.value = withTiming(1, { duration: 700 });
 *   <ConfettiBurst progress={progress} />
 */

import React, { useMemo, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';

// ── Config ──────────────────────────────────────

const PARTICLE_COUNT = 14;
const GRAVITY = 120; // px downward at t=1
const COLORS = ['#4CAF50', '#66BB6A', '#CF6769', '#E8A849', '#D4A853', '#A5D6A7'];

interface ParticleData {
  angle: number;      // radians, full 360°
  distance: number;   // how far it travels (40–80)
  color: string;
  width: number;      // 4–8
  height: number;     // 6–12
  rotation: number;   // ±180° total rotation
  delay: number;      // 0–0.15 stagger
}

// Seeded-ish random using index — deterministic across renders
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function buildParticles(): ParticleData[] {
  const particles: ParticleData[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r1 = seededRandom(i * 7 + 1);
    const r2 = seededRandom(i * 7 + 2);
    const r3 = seededRandom(i * 7 + 3);
    const r4 = seededRandom(i * 7 + 4);
    const r5 = seededRandom(i * 7 + 5);
    const r6 = seededRandom(i * 7 + 6);

    particles.push({
      angle: r1 * Math.PI * 2,
      distance: 40 + r2 * 40,
      color: COLORS[Math.floor(r3 * COLORS.length)],
      width: 4 + r4 * 4,
      height: 6 + r5 * 6,
      rotation: (r6 - 0.5) * 360,
      delay: r1 * 0.15,
    });
  }
  return particles;
}

// ── Particle sub-component ──────────────────────

interface ParticleProps {
  data: ParticleData;
  progress: SharedValue<number>;
}

const Particle = memo(function Particle({ data, progress }: ParticleProps) {
  const { angle, distance, color, width, height, rotation, delay } = data;

  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    // Effective t with per-particle delay
    const raw = (progress.value - delay) / (1 - delay);
    const t = Math.max(0, Math.min(1, raw));

    if (t === 0) {
      return { opacity: 0 };
    }

    const x = sinA * distance * t;
    const y = -cosA * distance * t + GRAVITY * t * t;

    const opacity = t < 0.6 ? 1 : interpolate(t, [0.6, 1], [1, 0], Extrapolation.CLAMP);

    const scale = t < 0.3
      ? interpolate(t, [0, 0.3], [0.3, 1], Extrapolation.CLAMP)
      : interpolate(t, [0.3, 1], [1, 0.4], Extrapolation.CLAMP);

    const rot = rotation * t;

    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate: `${rot}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width,
          height,
          backgroundColor: color,
          borderRadius: 2,
        },
        animStyle,
      ]}
    />
  );
});

// ── ConfettiBurst ───────────────────────────────

interface ConfettiBurstProps {
  progress: SharedValue<number>;
  size?: number;
}

export default function ConfettiBurst({ progress }: ConfettiBurstProps) {
  const particles = useMemo(() => buildParticles(), []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} data={p} progress={progress} />
      ))}
    </View>
  );
}

// ── Styles ──────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
  },
});
