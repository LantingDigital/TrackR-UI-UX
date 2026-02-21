import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F7F7F7',
  },
};

export const RootNavigator = () => {
  return (
    <NavigationContainer theme={navTheme}>
      <WalletProvider>
        <TabBarProvider>
          <TabNavigator />
        </TabBarProvider>
      </WalletProvider>
    </NavigationContainer>
  );
};
