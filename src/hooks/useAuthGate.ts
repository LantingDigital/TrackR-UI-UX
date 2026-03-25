/**
 * useAuthGate — Hook for gating features behind authentication.
 *
 * Returns a `gate` function that checks auth state. If the user is
 * authenticated, it runs the callback. If anonymous, it shows the
 * auth nudge sheet.
 *
 * Usage:
 *   const { gate, nudgeProps } = useAuthGate();
 *
 *   // In a press handler:
 *   onPress={() => gate('log', () => openLogModal())}
 *
 *   // In JSX:
 *   <AuthNudgeSheet {...nudgeProps} />
 */

import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getIsAuthenticated } from '../stores/authStore';
import { resetOnboarding } from '../stores/settingsStore';

interface NudgeProps {
  visible: boolean;
  feature: string;
  onSignUp: () => void;
  onDismiss: () => void;
}

export function useAuthGate() {
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [nudgeFeature, setNudgeFeature] = useState('');
  const navigation = useNavigation();

  /**
   * Gate a feature behind auth. If authenticated, runs the action.
   * If not, shows the auth nudge bottom sheet.
   */
  const gate = useCallback(
    (feature: string, action: () => void) => {
      if (getIsAuthenticated()) {
        action();
      } else {
        setNudgeFeature(feature);
        setNudgeVisible(true);
      }
    },
    [],
  );

  const handleSignUp = useCallback(() => {
    setNudgeVisible(false);
    // Reset onboarding to show the onboarding flow with auth
    resetOnboarding();
  }, []);

  const handleDismiss = useCallback(() => {
    setNudgeVisible(false);
  }, []);

  const nudgeProps: NudgeProps = {
    visible: nudgeVisible,
    feature: nudgeFeature,
    onSignUp: handleSignUp,
    onDismiss: handleDismiss,
  };

  return { gate, nudgeProps };
}
