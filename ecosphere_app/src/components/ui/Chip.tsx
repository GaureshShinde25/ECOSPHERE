import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
  StyleProp,
  View,
} from 'react-native';
import { Theme } from '../../theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  count?: number;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  style,
  count,
}) => {
  const content = (
    <View
      style={[
        styles.chip,
        selected && styles.chipSelected,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      {count !== undefined && (
        <View style={[styles.countBadge, selected && styles.countBadgeSelected]}>
          <Text style={[styles.countText, selected && styles.countTextSelected]}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    marginRight: 8,
    minHeight: 36,
  },
  chipSelected: {
    backgroundColor: Theme.colors.emerald, // #16A34A
    borderColor: Theme.colors.emerald,
  },
  iconContainer: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    color: Theme.colors.secondaryText, // #68756B
    fontWeight: '500',
    fontFamily: Theme.typography.bodyFont,
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: Theme.colors.surfaceSubtle, // #F1F5F0
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
});

export default Chip;
