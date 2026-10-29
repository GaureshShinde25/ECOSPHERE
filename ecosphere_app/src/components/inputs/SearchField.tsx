import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';
import { Search, Mic, X } from 'lucide-react-native';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onVoicePress?: () => void;
  onClearPress?: () => void;
  style?: ViewStyle;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Search local opportunities...',
  onVoicePress,
  onClearPress,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.darkOverlay} />
      
      <View style={styles.searchIconWrapper}>
        <Search size={18} color={Theme.colors.secondaryText} />
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Theme.colors.secondaryText}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={onClearPress}
          style={styles.clearIconWrapper}
        >
          <X size={16} color={Theme.colors.secondaryText} />
        </TouchableOpacity>
      )}

      {onVoicePress && value.length === 0 && (
        <TouchableOpacity
          onPress={onVoicePress}
          style={styles.voiceIconWrapper}
        >
          <Mic size={18} color={Theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: Theme.radius.inputs,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 24, 40, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 17, 31, 0.15)',
  },
  searchIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    fontFamily: Theme.typography.fontFamily,
  },
  clearIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    marginLeft: 8,
  },
  voiceIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
