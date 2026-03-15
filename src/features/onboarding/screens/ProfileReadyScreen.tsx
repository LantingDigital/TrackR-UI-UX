import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import {
  Canvas,
  Group,
  Path,
  Rect,
  Circle,
  BlurMask,
  RadialGradient,
  vec,
  Skia,
  usePathValue,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CX = SCREEN_W / 2;
const CY = SCREEN_H * 0.40;

// ─── Timing ─────────────────────────────────────────────────────────────────
const TUNNEL_DURATION = 4500;
const FADE_IN_DURATION = 1500;
const BLOOM_IN_DELAY = 4000;
const BLOOM_IN_DURATION = 600;
const CANVAS_HIDE_DELAY = 4600;
const BLOOM_OUT_DURATION = 600;
const TEXT_DELAY = 4800;
const TEXT_DURATION = 800;
const TOTAL_DURATION = 6600;

// ─── Track constants ────────────────────────────────────────────────────────
const RAIL_HALF = SCREEN_W * 1.2;    // rails from the sides of the phone
const RAIL_W = 14;                    // thick rail beams
const TRACK_BOTTOM = SCREEN_H * 0.70; // rails start at 70% down (where you liked it)
const NUM_TIES = 3;                   // close-up POV — only a few ties visible
const SCROLL_SPEED = 12;
const BRAND = colors.accent.primary; // #CF6769

// ─── Deterministic pseudo-random ────────────────────────────────────────────
const hash = (i: number, s: number): number => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ─── Streak config ──────────────────────────────────────────────────────────
interface StreakConfig {
  cos: number;
  sin: number;
  delay: number;
  duration: number;
  maxDist: number;
  startR: number;
  baseThickness: number;
  warmth: number;
  isWall: boolean;
}

// Wall lights — only ABOVE the track (negative sin = upward in screen coords)
const WALL_LIGHT_ANGLES = [
  -Math.PI / 6,               // upper-right
  -Math.PI / 3,               // upper-right steeper
  -Math.PI / 2.2,             // nearly straight up-right
  Math.PI + Math.PI / 6,      // upper-left
  Math.PI + Math.PI / 3,      // upper-left steeper
  Math.PI + Math.PI / 2.2,    // nearly straight up-left
  -Math.PI / 10,              // right side, slightly up
  Math.PI + Math.PI / 10,     // left side, slightly up
];

const WALL_LIGHTS: StreakConfig[] = WALL_LIGHT_ANGLES.map((angle, i) => ({
  cos: Math.cos(angle),
  sin: Math.sin(angle),
  delay: hash(i, 20) * 0.15,
  duration: 0.28 + hash(i, 21) * 0.14,
  maxDist: 280 + hash(i, 22) * 200,
  startR: 50 + hash(i, 23) * 40,
  baseThickness: 2.2 + hash(i, 24) * 1.6,
  warmth: 0.15 + hash(i, 25) * 0.5,
  isWall: true,
}));

// Center dashes — thin radial lines, only above the track (upper half)
const CENTER_DASHES: StreakConfig[] = Array.from({ length: 12 }, (_, i) => {
  // Angles only in upper semicircle (π to 2π in screen coords = upward)
  const angle = Math.PI + hash(i, 30) * Math.PI;
  return {
    cos: Math.cos(angle),
    sin: Math.sin(angle),
    delay: hash(i, 31) * 0.3,
    duration: 0.12 + hash(i, 32) * 0.16,
    maxDist: 50 + hash(i, 33) * 120,
    startR: 10 + hash(i, 34) * 30,
    baseThickness: 0.8 + hash(i, 35) * 0.7,
    warmth: hash(i, 36) < 0.3 ? 0.45 : 0.05,
    isWall: false,
  };
});

const ALL_STREAKS = [...WALL_LIGHTS, ...CENTER_DASHES];

// ─── Single streak — cycles continuously ────────────────────────────────────

const Streak = React.memo(({
  config,
  tunnel,
}: {
  config: StreakConfig;
  tunnel: SharedValue<number>;
}) => {
  const opacity = useDerivedValue(() => {
    'worklet';
    const raw = (tunnel.value - config.delay) / config.duration;
    if (raw < 0) return 0;
    const lp = raw - Math.floor(raw);
    const peak = config.isWall ? 0.8 : 0.55;
    if (lp < 0.08) return (lp / 0.08) * peak;
    if (lp > 0.8) return ((1 - lp) / 0.2) * peak;
    return peak;
  });

  const coreStroke = useDerivedValue(() => {
    'worklet';
    const raw = (tunnel.value - config.delay) / config.duration;
    if (raw < 0) return 0;
    const lp = raw - Math.floor(raw);
    return config.baseThickness * (config.isWall ? (0.4 + lp * 0.8) : (0.5 + lp * 0.5));
  });

  const haloStroke = useDerivedValue(() => {
    'worklet';
    return coreStroke.value * (config.isWall ? 2.5 : 2.0);
  });

  const streakPath = usePathValue((p) => {
    'worklet';
    const raw = (tunnel.value - config.delay) / config.duration;
    if (raw < 0) return;
    const lp = raw - Math.floor(raw);
    const farT = lp;
    const nearT = Math.max(0, lp - 0.25) / 0.75;
    const accel = 1 + tunnel.value * 1.5;
    const maxD = config.maxDist * accel;
    const near = config.startR + nearT * nearT * maxD;
    const far = config.startR + farT * farT * maxD;
    if (far - near < 0.5) return;
    p.moveTo(CX + config.cos * near, CY + config.sin * near);
    p.lineTo(CX + config.cos * far, CY + config.sin * far);
  });

  // Rose-tinted warm color (shifts toward brand #CF6769)
  const r = 255;
  const g = Math.round(255 - config.warmth * 152);
  const b = Math.round(255 - config.warmth * 150);
  const haloColor = `rgba(${r},${g},${b},${config.isWall ? 0.25 : 0.15})`;
  const coreColor = `rgba(${r},${g},${b},${config.isWall ? 0.85 : 0.65})`;
  const blurAmt = config.isWall ? 10 : 5;

  return (
    <>
      <Path
        path={streakPath}
        color={haloColor}
        style="stroke"
        strokeWidth={haloStroke}
        opacity={opacity}
      >
        <BlurMask blur={blurAmt} style="normal" />
      </Path>
      <Path
        path={streakPath}
        color={coreColor}
        style="stroke"
        strokeWidth={coreStroke}
        opacity={opacity}
      />
    </>
  );
});

// ─── Main component ─────────────────────────────────────────────────────────

interface ProfileReadyScreenProps {
  onComplete: () => void;
  displayName?: string;
}

export const ProfileReadyScreen: React.FC<ProfileReadyScreenProps> = ({
  onComplete,
  displayName,
}) => {
  const [isPageBg, setIsPageBg] = useState(false);
  const [showCanvas, setShowCanvas] = useState(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const tunnel = useSharedValue(0);
  const fadeIn = useSharedValue(1);
  const bloom = useSharedValue(0);
  const text = useSharedValue(0);

  const nameText = displayName || 'TrackR';

  // ─── Static rail paths (filled tapered triangles in brand color) ───
  const railsPath = useMemo(() => {
    const p = Skia.Path.Make();
    // Left rail — triangle from VP to bottom-left
    p.moveTo(CX, CY);
    p.lineTo(CX - RAIL_HALF - RAIL_W, TRACK_BOTTOM);
    p.lineTo(CX - RAIL_HALF + RAIL_W, TRACK_BOTTOM);
    p.close();
    // Right rail — triangle from VP to bottom-right
    p.moveTo(CX, CY);
    p.lineTo(CX + RAIL_HALF - RAIL_W, TRACK_BOTTOM);
    p.lineTo(CX + RAIL_HALF + RAIL_W, TRACK_BOTTOM);
    p.close();
    return p;
  }, []);

  // ─── Animated cross-ties (scroll toward camera, full track coverage) ─
  const tiesPath = usePathValue((p) => {
    'worklet';
    const N = NUM_TIES;
    // Ties extend past the screen, following the exact rail line geometry
    // Rails go from (CX, CY) to (CX ± RAIL_HALF, TRACK_BOTTOM)
    // At any Y between CY and TRACK_BOTTOM+, the rail X = CX ± RAIL_HALF * (y-CY)/(TRACK_BOTTOM-CY)
    const railH = TRACK_BOTTOM - CY;
    const tieExtent = SCREEN_H + 150 - CY; // how far ties extend in Y
    const scrollPhase = tunnel.value * SCROLL_SPEED;
    const frac = scrollPhase - Math.floor(scrollPhase);

    for (let i = 0; i <= N; i++) {
      const rawT = 1 - (i + frac) / (N + 1);
      if (rawT < -0.02 || rawT > 1.0) continue;

      const perspT = Math.sqrt(Math.max(0, rawT));
      const t = 1 - perspT; // 0 = VP, 1 = past bottom

      const y = CY + tieExtent * t;
      if (y < CY + 3 || y > SCREEN_H + 120) continue;

      // Tie width matches EXACTLY where the rails are at this Y
      const railT = (y - CY) / railH;
      const halfW = RAIL_HALF * railT;
      if (halfW < 0.5) continue;

      p.moveTo(CX - halfW, y);
      p.lineTo(CX + halfW, y);
    }
  });

  // ─── Animated derived values ───────────────────────────────────────

  // Ambient rose haze
  const ambientR = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.3, 0.6, 0.85, 1], [80, 250, 550, 950, 1500]);
  });

  // Central glow — rose-tinted
  const glowR = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.4, 0.7, 0.9, 1], [30, 100, 240, 520, 1000]);
  });

  // Bright core — grows to create approaching illusion
  const coreR = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.35, 0.6, 0.8, 0.93, 1], [4, 14, 38, 100, 240, 400]);
  });
  const coreDotR = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.4, 0.8, 1], [3, 7, 18, 45]);
  });
  const coreOpacity = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.05, 1], [0, 0.95, 0.95]);
  });

  // Track visibility (fades in, fades out near bloom)
  const trackOpacity = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0, 0.06, 0.68, 0.9, 1], [0, 0.85, 0.85, 0.15, 0]);
  });

  // Overexposure bloom
  const overexR = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0.7, 0.85, 0.95, 1], [0, 150, 550, 1200]);
  });
  const overexOpacity = useDerivedValue(() => {
    'worklet';
    return interpolate(tunnel.value, [0.7, 0.85, 0.95, 1], [0, 0.1, 0.4, 0.8]);
  });

  // Fade from black
  const fadeOpacity = useDerivedValue(() => {
    'worklet';
    return fadeIn.value;
  });

  useEffect(() => {
    const t = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timers.current.push(id);
      return id;
    };

    fadeIn.value = withTiming(0, {
      duration: FADE_IN_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });

    tunnel.value = withTiming(1, {
      duration: TUNNEL_DURATION,
      easing: Easing.in(Easing.quad),
    });

    t(() => {
      bloom.value = withTiming(1, {
        duration: BLOOM_IN_DURATION,
        easing: Easing.in(Easing.quad),
      });
    }, BLOOM_IN_DELAY);

    t(() => {
      setIsPageBg(true);
      setShowCanvas(false);
      bloom.value = withTiming(0, {
        duration: BLOOM_OUT_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, CANVAS_HIDE_DELAY);

    t(() => {
      text.value = withTiming(1, {
        duration: TEXT_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, TEXT_DELAY);

    t(() => onComplete(), TOTAL_DURATION);

    return () => timers.current.forEach(clearTimeout);
  }, []);

  // ─── Text styles ──────────────────────────────────────────────────

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value,
  }));

  const welcomeStyle = useAnimatedStyle(() => {
    const p = text.value;
    return {
      opacity: interpolate(p, [0, 0.5], [0, 1]),
      transform: [{ translateY: interpolate(p, [0, 0.5], [16, 0]) }],
    };
  });

  const nameStyle = useAnimatedStyle(() => {
    const p = text.value;
    return {
      opacity: interpolate(p, [0.1, 0.6], [0, 1]),
      transform: [{ translateY: interpolate(p, [0.1, 0.6], [20, 0]) }],
    };
  });

  const subtitleStyle = useAnimatedStyle(() => {
    const p = text.value;
    return {
      opacity: interpolate(p, [0.3, 0.8], [0, 0.6]),
      transform: [{ translateY: interpolate(p, [0.3, 0.8], [12, 0]) }],
    };
  });

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isPageBg ? colors.background.page : '#000000' },
      ]}
    >
      {showCanvas && (
        <Canvas style={StyleSheet.absoluteFill}>
          {/* 1. Ambient rose haze */}
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
            <RadialGradient
              c={vec(CX, CY)}
              r={ambientR}
              colors={[
                'rgba(180,90,92,0.22)',
                'rgba(120,60,62,0.08)',
                'transparent',
              ]}
              positions={[0, 0.4, 1]}
            />
          </Rect>

          {/* 2. Central glow — rose-tinted radial */}
          <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
            <RadialGradient
              c={vec(CX, CY)}
              r={glowR}
              colors={[
                'rgba(255,245,245,0.9)',
                'rgba(240,195,195,0.4)',
                'rgba(180,100,102,0.1)',
                'transparent',
              ]}
              positions={[0, 0.15, 0.4, 1]}
            />
          </Rect>

          {/* 3. Bright core */}
          <Group opacity={coreOpacity}>
            <Circle cx={CX} cy={CY} r={coreR} color="rgba(255,248,245,0.85)">
              <BlurMask blur={30} style="normal" />
            </Circle>
            <Circle cx={CX} cy={CY} r={coreDotR} color="white" />
          </Group>

          {/* 4. Track — rail glow (soft bloom around rails) */}
          <Path
            path={railsPath}
            color="rgba(207,103,105,0.2)"
            opacity={trackOpacity}
          >
            <BlurMask blur={8} style="normal" />
          </Path>

          {/* 5. Track — solid rails */}
          <Path
            path={railsPath}
            color={BRAND}
            opacity={trackOpacity}
          />

          {/* 6. Track — tie glow */}
          <Path
            path={tiesPath}
            color="rgba(207,103,105,0.18)"
            style="stroke"
            strokeWidth={16}
            opacity={trackOpacity}
          >
            <BlurMask blur={10} style="normal" />
          </Path>

          {/* 7. Track — tie shadow (bottom of cylinder) */}
          <Group transform={[{ translateY: 2 }]} opacity={trackOpacity}>
            <Path
              path={tiesPath}
              color="rgba(120,42,44,0.8)"
              style="stroke"
              strokeWidth={7}
            />
          </Group>

          {/* 8. Track — tie body */}
          <Path
            path={tiesPath}
            color={BRAND}
            style="stroke"
            strokeWidth={7}
            opacity={trackOpacity}
          />

          {/* 9. Track — tie highlight (top of cylinder — light catch) */}
          <Group transform={[{ translateY: -1.5 }]} opacity={trackOpacity}>
            <Path
              path={tiesPath}
              color="rgba(240,170,172,0.6)"
              style="stroke"
              strokeWidth={1.5}
            />
          </Group>

          {/* 8. Cycling light streaks */}
          {ALL_STREAKS.map((config, i) => (
            <Streak key={i} config={config} tunnel={tunnel} />
          ))}

          {/* 9. Overexposure bloom */}
          <Group opacity={overexOpacity}>
            <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H}>
              <RadialGradient
                c={vec(CX, CY)}
                r={overexR}
                colors={['rgba(255,255,255,0.6)', 'rgba(255,248,245,0.2)', 'transparent']}
                positions={[0, 0.4, 1]}
              />
            </Rect>
          </Group>

          {/* 10. Fade from black */}
          <Rect
            x={0}
            y={0}
            width={SCREEN_W}
            height={SCREEN_H}
            color="black"
            opacity={fadeOpacity}
          />
        </Canvas>
      )}

      {/* White bloom overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.bloomOverlay, bloomStyle]}
        pointerEvents="none"
      />

      {/* Text */}
      <View style={styles.textContainer} pointerEvents="none">
        <Animated.Text style={[styles.welcomeLabel, welcomeStyle]}>
          Welcome,
        </Animated.Text>
        <Animated.Text
          style={[styles.nameText, nameStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.65}
        >
          {nameText}
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your adventure starts now
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bloomOverlay: {
    backgroundColor: '#FFFFFF',
  },
  textContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SCREEN_H * 0.38,
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  welcomeLabel: {
    fontSize: typography.sizes.large,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  nameText: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.subtitle,
    fontWeight: typography.weights.regular,
    color: colors.text.meta,
    marginTop: spacing.lg,
    letterSpacing: 0.5,
  },
});
