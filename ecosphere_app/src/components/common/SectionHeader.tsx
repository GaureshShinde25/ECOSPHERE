import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Theme } from '../../theme';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  actionText,
  onActionPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      {actionText && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text style={styles.actionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.md,
    width: '100%',
  },
  textContainer: {
    flex: 1,
    paddingRight: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.title,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  description: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    lineHeight: 18,
  },
  actionText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
    marginTop: 6,
  },
});
