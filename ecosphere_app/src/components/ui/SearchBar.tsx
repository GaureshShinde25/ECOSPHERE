import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { Theme } from '../../theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPress?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  onSubmit,
  onPress,
  onFilterPress,
  placeholder = 'Search local businesses, jobs, services...',
  editable = true,
  style,
  autoFocus = false,
}) => {
  const content = (
    <View style={[styles.container, style]}>
      <Search size={19} color={Theme.colors.emerald} style={styles.searchIcon} />

      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.secondaryText}
          style={styles.input}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
      ) : (
        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>
      )}

      {editable && value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText?.('')}
          style={styles.clearBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={Theme.colors.secondaryText} />
        </TouchableOpacity>
      )}

      {onFilterPress && (
        <TouchableOpacity
          onPress={onFilterPress}
          style={styles.filterBtn}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Filter search"
        >
          <SlidersHorizontal size={17} color={Theme.colors.forestGreen} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (!editable && onPress) {
    return (
      <View style={styles.outerRow}>
        <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.wrapper}>
          {content}
        </TouchableOpacity>
        {onFilterPress && (
          <TouchableOpacity
            onPress={onFilterPress}
            style={styles.separateFilterBtn}
            activeOpacity={0.75}
            accessibilityLabel="Filter search"
          >
            <SlidersHorizontal size={18} color={Theme.colors.forestGreen} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  wrapper: {
    flex: 1,
  },
  separateFilterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      default: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Theme.colors.primaryText, // #17231B
    fontSize: 14,
    fontFamily: Theme.typography.bodyFont,
    paddingVertical: 0,
  },
  placeholderText: {
    flex: 1,
    color: Theme.colors.secondaryText, // #68756B
    fontSize: 14,
    fontFamily: Theme.typography.bodyFont,
  },
  clearBtn: {
    padding: 6,
    marginLeft: 6,
  },
  filterBtn: {
    padding: 6,
    marginLeft: 6,
  },
});

export default SearchBar;
