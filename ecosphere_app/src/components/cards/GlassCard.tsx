import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { Theme } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  glow?: boolean;
  glowColor?: string;
  intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  borderColor,
  glow = false,
  glowColor,
  intensity: _intensity = 25,
}) => {
  return (
    <View
      style={[
        styles.cardShadow,
        glow && {
          ...Platform.select({
            ios: {
              shadowColor: glowColor || Theme.colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        style,
      ]}
    >
      <View style={[styles.cardContainer, borderColor ? { borderColor } : null]}>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardContainer: {
    borderRadius: Theme.radius.cards,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    backgroundColor: Theme.colors.surfaceCard,
  },
  content: {
    padding: Theme.spacing.md,
  },
});
