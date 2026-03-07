import React, { useCallback, useEffect, useReducer } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';
import { FIRST_SESSION_STEPS, type FirstSessionStep } from './data/firstSessionSteps';
import { FirstSessionCard } from './components/FirstSessionCard';
import { dismissCard, getDismissedIds, addListener } from './firstSessionStore';

interface FirstSessionCardsProps {
  onAction: (action: FirstSessionStep['ctaAction']) => void;
}

export const FirstSessionCards: React.FC<FirstSessionCardsProps> = ({ onAction }) => {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const unsub = addListener(forceUpdate);
    return unsub;
  }, []);

  const dismissedIds = getDismissedIds();
  const visibleSteps = FIRST_SESSION_STEPS.filter((step) => !dismissedIds.has(step.id));

  const handleDismiss = useCallback((id: string) => {
    dismissCard(id);
  }, []);

  if (visibleSteps.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {visibleSteps.map((step, index) => (
        <FirstSessionCard
          key={step.id}
          step={step}
          index={index}
          onAction={onAction}
          onDismiss={handleDismiss}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.base,
    // Shadow-safe padding: shadows.card has shadowRadius 24, offset 8
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginHorizontal: -spacing.xl,
    marginVertical: -spacing.xl,
    overflow: 'visible',
  },
});
