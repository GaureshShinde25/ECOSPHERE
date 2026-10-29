import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Animated,
  TouchableOpacity,
  Platform,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../../theme';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react-native';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  success?: boolean;
  leadingIcon?: React.ReactNode;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  success,
  leadingIcon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const focusAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: leadingIcon ? 42 : 16,
    top: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 8],
    }),
    fontSize: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 11],
    }),
    color: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [Theme.colors.secondaryText, Theme.colors.primary],
    }),
  };

  let borderColor = Theme.colors.border;
  if (error) borderColor = Theme.colors.danger;
  else if (success) borderColor = Theme.colors.success;
  else if (isFocused) borderColor = Theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          isFocused && {
            ...Platform.select({
              ios: {
                shadowColor: Theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
              android: {
                elevation: 4,
              },
            }),
          },
        ]}
      >
        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        
        {leadingIcon && <View style={styles.leadingIconWrapper}>{leadingIcon}</View>}

        <View style={styles.inputContainer}>
          <Animated.Text style={labelStyle}>{label}</Animated.Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={Theme.colors.secondaryText}
            secureTextEntry={secureTextEntry && !showPassword}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            style={[
              styles.input,
              leadingIcon ? { paddingLeft: 42 } : { paddingLeft: 16 },
              (secureTextEntry || success || error) ? { paddingRight: 42 } : { paddingRight: 16 },
            ]}
          />
        </View>

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconWrapper}
          >
            {showPassword ? (
              <EyeOff size={18} color={Theme.colors.secondaryText} />
            ) : (
              <Eye size={18} color={Theme.colors.secondaryText} />
            )}
          </TouchableOpacity>
        )}

        {success && !secureTextEntry && (
          <View style={styles.rightIconWrapper}>
            <Check size={18} color={Theme.colors.success} />
          </View>
        )}

        {error && !secureTextEntry && (
          <View style={styles.rightIconWrapper}>
            <AlertCircle size={18} color={Theme.colors.danger} />
          </View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Theme.spacing.md,
  },
  inputWrapper: {
    height: 60,
    borderRadius: Theme.radius.inputs,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 24, 40, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadingIconWrapper: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.medium,
    fontFamily: Theme.typography.fontFamily,
    paddingTop: 18,
  },
  rightIconWrapper: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
  },
  errorText: {
    fontSize: Theme.typography.sizes.caption - 1,
    color: Theme.colors.danger,
    marginTop: 6,
    marginLeft: 8,
    fontWeight: Theme.typography.weights.medium,
    fontFamily: Theme.typography.fontFamily,
  },
});
