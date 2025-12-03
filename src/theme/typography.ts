import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',

  sizes: {
    title: 17,
    subtitle: 15,
    body: 15,
    meta: 12,
    tabLabel: 10,
  },

  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.3,
    relaxed: 1.4,
  },
};
