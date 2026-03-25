import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { seedScreenshotData } from './src/config/screenshotSeed';
import { initSync } from './src/services/firebase/syncController';
import { ConfirmModalProvider } from './src/contexts/ConfirmModalContext';

export default function App() {
  useEffect(() => {
    seedScreenshotData();
    const unsubSync = initSync();
    return () => {
      unsubSync();
    };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <ConfirmModalProvider>
          <RootNavigator />
        </ConfirmModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
