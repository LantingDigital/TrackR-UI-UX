import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { CoastleScreen } from '../features/coastle/CoastleScreen';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';
import { ToastProvider } from '../components/feedback/ToastProvider';
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
  return (
    <NavigationContainer theme={navTheme}>
      <WalletProvider>
        <TabBarProvider>
          <ToastProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Tabs" component={TabNavigator} />
              <Stack.Screen
                name="Coastle"
                component={CoastleScreen}
                options={{
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                }}
              />
            </Stack.Navigator>
          </ToastProvider>
        </TabBarProvider>
      </WalletProvider>
    </NavigationContainer>
  );
};
