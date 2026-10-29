import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { Theme } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  size = 'md',
}) => {
  const getVariantStyles = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'success':
        return {
          bg: '#DCFCE7',
          border: '#BBF7D0',
          text: '#15803D',
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
        };
      case 'danger':
        return {
          bg: '#FEE2E2',
          border: '#FECACA',
          text: '#B91C1C',
        };
      case 'info':
        return {
          bg: '#DBEAFE',
          border: '#BFDBFE',
          text: '#1D4ED8',
        };
      case 'primary':
        return {
          bg: '#DCFCE7',
          border: '#BBF7D0',
          text: '#146B3A',
        };
      case 'neutral':
      default:
        return {
          bg: '#F1F5F0',
          border: '#E4EBE3',
          text: '#68756B',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: v.bg, borderColor: v.border },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          { color: v.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Theme.typography.bodyFont,
  },
  textSm: {
    fontSize: 10,
  },
});

export default Badge;
