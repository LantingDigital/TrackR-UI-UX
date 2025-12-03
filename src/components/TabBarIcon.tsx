import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  showBadge?: boolean;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({
  name,
  focused,
  showBadge = false,
}) => {
  const color = focused ? '#CF6769' : '#999999';

  return (
    <View style={styles.container}>
      <Ionicons name={name} size={24} color={color} />
      {showBadge && <View style={styles.badge} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CF6769',
  },
});
