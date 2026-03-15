import React, { useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { haptics } from '../../services/haptics';
import { OnboardingCardLanding } from './screens/OnboardingCardLanding';
import { OnboardingSearch } from './screens/OnboardingSearch';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ScreenDef {
  name: string;
  Component: React.FC<{ isActive: boolean }>;
}

const SCREENS: ScreenDef[] = [
  { name: 'Card Art Landing', Component: OnboardingCardLanding },
  { name: 'Search', Component: OnboardingSearch },
];

interface LandingDesignSamplerProps {
  onDismiss: () => void;
}

export const LandingDesignSampler: React.FC<LandingDesignSamplerProps> = ({ onDismiss }) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const activeIndexRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);

  // Bouncing chevron
  const chevronY = useSharedValue(0);

  useEffect(() => {
    chevronY.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    ));
    return () => cancelAnimation(chevronY);
  }, []);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: chevronY.value }],
  }));

  const handleScroll = useCallback((event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    const index = Math.round(offset / SCREEN_HEIGHT);
    if (index !== activeIndexRef.current && index >= 0 && index < SCREENS.length) {
      activeIndexRef.current = index;
      setActiveIndex(index);
      haptics.select();
    }
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Vertical snap pages */}
      <FlatList
        ref={flatListRef}
        data={SCREENS}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => `screen-${i}`}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
            <item.Component isActive={index === activeIndex} />
          </View>
        )}
      />

      {/* Skip button — top right */}
      <Pressable
        onPress={() => { haptics.tap(); onDismiss(); }}
        style={[styles.skipButton, { top: insets.top + spacing.lg }]}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* Bottom: static hint + bouncing chevron */}
      <View
        style={[styles.bottomOverlay, { paddingBottom: insets.bottom + spacing.lg }]}
        pointerEvents="box-none"
      >
        <Text style={styles.hint} pointerEvents="none">SCROLL TO EXPLORE</Text>

        <Pressable onLongPress={onDismiss} delayLongPress={1500}>
          <Animated.View style={chevronStyle}>
            <Ionicons name="chevron-down" size={20} color={colors.text.meta} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 100,
  },
  hint: {
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    letterSpacing: 1.5,
  },
  skipButton: {
    position: 'absolute',
    right: spacing.xl,
    zIndex: 100,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
});
