import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { SPRINGS } from '../constants/animations';
import { useTabBar } from '../contexts/TabBarContext';
import { haptics } from '../services/haptics';
import {
  CommunityTopBar,
  CommunityTab,
} from '../features/community/components/CommunityTopBar';
import { CommunityFeedTab } from '../features/community/components/CommunityFeedTab';
import { CommunityFriendsTab } from '../features/community/components/CommunityFriendsTab';
import { CommunityRankingsTab } from '../features/community/components/CommunityRankingsTab';
import { CommunityPlayTab } from '../features/community/components/CommunityPlayTab';
import { ComposeSheet } from '../features/community/components/ComposeSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENTER_SLIDE = SCREEN_HEIGHT * 0.15;
const EXIT_DURATION = 300;
const COMMUNITY_HEADER_HEIGHT = 60;
const FOG_OFFSET = 56; // start fade this many pixels ABOVE header bottom

// Page color in rgba for fog gradient
// colors.background.page = #F7F7F7 = rgb(247, 247, 247)
const PAGE_RGBA = 'rgba(247, 247, 247,';

export const CommunityScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBar = useTabBar();
  const routeInitialTab = route.params?.initialTab as CommunityTab | undefined;
  const [activeTab, setActiveTab] = useState<CommunityTab>(routeInitialTab ?? 'feed');
  const [showCompose, setShowCompose] = useState(false);
  const isExiting = useRef(false);

  const headerTotalHeight = insets.top + COMMUNITY_HEADER_HEIGHT;
  const fogHeight = headerTotalHeight + 200;

  // Separate values for entrance slide-up and exit slide-down
  const enterProgress = useSharedValue(0); // 0→1 spring in
  const exitY = useSharedValue(0);         // 0→SCREEN_HEIGHT slide out

  useFocusEffect(
    useCallback(() => {
      isExiting.current = false;
      tabBar?.hideTabBar();
      enterProgress.value = 0;
      exitY.value = 0;
      enterProgress.value = withSpring(1, SPRINGS.responsive);

      return () => {
        tabBar?.showTabBar();
      };
    }, []),
  );

  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(enterProgress.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [{
      translateY: (1 - enterProgress.value) * ENTER_SLIDE + exitY.value,
    }],
  }));

  const handleBack = () => {
    if (isExiting.current) return;
    isExiting.current = true;
    haptics.select();

    // Tab bar rises simultaneously
    tabBar?.showTabBar();

    // Slide sheet down off the bottom edge
    exitY.value = withTiming(SCREEN_HEIGHT, {
      duration: EXIT_DURATION,
      easing: Easing.in(Easing.cubic),
    }, (finished) => {
      if (finished) {
        runOnJS(navigateBack)();
      }
    });
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  // 12-stop fog gradient — opaque through header, gradual fade below
  const fogGradient = useMemo(() => {
    const headerEnd = (headerTotalHeight - FOG_OFFSET) / fogHeight;
    const fadeZone = 1 - headerEnd;
    const step = fadeZone / 10;

    return {
      colors: [
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.94)`,
        `${PAGE_RGBA} 0.82)`,
        `${PAGE_RGBA} 0.65)`,
        `${PAGE_RGBA} 0.45)`,
        `${PAGE_RGBA} 0.28)`,
        `${PAGE_RGBA} 0.15)`,
        `${PAGE_RGBA} 0.06)`,
        `${PAGE_RGBA} 0.02)`,
        `${PAGE_RGBA} 0.005)`,
        'transparent',
      ] as [string, string, ...string[]],
      locations: [
        0,
        headerEnd * 0.5,
        headerEnd,
        headerEnd + step * 1,
        headerEnd + step * 2,
        headerEnd + step * 3,
        headerEnd + step * 4,
        headerEnd + step * 5,
        headerEnd + step * 6,
        headerEnd + step * 7,
        headerEnd + step * 8,
        1,
      ] as [number, number, ...number[]],
    };
  }, [headerTotalHeight, fogHeight]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sheet, screenAnimStyle]}>
        {/* Tab content — fills entire sheet, scrolls behind header */}
        <View style={styles.tabContent}>
          {activeTab === 'feed' && (
            <CommunityFeedTab
              topInset={headerTotalHeight}
              onShowCompose={() => setShowCompose(true)}
            />
          )}
          {activeTab === 'friends' && <CommunityFriendsTab topInset={headerTotalHeight} />}
          {activeTab === 'rankings' && <CommunityRankingsTab topInset={headerTotalHeight} />}
          {activeTab === 'play' && (
            <CommunityPlayTab
              topInset={headerTotalHeight}
              onPlayCoastle={() => navigation.navigate('Coastle')}
              onPlaySpeedSorter={() => navigation.navigate('SpeedSorter')}
              onPlayBlindRanking={() => navigation.navigate('BlindRanking')}
              onPlayTrivia={() => navigation.navigate('Trivia')}
            />
          )}
        </View>

        {/* Fog gradient overlay — translucent, content visible through it */}
        <View
          style={[styles.fogContainer, { height: fogHeight }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={fogGradient.colors}
            locations={fogGradient.locations}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Top bar — floats above fog */}
        <View style={[styles.topBarContainer, { top: insets.top }]}>
          <CommunityTopBar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onBack={handleBack}
          />
        </View>
      </Animated.View>

      {/* Compose sheet overlay */}
      <ComposeSheet visible={showCompose} onClose={() => setShowCompose(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  tabContent: {
    flex: 1,
  },
  fogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  topBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});

export default CommunityScreen;
