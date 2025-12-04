import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { WalletProvider } from '../contexts/WalletContext';
import { TabBarProvider } from '../contexts/TabBarContext';

export const RootNavigator = () => {
  return (
    <WalletProvider>
      <TabBarProvider>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </TabBarProvider>
    </WalletProvider>
  );
};
