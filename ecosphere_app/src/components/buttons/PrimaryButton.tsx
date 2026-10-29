import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        styles.shadowWrapper,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        style={[styles.button, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={[Theme.colors.success, Theme.colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[styles.text, textStyle]}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadowWrapper: {
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    height: 56,
    borderRadius: Theme.radius.buttons,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#07111F',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
});
