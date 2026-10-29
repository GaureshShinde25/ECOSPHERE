import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';

interface IconButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  size?: number;
  glow?: boolean;
  glowColor?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  onPress,
  style,
  disabled = false,
  size = 50,
  glow = false,
  glowColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      ...Theme.animations.pressConfig,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      ...Theme.animations.releaseConfig,
    }).start();
  };

  const dynamicStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        dynamicStyles,
        glow && {
          ...Platform.select({
            ios: {
              shadowColor: glowColor || Theme.colors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[styles.button, dynamicStyles, disabled && styles.disabled]}
      >
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  disabled: {
    opacity: 0.5,
  },
});
