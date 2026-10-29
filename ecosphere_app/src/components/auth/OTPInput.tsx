import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';

export interface OTPInputRef {
  focus: () => void;
  shake: () => void;
}

interface OTPInputProps {
  code: string;
  onChangeCode: (code: string) => void;
  length?: number;
  disabled?: boolean;
}

export const OTPInput = forwardRef<OTPInputRef, OTPInputProps>(
  ({ code, onChangeCode, length = 6, disabled = false }, ref) => {
    const inputRef = useRef<TextInput>(null);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      shake: () => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 4, duration: 70, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
        ]).start();
      },
    }));

    const handleContainerPress = () => {
      if (!disabled) {
        inputRef.current?.focus();
      }
    };

    const digits = code.split('');

    return (
      <Animated.View
        style={[
          styles.wrapper,
          { transform: [{ translateX: shakeAnim }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleContainerPress}
          style={styles.cellRow}
        >
          {Array.from({ length }).map((_, index) => {
            const digit = digits[index] || '';
            const isCurrent = index === digits.length && digits.length < length;
            const isFilled = Boolean(digit);

            return (
              <View
                key={index}
                style={[
                  styles.cell,
                  isCurrent && styles.cellActive,
                  isFilled && styles.cellFilled,
                ]}
              >
                <Text style={styles.digitText}>{digit}</Text>
                {isCurrent && <View style={styles.cursorIndicator} />}
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Hidden native input capturing user typing and pastes */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(text) => {
            const numericOnly = text.replace(/[^0-9]/g, '').slice(0, length);
            onChangeCode(numericOnly);
          }}
          maxLength={length}
          keyboardType="numeric"
          editable={!disabled}
          autoFocus
          style={styles.hiddenInput}
        />
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4EBE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s, box-shadow 0.2s',
      },
    }),
  },
  cellActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      web: {
        boxShadow: '0 0 10px rgba(22, 163, 74, 0.2)',
      },
    }),
  },
  cellFilled: {
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17231B',
    textAlign: 'center',
  },
  cursorIndicator: {
    position: 'absolute',
    bottom: 12,
    width: 14,
    height: 2,
    backgroundColor: '#16A34A',
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
