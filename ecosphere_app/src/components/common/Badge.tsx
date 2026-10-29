import React from 'react';
import { StyleSheet, View, Text, Platform, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme';

type BadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'neutral';

interface BadgeProps {
  text: string;
  type?: BadgeType;
  status?: string;
  glow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  type,
  status,
  glow = false,
  style,
  textStyle,
}) => {
  let resolvedType: BadgeType = type || 'neutral';

  if (status) {
    const s = status.toUpperCase().trim();
    if (['ACTIVE', 'CONFIRMED', 'COMPLETED', 'VERIFIED', 'HIRED', 'PAID'].includes(s)) {
      resolvedType = 'success';
    } else if (['PENDING', 'PROCESSING', 'UNDER_REVIEW', 'SHIPPED'].includes(s)) {
      resolvedType = 'warning';
    } else if (['CANCELLED', 'REJECTED', 'BLOCKED', 'SUSPENDED', 'FAILED'].includes(s)) {
      resolvedType = 'danger';
    } else if (['SHORTLISTED', 'OPEN', 'NEW', 'MESSAGE'].includes(s)) {
      resolvedType = 'primary';
    } else if (['UNREAD', 'SPECIAL', 'FEATURED'].includes(s)) {
      resolvedType = 'purple';
    }
  }

  let bgColor = 'rgba(255, 255, 255, 0.06)';
  let borderColor = 'rgba(255, 255, 255, 0.12)';
  let textColor = Theme.colors.text;
  let glowColor = 'transparent';

  switch (resolvedType) {
    case 'primary':
      bgColor = 'rgba(47, 214, 255, 0.12)';
      borderColor = 'rgba(47, 214, 255, 0.2)';
      textColor = Theme.colors.primary;
      glowColor = Theme.colors.primary;
      break;
    case 'success':
      bgColor = 'rgba(37, 230, 138, 0.12)';
      borderColor = 'rgba(37, 230, 138, 0.2)';
      textColor = Theme.colors.success;
      glowColor = Theme.colors.success;
      break;
    case 'warning':
      bgColor = 'rgba(245, 158, 11, 0.12)';
      borderColor = 'rgba(245, 158, 11, 0.2)';
      textColor = Theme.colors.warning;
      glowColor = Theme.colors.warning;
      break;
    case 'danger':
      bgColor = 'rgba(239, 68, 68, 0.12)';
      borderColor = 'rgba(239, 68, 68, 0.2)';
      textColor = Theme.colors.danger;
      glowColor = Theme.colors.danger;
      break;
    case 'purple':
      bgColor = 'rgba(139, 92, 246, 0.12)';
      borderColor = 'rgba(139, 92, 246, 0.2)';
      textColor = Theme.colors.purple;
      glowColor = Theme.colors.purple;
      break;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderColor },
        glow && {
          ...Platform.select({
            ios: {
              shadowColor: glowColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
            },
            android: {
              elevation: 4,
            },
          }),
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: Theme.typography.sizes.caption - 2,
    fontWeight: Theme.typography.weights.bold,
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
});
