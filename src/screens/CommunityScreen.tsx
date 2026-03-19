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
import { RideActionSheet, RideActionData } from '../components/RideActionSheet';
// getPOIByCoasterId removed (map feature shelved for v2)
import { addQuickLog } from '../stores/rideLogStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENTER_SLIDE = SCREEN_HEIGHT * 0.15;
const EXIT_DURATION = 300;
const COMMUNITY_HEADER_HEIGHT = 60;
const FOG_EXTENSION = 200; // extended tail for very gradual bottom-edge fade

// Fog base color — MUST match HomeScreen exactly
// HomeScreen uses rgba(240, 238, 235, ...) for a warmer tone
const FOG_BASE = 'rgba(240, 238, 235,';

export const CommunityScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBar = useTabBar();
  const routeInitialTab = route.params?.initialTab as CommunityTab | undefined;
  const routePostId = route.params?.postId as string | undefined;
  const [activeTab, setActiveTab] = useState<CommunityTab>(routeInitialTab ?? 'feed');
  const [showCompose, setShowCompose] = useState(false);
  const isExiting = useRef(false);
  const hasNavigatedToPost = useRef(false);

  // Ride action sheet state
  const [rideActionData, setRideActionData] = useState<RideActionData | null>(null);
  const [rideActionVisible, setRideActionVisible] = useState(false);

  const headerTotalHeight = insets.top + COMMUNITY_HEADER_HEIGHT;
  const fogHeight = headerTotalHeight + FOG_EXTENSION;

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

      // When arriving via friend activity tap with a postId, navigate to PostDetail
      if (routePostId && !hasNavigatedToPost.current) {
        hasNavigatedToPost.current = true;
        haptics.select();
        // Small delay to let the Community screen entrance animation start
        const timer = setTimeout(() => {
          navigation.navigate('PostDetail', { itemId: routePostId });
        }, 200);
        return () => {
          tabBar?.showTabBar();
          clearTimeout(timer);
        };
      }

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

  // Fog gradient — solid through header, sharp drop below so titles (Games,
  // Featured, etc.) are readable, then a very long gradual tail to prevent
  // the hard-line edge that was visible ~1/5 down the screen.
  const fogGradient = useMemo(() => {
    const headerEnd = Math.min(headerTotalHeight / fogHeight, 0.55);
    const fadeZone = 1 - headerEnd;
    return {
      colors: [
        `${FOG_BASE} 0.97)`,   // Solid through full header (matches FogHeader approved opacity)
        `${FOG_BASE} 0.88)`,   // Just above header edge — still covered
        `${FOG_BASE} 0.32)`,   // Sharp drop right below header — titles readable
        `${FOG_BASE} 0.14)`,   // Quickly fading out
        `${FOG_BASE} 0.06)`,   // Subtle haze
        `${FOG_BASE} 0.025)`,  // Very faint
        `${FOG_BASE} 0.008)`,  // Near-zero — prevents hard bottom edge
        `${FOG_BASE} 0.002)`,  // Imperceptible
        'transparent',           // Gone
      ] as [string, string, ...string[]],
      locations: [
        0,
        Math.max(headerEnd - 0.02, 0),
        Math.min(headerEnd + fadeZone * 0.06, 1),
        Math.min(headerEnd + fadeZone * 0.18, 1),
        Math.min(headerEnd + fadeZone * 0.35, 1),
        Math.min(headerEnd + fadeZone * 0.55, 1),
        Math.min(headerEnd + fadeZone * 0.75, 1),
        Math.min(headerEnd + fadeZone * 0.90, 1),
        1,
      ] as [number, number, ...number[]],
    };
  }, [headerTotalHeight, fogHeight]);

  // Coaster cross-reference handler — opens RideActionSheet
  const handleCoasterTap = useCallback((coasterId: string, coasterName: string, parkName: string) => {
    setRideActionData({ id: coasterId, name: coasterName, parkName });
    setRideActionVisible(true);
  }, []);

  const handleRideActionViewDetails = useCallback((ride: RideActionData) => {
    setRideActionVisible(false);
    navigation.navigate('CoasterDetail', { coasterId: ride.id });
  }, [navigation]);

  const handleRideActionLogRide = useCallback((ride: RideActionData) => {
    setRideActionVisible(false);
    addQuickLog({
      id: ride.id,
      name: ride.name,
      parkName: ride.parkName,
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sheet, screenAnimStyle]}>
        {/* Tab content — fills entire sheet, scrolls behind header */}
        <View style={styles.tabContent}>
          {activeTab === 'feed' && (
            <CommunityFeedTab
              topInset={headerTotalHeight}
              onShowCompose={() => setShowCompose(true)}
              onCoasterTap={handleCoasterTap}
            />
          )}
          {activeTab === 'friends' && <CommunityFriendsTab topInset={headerTotalHeight} onCoasterTap={handleCoasterTap} />}
          {activeTab === 'rankings' && <CommunityRankingsTab topInset={headerTotalHeight} onCoasterTap={handleCoasterTap} />}
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

      {/* Ride action sheet — coaster cross-references */}
      {(rideActionVisible || rideActionData) && (
        <RideActionSheet
          ride={rideActionData}
          visible={rideActionVisible}
          onClose={() => {
            setRideActionVisible(false);
            setRideActionData(null);
          }}
          onViewDetails={handleRideActionViewDetails}
          onLogRide={handleRideActionLogRide}
        />
      )}
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
