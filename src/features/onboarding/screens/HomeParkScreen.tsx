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
} from 'react-native-reanimated';
import { useStrongPress } from '../../../hooks/useSpringPress';
import { haptics } from '../../../services/haptics';
import { typography } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';
import { radius } from '../../../theme/radius';
import { colors } from '../../../theme/colors';

const ACCENT = colors.accent.primary;

// Background is transparent — inherits from OnboardingScreen container bg
const CARD_BG = '#363639';
const CARD_BORDER = 'rgba(255,255,255,0.08)';

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

// Animated park item that responds to selection
const AnimatedParkItem: React.FC<{
  park: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ park, isSelected, onPress }) => {
  // Use spring for scale, timing for background tint
  const selectionProgress = useSharedValue(isSelected ? 1 : 0);
  const scale = useSharedValue(isSelected ? 1.03 : 1);

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.03 : 1, {
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
      ['transparent', `${ACCENT}12`],
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [{ scale: interpolate(selectionProgress.value, [0, 1], [0.7, 1]) }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.parkItem, containerStyle]}>
        <Ionicons
          name="location-outline"
          size={18}
          color={isSelected ? ACCENT : 'rgba(255,255,255,0.4)'}
        />
        {/* Text changes instantly — no crossfade. Bold + white when selected. */}
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
          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    </Pressable>
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
  const [searchQuery, setSearchQuery] = useState('');

  // Entrance animations
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(20);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    headerTranslateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  // CTA
  const ctaOpacity = useSharedValue(0);
  useEffect(() => {
    ctaOpacity.value = withTiming(selectedPark ? 1 : 0, { duration: 250 });
  }, [selectedPark]);

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
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

  const renderParkItem = ({ item }: { item: string }) => (
    <AnimatedParkItem
      park={item}
      isSelected={item === selectedPark}
      onPress={() => handleSelect(item)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      {/* Header */}
      <Animated.View style={[styles.headerContainer, headerStyle]}>
        <Text style={styles.heading}>Pick your home park</Text>
        <Text style={styles.subtitle}>
          We'll personalize your feed and show you what matters most.
        </Text>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[styles.searchContainer, contentStyle]}>
        <Ionicons
          name="search"
          size={18}
          color="rgba(255,255,255,0.35)"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parks..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </Animated.View>

      {/* Park list */}
      <Animated.View style={[styles.listContainer, contentStyle]}>
        <FlatList
          data={filteredParks}
          renderItem={renderParkItem}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          extraData={selectedPark}
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
          <Pressable onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  heading: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.base,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: typography.sizes.body * 1.5,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xxl,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginLeft: spacing.lg,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.base,
    fontSize: typography.sizes.body,
    color: '#FFFFFF',
    fontFamily: typography.fontFamily,
  },

  // List
  listContainer: {
    flex: 1,
    marginHorizontal: spacing.xxl,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  parkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.base,
  },
  parkNameContainer: {
    flex: 1,
  },
  parkName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    color: 'rgba(255,255,255,0.7)',
  },
  parkNameSelected: {
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
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
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  skipText: {
    fontSize: typography.sizes.label,
    fontWeight: typography.weights.medium,
    color: 'rgba(255,255,255,0.5)',
    paddingVertical: spacing.lg,
  },
});
