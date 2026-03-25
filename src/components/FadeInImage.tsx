/**
 * FadeInImage — Drop-in replacement for <Image> that fades in on load.
 *
 * Solves the "gray loading" problem where card art shows a gray placeholder
 * before the image decode completes. Instead: starts invisible, fades to
 * target opacity over 250ms once the image is decoded and ready to paint.
 *
 * Usage: Replace <Image source={...} style={...} /> with
 *        <FadeInImage source={...} style={...} />
 *
 * Supports all standard Image props. The fade duration is 250ms (tunable).
 */

import React, { useCallback } from 'react';
import { ImageProps, ImageStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const FADE_DURATION = 250; // ms — within the 200-300ms range spec'd in onboarding-fixes.md

interface FadeInImageProps extends Omit<ImageProps, 'onLoad'> {
  /** Target opacity after load (defaults to 1). Useful for scattered card positions with fractional opacity. */
  targetOpacity?: number;
  /** Fade duration in ms (defaults to 250). */
  fadeDuration?: number;
  /** Skip the fade-in — render at full opacity immediately. Use when parent handles visibility. */
  skipFade?: boolean;
  /** Style — accepts both regular and animated image styles. */
  style?: StyleProp<ImageStyle>;
}

export const FadeInImage: React.FC<FadeInImageProps> = ({
  targetOpacity = 1,
  fadeDuration = FADE_DURATION,
  skipFade = false,
  style,
  ...imageProps
}) => {
  const opacity = useSharedValue(skipFade ? targetOpacity : 0);

  const onLoad = useCallback(() => {
    if (skipFade) return;
    opacity.value = withTiming(targetOpacity, {
      duration: fadeDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetOpacity, fadeDuration, skipFade]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Image
      {...imageProps}
      style={[style, animatedStyle]}
      onLoad={onLoad}
    />
  );
};
