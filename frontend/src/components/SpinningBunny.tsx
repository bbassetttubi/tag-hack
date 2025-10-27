import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface SpinningBunnyProps {
  size?: number;
  message?: string;
}

export function SpinningBunny({ size = 60, message = "Generating magic..." }: SpinningBunnyProps) {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create continuous spinning animation
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bunnyContainer,
          {
            transform: [{ rotate: spin }],
            width: size,
            height: size,
          },
        ]}
      >
        <Text style={[styles.bunny, { fontSize: size }]}>🐰</Text>
      </Animated.View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  bunnyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bunny: {
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

