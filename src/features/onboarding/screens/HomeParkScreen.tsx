import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolateColor,
  interpolate,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { colors } from '../../../theme/colors';

const ACCENT = colors.accent.primary;

// Popular parks for quick selection
const POPULAR_PARKS = [
  'Cedar Point',
  'Six Flags Magic Mountain',
  'Kings Island',
  'Busch Gardens Tampa Bay',
  'Universal Orlando',
  'Dollywood',
  'Hersheypark',
  'Carowinds',
  'Six Flags Great Adventure',
  'Kennywood',
  'Silver Dollar City',
  'Knott\'s Berry Farm',
  'Universal Studios Hollywood',
  'SeaWorld Orlando',
  'Kings Dominion',
  'Six Flags Over Texas',
  'Busch Gardens Williamsburg',
  'Worlds of Fun',
  'Six Flags Fiesta Texas',
  'Valleyfair',
  'Disneyland',
  'Walt Disney World',
  'Europa-Park',
  'Phantasialand',
  'Alton Towers',
  'Thorpe Park',
  'PortAventura',
  'Epic Universe',
];

interface HomeParkScreenProps {
  selectedPark: string | null;
  onSelect: (park: string | null) => void;
  onContinue: () => void;
  onSkip: () => void;
}

// Animated park row with spring selection feedback
const AnimatedParkItem: React.FC<{
  park: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}> = ({ park, isSelected, onPress, index }) => {
  const selectionProgress = useSharedValue(isSelected ? 1 : 0);
  const scale = useSharedValue(isSelected ? 1.02 : 1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.02 : 1, {
      damping: 22,
      stiffness: 220,
      mass: 0.8,
    });
    selectionProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isSelected]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['transparent', `${ACCENT}14`],
    ),
    borderColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['transparent', `${ACCENT}40`],
    ),
  }));

  const iconColor = useAnimatedStyle(() => ({
    opacity: interpolate(selectionProgress.value, [0, 1], [0.4, 1]),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [{ scale: interpolate(selectionProgress.value, [0, 1], [0.5, 1]) }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(250).delay(Math.min(index * 30, 300))}>
      <Pressable onPress={onPress}>
        <Animated.View style={[styles.parkItem, containerStyle]}>
          <Animated.View style={iconColor}>
            <Ionicons
              name={isSelected ? 'location' : 'location-outline'}
              size={20}
              color={isSelected ? ACCENT : colors.text.meta}
            />
          </Animated.View>
          <View style={styles.parkNameContainer}>
            <Text
              style={[
                styles.parkName,
                isSelected && styles.parkNameSelected,
              ]}
              numberOfLines={1}
            >
              {park}
            </Text>
          </View>
          <Animated.View style={[styles.parkCheck, checkStyle]}>
            <Ionicons name="checkmark" size={14} color={colors.text.inverse} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export const HomeParkScreen: React.FC<HomeParkScreenProps> = ({
  selectedPark,
  onSelect,
  onContinue,
  onSkip,
}) => {
  const insets = useSafeAreaInsets();
  const ctaPress = useStrongPress({ disabled: !selectedPark });
  const skipPress = useStrongPress();
  const [searchQuery, setSearchQuery] = useState('');

  // Entrance animations — staggered cascade
  const iconOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);
  const searchOpacity = useSharedValue(0);
  const searchTranslateY = useSharedValue(12);
  const listOpacity = useSharedValue(0);

  useEffect(() => {
    // Icon badge — first element, slight scale-in
    iconOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) });
    iconScale.value = withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 });

    // Heading + subtitle
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Search bar
    searchOpacity.value = withDelay(200, withTiming(1, { duration: 350, easing: Easing.out(Easing.ease) }));
    searchTranslateY.value = withDelay(200, withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) }));

    // List
    listOpacity.value = withDelay(350, withTiming(1, { duration: 350 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchStyle = useAnimatedStyle(() => ({
    opacity: searchOpacity.value,
    transform: [{ translateY: searchTranslateY.value }],
  }));

  const listStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  // CTA transition
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(8);
  useEffect(() => {
    ctaOpacity.value = withTiming(selectedPark ? 1 : 0, { duration: 250 });
    ctaTranslateY.value = withTiming(selectedPark ? 0 : 8, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [selectedPark]);

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  // Filter parks
  const filteredParks = useMemo(() => {
    if (!searchQuery.trim()) return POPULAR_PARKS;
    const q = searchQuery.toLowerCase();
    return POPULAR_PARKS.filter((p) => p.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleSelect = (park: string) => {
    haptics.select();
    Keyboard.dismiss();
    onSelect(park === selectedPark ? null : park);
  };

  const handleContinue = () => {
    if (!selectedPark) return;
    haptics.tap();
    onContinue();
  };

  const handleSkip = () => {
    haptics.tap();
    onSkip();
  };

  const renderParkItem = ({ item, index }: { item: string; index: number }) => (
    <AnimatedParkItem
      park={item}
      isSelected={item === selectedPark}
      onPress={() => handleSelect(item)}
      index={index}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxxl }]}>
      {/* Decorative icon badge */}
      <Animated.View style={[styles.iconBadge, iconStyle]}>
        <Ionicons name="location" size={28} color={ACCENT} />
      </Animated.View>

      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>Pick your home park</Text>
        <Text style={styles.subtitle}>
          We'll personalize your feed and show you what matters most.
        </Text>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, searchStyle]}>
        <Ionicons
          name="search"
          size={18}
          color={colors.text.meta}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parks..."
          placeholderTextColor={colors.text.meta}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => { setSearchQuery(''); haptics.tap(); }}
            hitSlop={8}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={colors.text.meta} />
          </Pressable>
        )}
      </Animated.View>

      {/* Section label */}
      <Animated.View style={[styles.sectionLabelContainer, listStyle]}>
        <Text style={styles.sectionLabel}>
          {searchQuery.trim() ? 'RESULTS' : 'POPULAR PARKS'}
        </Text>
      </Animated.View>

      {/* Park list — individual items, no outer card */}
      <Animated.View style={[styles.listContainer, listStyle]}>
        <FlatList
          data={filteredParks}
          renderItem={renderParkItem}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          extraData={selectedPark}
        />
        {/* Fade gradient at bottom of list */}
        <LinearGradient
          colors={['rgba(247,247,247,0)', colors.background.page]}
          style={styles.listFade}
          pointerEvents="none"
        />
      </Animated.View>

      {/* Bottom actions */}
      <View style={[styles.bottomRegion, { paddingBottom: insets.bottom + spacing.lg }]}>
        {selectedPark ? (
          <Animated.View style={ctaStyle}>
            <Pressable {...ctaPress.pressHandlers} onPress={handleContinue}>
              <Animated.View style={ctaPress.animatedStyle}>
                <LinearGradient
                  colors={[ACCENT, '#B85557']}
                  style={styles.ctaButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.ctaText}>Continue</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable {...skipPress.pressHandlers} onPress={handleSkip}>
            <Animated.View style={skipPress.animatedStyle}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Animated.View>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.page,
  },

  // Decorative icon
  iconBadge: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${ACCENT}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  // Header
  headerContainer: {
    paddingHorizontal: spacing.xxxl,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    height: 48,
    borderRadius: radius.searchBar,
    backgroundColor: colors.background.card,
    ...shadows.small,
    marginBottom: spacing.xl,
  },
  searchIcon: {
    marginLeft: spacing.lg,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.base,
    fontSize: typography.sizes.body,
    color: colors.text.primary,
    fontFamily: typography.fontFamily,
  },
  clearButton: {
    paddingRight: spacing.lg,
    paddingLeft: spacing.sm,
  },

  // Section label
  sectionLabelContainer: {
    paddingHorizontal: spacing.xxl + spacing.xs,
    marginBottom: spacing.base,
  },
  sectionLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.semibold,
    color: colors.text.meta,
    letterSpacing: 1.2,
  },

  // List
  listContainer: {
    flex: 1,
    marginHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  listFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },

  // Park item — individual rows with subtle styling
  parkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.base,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  parkNameContainer: {
    flex: 1,
  },
  parkName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: colors.text.secondary,
  },
  parkNameSelected: {
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  parkCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom
  bottomRegion: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  ctaButton: {
    paddingHorizontal: 48,
    height: 56,
    borderRadius: radius.button,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontSize: typography.sizes.input,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: colors.text.meta,
    paddingVertical: spacing.lg,
  },
});
