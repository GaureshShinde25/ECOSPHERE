import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';

interface AIOrbProps {
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
}

export const AIOrb: React.FC<AIOrbProps> = ({
  size = 'medium',
  onPress,
  style,
}) => {
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Particle translations and opacity
  const particle1 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const particle1Opacity = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const particle2Opacity = useRef(new Animated.Value(0)).current;

  let orbSize = 64;
  if (size === 'small') orbSize = 46;
  if (size === 'large') orbSize = 96;

  useEffect(() => {
    // Pulse outer ring 1
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim1, {
          toValue: 1.3,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim1, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse outer ring 2
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim2, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Continuous floating particles loop
    const animateParticles = () => {
      particle1.setValue({ x: 0, y: 0 });
      particle1Opacity.setValue(0.8);
      particle2.setValue({ x: 0, y: 0 });
      particle2Opacity.setValue(0.8);

      Animated.parallel([
        Animated.timing(particle1, {
          toValue: { x: orbSize * 0.4, y: -orbSize * 0.4 },
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(particle1Opacity, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(particle2, {
          toValue: { x: -orbSize * 0.4, y: orbSize * 0.4 },
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(particle2Opacity, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animateParticles();
      });
    };

    animateParticles();
  }, [orbSize]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
    if (onPress) onPress();
  };

  const dynamicStyles = {
    width: orbSize,
    height: orbSize,
    borderRadius: orbSize / 2,
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.container,
          dynamicStyles,
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        {/* Pulse Ring 2 */}
        <Animated.View
          style={[
            styles.pulseRing,
            dynamicStyles,
            {
              transform: [{ scale: pulseAnim2 }],
              opacity: pulseAnim2.interpolate({
                inputRange: [1, 1.5],
                outputRange: [0.15, 0],
              }),
            },
          ]}
        />

        {/* Pulse Ring 1 */}
        <Animated.View
          style={[
            styles.pulseRing,
            dynamicStyles,
            {
              transform: [{ scale: pulseAnim1 }],
              opacity: pulseAnim1.interpolate({
                inputRange: [1, 1.3],
                outputRange: [0.3, 0],
              }),
            },
          ]}
        />

        {/* Shadow Outer Glow Layer */}
        <View
          style={[
            styles.glowContainer,
            dynamicStyles,
            {
              ...Platform.select({
                ios: {
                  shadowColor: Theme.colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: orbSize / 3,
                },
                android: {
                  elevation: 10,
                },
              }),
            },
          ]}
        />

        {/* Core Gradient Sphere */}
        <View style={[styles.core, dynamicStyles]}>
          <LinearGradient
            colors={[Theme.colors.success, Theme.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.highlight, { borderRadius: orbSize / 2 }]} />
        </View>

        {/* Particle 1 */}
        <Animated.View
          style={[
            styles.particle,
            {
              transform: particle1.getTranslateTransform(),
              opacity: particle1Opacity,
              backgroundColor: Theme.colors.primary,
            },
          ]}
        />

        {/* Particle 2 */}
        <Animated.View
          style={[
            styles.particle,
            {
              transform: particle2.getTranslateTransform(),
              opacity: particle2Opacity,
              backgroundColor: Theme.colors.success,
            },
          ]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    backgroundColor: 'transparent',
  },
  glowContainer: {
    position: 'absolute',
  },
  core: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  highlight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: '#2FD6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
});
