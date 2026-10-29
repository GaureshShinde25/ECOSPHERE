import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Phone, Lock, Check } from 'lucide-react-native';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLogin: (mobile?: string, directUser?: any) => void;
  onRegister: () => void;
  onForgotPassword?: () => void;
  onBack?: () => void;
  initialIdentifier?: string;
}

export default function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
  onBack,
  initialIdentifier,
}: LoginScreenProps) {
  const [mobile, setMobile] = useState(initialIdentifier || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ mobile?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { mobile?: string; password?: string } = {};
    const trimmed = mobile.trim();

    if (!trimmed) {
      errors.mobile = 'Mobile number or username is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginSubmit = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    setErrorMessage('');

    const trimmed = mobile.trim();
    const hasLetters = /[a-zA-Z]/.test(trimmed);

    // If password provided or username identifier (like Admin.Gauresh), attempt direct password authentication
    if (password.trim() || hasLetters) {
      if (!password.trim()) {
        setFieldErrors({ password: 'Password is required' });
        setLoading(false);
        return;
      }
      try {
        const res = await authService.login(trimmed, password.trim());
        if (res && res.success && res.user) {
          onLogin(res.user.mobileNumber || res.user.phone || trimmed, res.user);
          return;
        } else {
          setErrorMessage('Invalid username/mobile or password.');
          return;
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Invalid username/mobile or password.');
        return;
      } finally {
        setLoading(false);
      }
    }

    // Otherwise OTP flow for numeric mobile number
    const cleanMobile = trimmed.replace(/\D/g, '');
    const payloadMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    if (!payloadMobile || payloadMobile.length < 10) {
      setFieldErrors({ mobile: 'Enter a valid 10-digit mobile number' });
      setLoading(false);
      return;
    }

    try {
      await authService.requestOtp(payloadMobile, 'login');
      onLogin(payloadMobile);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Account not registered. Please create an account first.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else if (Platform.OS === 'web') {
      alert('Password reset instructions have been sent to your registered mobile number.');
    } else {
      Alert.alert(
        'Password Reset',
        'Password reset instructions have been sent to your registered mobile number.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Atmospheric Background Glow */}
      <View style={styles.radialGlow} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header with Back Button and Logo */}
          <AuthHeader
            onBack={onBack}
            title="Welcome Back"
            subtitle="Login to continue your journey."
            showLogo={true}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Login Card Form */}
            <View style={styles.formCard}>
              {errorMessage ? (
                <View style={styles.bannerError}>
                  <Text style={styles.bannerErrorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Identifier Field */}
              <AuthInput
                label="Mobile Number or Username"
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text);
                  if (fieldErrors.mobile) {
                    setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
                  }
                }}
                placeholder="98765 43210 or Admin.Gauresh"
                keyboardType="default"
                autoCapitalize="none"
                leadingIcon={<Phone size={18} color="#16A34A" />}
                error={fieldErrors.mobile}
              />

              {/* Password Field */}
              <AuthInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Enter your password"
                secureTextEntry={true}
                leadingIcon={<Lock size={18} color="#16A34A" />}
                error={fieldErrors.password}
              />

              {/* Options Row: Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                  style={styles.rememberMeRow}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.rememberMeText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Login Button */}
              <AuthButton
                title="LOGIN"
                onPress={handleLoginSubmit}
                loading={loading}
                variant="primary"
                style={styles.submitBtn}
              />
            </View>

            {/* Footer: Create Account Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onRegister} activeOpacity={0.7}>
                <Text style={styles.footerLink}>CREATE ACCOUNT</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  radialGlow: {
    display: 'none',
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(23, 35, 27, 0.06)',
      },
    }),
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  bannerErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    marginTop: 2,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CDD7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  rememberMeText: {
    fontSize: 13,
    color: '#68756B',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  footerText: {
    fontSize: 14,
    color: '#68756B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.3,
  },
});
