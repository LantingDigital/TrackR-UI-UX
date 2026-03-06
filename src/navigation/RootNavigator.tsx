import React, { useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import type { NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { CommunityScreen } from '../screens/CommunityScreen';
import { CoastleScreen } from '../features/coastle/CoastleScreen';
import { BattleScreen } from '../features/battle';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CriteriaWeightEditorScreen } from '../screens/CriteriaWeightEditorScreen';
import { RateRidesScreen } from '../screens/RateRidesScreen';
import { OnboardingScreen } from '../features/onboarding';
import { SpinnerPreviewScreen } from '../screens/SpinnerPreviewScreen';
import { PostDetailScreen } from '../features/community/components/PostDetailScreen';
import { ProfileView } from '../features/community/components/ProfileView';
import { TriviaScreen } from '../features/games/trivia/TriviaScreen';
import { SpeedSorterScreen } from '../features/games/speed-sorter/SpeedSorterScreen';
import { BlindRankingScreen } from '../features/games/blind-ranking/BlindRankingScreen';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';
import { ToastProvider } from '../components/feedback/ToastProvider';
import { POIActionProvider } from '../features/parks/context/POIActionContext';
import { TourProvider, emitTourEvent } from '../features/tour';
import { useSettingsStore } from '../stores/settingsStore';
import { colors } from '../theme/colors';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background.page,
  },
};

const Stack = createNativeStackNavigator();

// Extract the deepest focused route name from navigation state
function getActiveRouteName(state: NavigationState | undefined): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state as NavigationState);
  return route.name;
}

export const RootNavigator = () => {
  const { hasCompletedOnboarding, initialized } = useSettingsStore();

  const handleNavStateChange = useCallback((state: NavigationState | undefined) => {
    const screenName = getActiveRouteName(state);
    if (screenName) {
      emitTourEvent({ type: 'navigation:screenFocused', screenName });
    }
  }, []);

  // Wait for AsyncStorage hydration to prevent flash
  if (!initialized) {
    return <View style={{ flex: 1, backgroundColor: colors.background.page }} />;
  }

  return (
    <NavigationContainer theme={navTheme} onStateChange={handleNavStateChange}>
      <WalletProvider>
        <TabBarProvider>
          <ToastProvider>
            <POIActionProvider>
              <TourProvider>
                {hasCompletedOnboarding ? (
                  <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Tabs" component={TabNavigator} />
                    <Stack.Screen
                      name="CommunityOverlay"
                      component={CommunityScreen}
                      options={{
                        presentation: 'transparentModal',
                        animation: 'none',
                        gestureEnabled: false,
                        contentStyle: { backgroundColor: 'transparent' },
                      }}
                    />
                    <Stack.Screen
                      name="Coastle"
                      component={CoastleScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Battle"
                      component={BattleScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Activity"
                      component={ActivityScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Settings"
                      component={SettingsScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="CriteriaWeightEditor"
                      component={CriteriaWeightEditorScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="RateRides"
                      component={RateRidesScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="SpinnerPreview"
                      component={SpinnerPreviewScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="PostDetail"
                      component={PostDetailScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="ProfileView"
                      component={ProfileView}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="SpeedSorter"
                      component={SpeedSorterScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="BlindRanking"
                      component={BlindRankingScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Trivia"
                      component={TriviaScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                  </Stack.Navigator>
                ) : (
                  <OnboardingScreen />
                )}
              </TourProvider>
            </POIActionProvider>
          </ToastProvider>
        </TabBarProvider>
      </WalletProvider>
    </NavigationContainer>
  );
};
