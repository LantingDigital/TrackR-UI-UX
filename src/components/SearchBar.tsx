import React from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SPRINGS } from '../constants/animations';

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
  const scale = useSharedValue(1);
  const collapseProgress = useSharedValue(collapsed ? 1 : 0);

  React.useEffect(() => {
    collapseProgress.value = withTiming(collapsed ? 1 : 0, { duration: 300 });
  }, [collapsed]);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, SPRINGS.responsive);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRINGS.responsive);
  };

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: interpolate(collapseProgress.value, [0, 1], [EXPANDED_HEIGHT, COLLAPSED_HEIGHT]),
    borderRadius: interpolate(
      collapseProgress.value,
      [0, 1],
      [EXPANDED_HEIGHT / 2, COLLAPSED_HEIGHT / 2],
      Extrapolation.CLAMP
    ),
    paddingHorizontal: collapsed ? 12 : 20,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapseProgress.value, [0, 1], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={outerStyle}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Ionicons name="search" size={collapsed ? 16 : 20} color="#999999" style={styles.icon} />
          <Animated.View style={[{ flex: 1 }, textStyle]}>
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
