/**
 * ProUpgradeScreen — Navigation wrapper for ProPaywallSheet.
 *
 * Presented as a transparentModal so the bottom sheet
 * floats over the previous screen with a dimmed backdrop.
 * Dismissing the sheet navigates back.
 */

import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ProPaywallSheet } from './ProPaywallSheet';

export const ProUpgradeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const triggerFeature = route.params?.triggerFeature as string | undefined;

  return (
    <ProPaywallSheet
      visible={true}
      onDismiss={() => navigation.goBack()}
      triggerFeature={triggerFeature}
    />
  );
};
