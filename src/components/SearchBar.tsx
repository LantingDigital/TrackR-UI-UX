import React, { useRef, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
  collapsed?: boolean;
}

const EXPANDED_HEIGHT = 56;
const COLLAPSED_HEIGHT = 34;

export const SearchBar: React.FC<SearchBarProps> = ({
  onPress,
  placeholder = "Search rides, parks, news...",
  collapsed = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heightAnim = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: collapsed ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(textOpacity, {
        toValue: collapsed ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [collapsed]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const borderRadius = heightAnim.interpolate({
    inputRange: [COLLAPSED_HEIGHT, EXPANDED_HEIGHT],
    outputRange: [COLLAPSED_HEIGHT / 2, EXPANDED_HEIGHT / 2],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View
          style={[
            styles.container,
            {
              height: heightAnim,
              borderRadius: borderRadius,
              paddingHorizontal: collapsed ? 12 : 20,
            },
          ]}
        >
          <Ionicons name="search" size={collapsed ? 16 : 20} color="#999999" style={styles.icon} />
          <Animated.View style={{ flex: 1, opacity: textOpacity }}>
            {!collapsed && (
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999999"
                editable={false}
                pointerEvents="none"
              />
            )}
          </Animated.View>
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
    shadowColor: '#323232',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
});
