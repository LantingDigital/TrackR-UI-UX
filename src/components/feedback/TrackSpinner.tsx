/**
 * TrackSpinner — 3-car coaster train orbiting inside a spinning track
 *
 * Each car is a rigid body (rect + wheels) placed tangent to the
 * circle. Cars bend at the couplings between them. The train
 * orbits counterclockwise while the dashed track spins clockwise.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Rect, G, Path } from 'react-native-svg';
import { colors } from '../../theme/colors';

// ─── Geometry (48×48 viewBox) ─────────────────────────────
const VB = 48;
const CX = VB / 2;
const CY = VB / 2;
const R_RING = VB * 0.42;
const STROKE = Math.max(2, VB * 0.05);
const R_CAR = R_RING - 1.5;

// Car shape
const CAR_LEN = 6.5;
const BODY_H = 2.8;
const WHEEL_R = 0.8;
const W_SPACE = 3.2;
const BODY_OFF = WHEEL_R + 0.3; // gap: wheel center → body bottom

// Angular spacing (degrees)
const carArc = (CAR_LEN / R_CAR) * (180 / Math.PI);
const gapArc = (2 / R_CAR) * (180 / Math.PI);
const STEP = carArc + gapArc;
const CAR_ANGLES = [0, STEP, STEP * 2];

// Track dash
const DASH = VB * 0.13;
const DASH_GAP = VB * 0.065;

interface TrackSpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
}

export function TrackSpinner({
  size = 48,
  color = colors.accent.primary,
  trackColor = colors.border.subtle,
}: TrackSpinnerProps) {
  const trainAngle = useSharedValue(0);
  const ringAngle = useSharedValue(0);

  useEffect(() => {
    trainAngle.value = withRepeat(
      withSequence(
        // Brief coast past the top
        withTiming(-30, {
          duration: 230,
          easing: Easing.linear,
        }),
        // Accelerate → bottom → decelerate back to top
        withTiming(-360, {
          duration: 1170,
          easing: Easing.bezier(0.22, 0.15, 0.75, 0.88),
        }),
      ),
      -1,
      false,
    );
    ringAngle.value = withRepeat(
      withTiming(360, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${trainAngle.value}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringAngle.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      {/* Track ring — dashed, rotates CW */}
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          <Circle
            cx={CX}
            cy={CY}
            r={R_RING}
            stroke={trackColor}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${DASH} ${DASH_GAP}`}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* 3-car train — CCW orbit inside ring */}
      <Animated.View style={[StyleSheet.absoluteFill, trainStyle]}>
        <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
          {CAR_ANGLES.map((θ, i) => {
            const rad = (θ * Math.PI) / 180;
            const px = CX + R_CAR * Math.sin(rad);
            const py = CY - R_CAR * Math.cos(rad);
            const rot = 180 + θ;
            return (
              <G
                key={i}
                transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})`}
              >
                {/* Undercarriage bar — links wheel bogeys */}
                <Rect
                  x={-W_SPACE / 2 - 0.3}
                  y={-(WHEEL_R + 0.4)}
                  width={W_SPACE + 0.6}
                  height={0.4}
                  fill={color}
                />
                {/* Frame/chassis — wider base section */}
                <Rect
                  x={-CAR_LEN / 2 - 0.2}
                  y={-(BODY_OFF + 0.8)}
                  width={CAR_LEN + 0.4}
                  height={0.8}
                  rx={0.2}
                  fill={color}
                />
                {/* Body — main car body (narrower than chassis) */}
                <Rect
                  x={-CAR_LEN / 2}
                  y={-(BODY_OFF + BODY_H)}
                  width={CAR_LEN}
                  height={BODY_H - 0.8}
                  rx={0.5}
                  fill={color}
                />
                {/* Windshield — angled front cowling */}
                <Path
                  d={`M${CAR_LEN / 2} ${-(BODY_OFF + BODY_H)} L${CAR_LEN / 2 + 1.0} ${-(BODY_OFF + BODY_H * 0.5)} L${CAR_LEN / 2} ${-(BODY_OFF + BODY_H * 0.5)} Z`}
                  fill={color}
                />
                {/* Wheels */}
                <Circle cx={-W_SPACE / 2} cy={0} r={WHEEL_R} fill={color} />
                <Circle cx={W_SPACE / 2} cy={0} r={WHEEL_R} fill={color} />
                {/* Wheel hubs */}
                <Circle cx={-W_SPACE / 2} cy={0} r={WHEEL_R * 0.35} fill={trackColor} />
                <Circle cx={W_SPACE / 2} cy={0} r={WHEEL_R * 0.35} fill={trackColor} />
              </G>
            );
          })}
          {/* Coupling bars between cars */}
          {CAR_ANGLES.slice(0, -1).map((_, i) => {
            const midθ = (CAR_ANGLES[i] + CAR_ANGLES[i + 1]) / 2;
            const rad = (midθ * Math.PI) / 180;
            const px = CX + R_CAR * Math.sin(rad);
            const py = CY - R_CAR * Math.cos(rad);
            const rot = 180 + midθ;
            return (
              <G
                key={`c${i}`}
                transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${rot.toFixed(1)})`}
              >
                <Rect
                  x={-0.8}
                  y={-(BODY_OFF + BODY_H * 0.5 + 0.3)}
                  width={1.6}
                  height={0.6}
                  rx={0.2}
                  fill={color}
                />
              </G>
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}
