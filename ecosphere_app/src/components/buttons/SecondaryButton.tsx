import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';

interface SecondaryButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  text,
  onPress,
  style,
  textStyle,
  disabled = false,
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

  return (
    <Animated.View
      style={[
        styles.container,
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
        style={[styles.button, disabled && styles.disabled]}
      >
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    height: 56,
    borderRadius: Theme.radius.buttons,
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
  text: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.semibold,
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 0.3,
  },
});
