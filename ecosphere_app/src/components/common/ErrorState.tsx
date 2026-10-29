import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { PrimaryButton } from '../buttons/PrimaryButton';
import { Theme } from '../../theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'A network or server connection issue occurred. Please verify your connection and retry.',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <AlertCircle size={36} color={Theme.colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <PrimaryButton
          text="Retry Action"
          onPress={onRetry}
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
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.subtitle,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    maxWidth: 320,
    lineHeight: 20,
  },
  button: {
    minWidth: 160,
  },
});
