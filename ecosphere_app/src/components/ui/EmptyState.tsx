import React from 'react';
import { StyleSheet, View, Text, ViewStyle, StyleProp } from 'react-native';
import { PackageOpen } from 'lucide-react-native';
import { Button } from './Button';
import { Theme } from '../../theme';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  actionLabel,
  onAction,
  style,
}) => {
  const buttonTitle = actionLabel || actionTitle;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {icon || <PackageOpen size={30} color={Theme.colors.emerald} />}
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {buttonTitle && onAction && (
        <Button
          title={buttonTitle}
          onPress={onAction}
          variant="secondary"
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    marginVertical: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Theme.typography.headingFont,
  },
  description: {
    fontSize: 13,
    color: Theme.colors.secondaryText, // #68756B
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 16,
    fontFamily: Theme.typography.bodyFont,
  },
  actionBtn: {
    marginTop: 4,
  },
});

export default EmptyState;
