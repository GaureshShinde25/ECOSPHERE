import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { Theme } from '../../theme';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onActionPress,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onActionPress && (
        <PrimaryButton
          text={actionText}
          onPress={onActionPress}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
    width: '100%',
  },
  iconContainer: {
    marginBottom: Theme.spacing.md,
    opacity: 0.8,
  },
  title: {
    fontSize: Theme.typography.sizes.title,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.spacing.lg,
    maxWidth: '85%',
  },
  button: {
    width: 'auto',
    minWidth: 160,
    paddingHorizontal: Theme.spacing.lg,
  },
});
