import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionPillProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  parkMode?: boolean;
  circleMode?: boolean;
}

const PILL_HEIGHT = 36;
const CIRCLE_SIZE = 34;

export const ActionPill: React.FC<ActionPillProps> = ({
  icon,
  label,
  onPress,
  parkMode = false,
  circleMode = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const sizeAnim = useRef(new Animated.Value(PILL_HEIGHT)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(labelOpacity, {
        toValue: circleMode ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(sizeAnim, {
        toValue: circleMode ? CIRCLE_SIZE : PILL_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [circleMode]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const borderRadius = sizeAnim.interpolate({
    inputRange: [CIRCLE_SIZE, PILL_HEIGHT],
    outputRange: [CIRCLE_SIZE / 2, PILL_HEIGHT / 2],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.container,
            parkMode && styles.parkModeContainer,
            {
              height: sizeAnim,
              width: circleMode ? sizeAnim : undefined,
              borderRadius: borderRadius,
              paddingHorizontal: circleMode ? 0 : 16,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color="#000000"
            style={circleMode ? undefined : styles.icon}
          />
          {!circleMode && (
            <Animated.View style={{ opacity: labelOpacity }}>
              <Text style={styles.label}>{label}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  parkModeContainer: {
    borderWidth: 2,
    borderColor: '#CF6769',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});
