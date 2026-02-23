import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#323232',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  small: Platform.select({
    ios: {
      shadowColor: '#323232',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  modal: Platform.select({
    ios: {
      shadowColor: '#323232',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
    },
    android: {
      elevation: 16,
    },
  }) as ViewStyle,

  section: Platform.select({
    ios: {
      shadowColor: '#323232',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,
};
