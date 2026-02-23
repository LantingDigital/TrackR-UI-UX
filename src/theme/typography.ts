import { Platform } from 'react-native';

export const typography = {
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',

  sizes: {
    small: 11,
    tabLabel: 10,
    meta: 12,
    caption: 13,
    label: 14,
    subtitle: 15,
    body: 15,
    input: 16,
    title: 17,
    large: 18,
    heading: 20,
    hero: 24,
    heroLarge: 26,
    display: 32,
  },

  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.3,
    relaxed: 1.4,
  },
};
