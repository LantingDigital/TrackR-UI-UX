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
import { CriteriaWeightEditorScreen } from '../screens/CriteriaWeightEditorScreen';
import { RateRidesScreen } from '../screens/RateRidesScreen';
import { OnboardingScreen } from '../features/onboarding';
import { SpinnerPreviewScreen } from '../screens/SpinnerPreviewScreen';
import { PostDetailScreen } from '../features/community/components/PostDetailScreen';
import { ProfileView } from '../features/community/components/ProfileView';
import { TriviaScreen } from '../features/games/trivia/TriviaScreen';
import { SpeedSorterScreen } from '../features/games/speed-sorter/SpeedSorterScreen';
import { BlindRankingScreen } from '../features/games/blind-ranking/BlindRankingScreen';
import { ParkleScreen } from '../features/parkle/ParkleScreen';
import { BlockedUsersScreen } from '../screens/settings/BlockedUsersScreen';
import { ExportRideLogScreen } from '../screens/settings/ExportRideLogScreen';
import { ImportRideDataScreen } from '../screens/settings/ImportRideDataScreen';
import { EmailScreen } from '../screens/settings/EmailScreen';
import { PasswordScreen } from '../screens/settings/PasswordScreen';
import { TermsScreen } from '../screens/settings/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/settings/PrivacyPolicyScreen';
import { CreditsScreen } from '../screens/settings/CreditsScreen';
import { SavedArticlesScreen } from '../screens/SavedArticlesScreen';
import { PerksScreen } from '../screens/PerksScreen';
import { ParkDetailScreen } from '../screens/ParkDetailScreen';
import { MerchStoreScreen } from '../features/merch/screens/MerchStoreScreen';
import { MerchCardDetailSheet } from '../features/merch/screens/MerchCardDetailSheet';
import { CartScreen } from '../features/merch/screens/CartScreen';
import { CustomPackBuilderScreen } from '../features/merch/screens/CustomPackBuilderScreen';
import { CheckoutScreen as MerchCheckoutScreen } from '../features/merch/screens/CheckoutScreen';
import { OrderConfirmationScreen } from '../features/merch/screens/OrderConfirmationScreen';
import { OrderHistoryScreen } from '../features/merch/screens/OrderHistoryScreen';
import { ProUpgradeScreen } from '../features/pro/ProUpgradeScreen';
import { ArticleDetailScreen } from '../features/articles/screens/ArticleDetailScreen';
import { ArticlesListScreen } from '../features/articles/screens/ArticlesListScreen';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';
import { ToastProvider } from '../components/feedback/ToastProvider';
import { POIActionProvider } from '../features/parks/context/POIActionContext';

import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

  // Wait for both AsyncStorage hydration AND Firebase auth state check
  if (!initialized || isAuthLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.background.page }} />;
  }

  // Email users who haven't verified must go through onboarding (verification screen)
  const hasUnverifiedEmail =
    isAuthenticated &&
    user?.authProvider === 'email' &&
    !user?.emailVerified;

  // Skip onboarding if user is authenticated with verified email (or OAuth)
  // OR if they previously completed onboarding (browse-without-account mode)
  const showApp = (hasCompletedOnboarding || isAuthenticated) && !hasUnverifiedEmail;

  return (
    <NavigationContainer theme={navTheme}>
      <WalletProvider>
        <TabBarProvider>
          <ToastProvider>
            <POIActionProvider>
                {showApp ? (
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
                    <Stack.Screen
                      name="Parkle"
                      component={ParkleScreen}
                      options={{
                        presentation: 'fullScreenModal',
                        animation: 'slide_from_bottom',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="BlockedUsers"
                      component={BlockedUsersScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="ExportRideLog"
                      component={ExportRideLogScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="ImportRideData"
                      component={ImportRideDataScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="EmailSettings"
                      component={EmailScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="PasswordSettings"
                      component={PasswordScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="TermsOfService"
                      component={TermsScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="PrivacyPolicy"
                      component={PrivacyPolicyScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Credits"
                      component={CreditsScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="SavedArticles"
                      component={SavedArticlesScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="Perks"
                      component={PerksScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="ParkDetail"
                      component={ParkDetailScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    {/* Merch Store screens */}
                    <Stack.Screen
                      name="MerchStore"
                      component={MerchStoreScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="MerchCardDetail"
                      component={MerchCardDetailSheet}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="MerchCart"
                      component={CartScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="MerchPackBuilder"
                      component={CustomPackBuilderScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="MerchCheckout"
                      component={MerchCheckoutScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="MerchOrderConfirmation"
                      component={OrderConfirmationScreen}
                      options={{
                        animation: 'slide_from_bottom',
                        gestureEnabled: false,
                      }}
                    />
                    <Stack.Screen
                      name="MerchOrderHistory"
                      component={OrderHistoryScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    {/* Articles */}
                    <Stack.Screen
                      name="ArticlesList"
                      component={ArticlesListScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    <Stack.Screen
                      name="ArticleDetail"
                      component={ArticleDetailScreen}
                      options={{
                        animation: 'slide_from_right',
                        gestureEnabled: true,
                      }}
                    />
                    {/* Pro Upgrade */}
                    <Stack.Screen
                      name="ProUpgrade"
                      component={ProUpgradeScreen}
                      options={{
                        presentation: 'transparentModal',
                        animation: 'none',
                        gestureEnabled: true,
                        contentStyle: { backgroundColor: 'transparent' },
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
