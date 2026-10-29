import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Theme } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'glass' | 'solid' | 'elevated' | 'outlined';
  glow?: 'none' | 'green' | 'blue' | 'purple';
  onPress?: () => void;
  activeOpacity?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'solid',
  glow = 'none',
  onPress,
  activeOpacity = 0.85,
}) => {
  const getGlowStyle = (): ViewStyle => {
    switch (glow) {
      case 'green':
        return {
          borderColor: 'rgba(22, 163, 74, 0.35)',
        };
      case 'blue':
        return {
          borderColor: 'rgba(37, 99, 235, 0.35)',
        };
      case 'purple':
        return {
          borderColor: 'rgba(124, 58, 237, 0.35)',
        };
      default:
        return {};
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Theme.colors.surfaceCard, // #FFFFFF
          borderColor: Theme.colors.border, // #E4EBE3
          ...Platform.select({
            ios: {
              shadowColor: '#17231B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 14,
            },
            android: {
              elevation: 4,
            },
          }),
        };
      case 'outlined':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: Theme.colors.border,
        };
      case 'glass':
      case 'solid':
      default:
        return {
          backgroundColor: Theme.colors.surfaceCard, // #FFFFFF
          borderColor: Theme.colors.border, // #E4EBE3
        };
    }
  };

  const content = (
    <View style={[styles.card, getVariantStyle(), getGlowStyle(), style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={styles.touchable}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  card: {
    borderRadius: 20, // 18-22px
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
});

export default Card;
