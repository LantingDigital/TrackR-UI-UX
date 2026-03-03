import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { CommunityScreen } from '../screens/CommunityScreen';
import { CoastleScreen } from '../features/coastle/CoastleScreen';
import { BattleScreen } from '../features/battle';
import { ActivityScreen } from '../screens/ActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../features/onboarding';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';
import { ToastProvider } from '../components/feedback/ToastProvider';
import { POIActionProvider } from '../features/parks/context/POIActionContext';
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

export const RootNavigator = () => {
  const { hasCompletedOnboarding, initialized } = useSettingsStore();

  // Wait for AsyncStorage hydration to prevent flash
  if (!initialized) {
    return <View style={{ flex: 1, backgroundColor: colors.background.page }} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <WalletProvider>
        <TabBarProvider>
          <ToastProvider>
            <POIActionProvider>
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
                </Stack.Navigator>
              ) : (
                <OnboardingScreen />
              )}
            </POIActionProvider>
          </ToastProvider>
        </TabBarProvider>
      </WalletProvider>
    </NavigationContainer>
  );
};
