import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  style,
  textStyle,
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
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={[
          styles.container,
          selected ? styles.selectedContainer : styles.unselectedContainer,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            selected ? styles.selectedText : styles.unselectedText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: Theme.colors.border,
  },
  selectedContainer: {
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    borderColor: Theme.colors.primary,
  },
  text: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    fontFamily: Theme.typography.fontFamily,
  },
  unselectedText: {
    color: Theme.colors.secondaryText,
  },
  selectedText: {
    color: Theme.colors.primary,
  },
});
