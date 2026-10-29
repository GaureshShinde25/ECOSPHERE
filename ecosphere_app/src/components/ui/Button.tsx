import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { Theme } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const isInteractive = !loading && !disabled;

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { minHeight: 38, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 };
      case 'lg':
        return { minHeight: 52, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 };
      case 'md':
      default:
        return { minHeight: 46, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14 };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 13, fontWeight: '600' };
      case 'lg':
        return { fontSize: 16, fontWeight: '600' };
      case 'md':
      default:
        return { fontSize: 15, fontWeight: '600' };
    }
  };

  const getVariantContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'destructive':
        return {
          backgroundColor: '#FEE2E2',
          borderWidth: 1,
          borderColor: '#FECACA',
        };
      case 'secondary':
        return {
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: Theme.colors.border, // #E4EBE3
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: Theme.colors.emerald, // #16A34A
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'primary':
      default:
        return {
          backgroundColor: Theme.colors.emerald, // #16A34A
          borderWidth: 0,
        };
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case 'destructive':
        return { color: '#DC2626' };
      case 'secondary':
        return { color: Theme.colors.primaryText }; // #17231B
      case 'outline':
        return { color: Theme.colors.emerald }; // #16A34A
      case 'ghost':
        return { color: Theme.colors.secondaryText }; // #68756B
      case 'primary':
      default:
        return { color: '#FFFFFF', fontWeight: '600' };
    }
  };

  const innerContent = (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : Theme.colors.emerald}
        />
      ) : (
        <>
          {leftIcon && <View style={styles.iconMarginRight}>{leftIcon}</View>}
          <Text
            style={[
              styles.textBase,
              getTextSizeStyle(),
              getVariantTextStyle(),
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.iconMarginLeft}>{rightIcon}</View>}
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      style={[
        styles.base,
        getSizeStyle(),
        getVariantContainerStyle(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {innerContent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontFamily: Theme.typography.bodyFont,
    textAlign: 'center',
  },
  iconMarginRight: {
    marginRight: 8,
  },
  iconMarginLeft: {
    marginLeft: 8,
  },
});

export default Button;
