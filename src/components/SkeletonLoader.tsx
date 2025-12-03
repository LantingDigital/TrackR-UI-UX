import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ViewStyle, Animated, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const translateX = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 200,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerContainer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['#E1E1E1', '#F5F5F5', '#E1E1E1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E1E1',
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: 200,
    height: '100%',
  },
});
