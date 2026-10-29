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
} from 'react-native';
import { User, Phone, Mail, Lock, Check, Store, UserCheck } from 'lucide-react-native';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';
import { authService } from '../services/authService';

interface RegisterScreenProps {
  onRegister: (mobile?: string, registrationData?: { name: string; email: string; requestedRole: 'customer' | 'seller' }) => void;
  onLogin: () => void;
  onBack?: () => void;
}

export default function RegisterScreen({ onRegister, onLogin, onBack }: RegisterScreenProps) {
  const [accountRole, setAccountRole] = useState<'customer' | 'seller'>('customer');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    mobile?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (!cleanMobile) {
      errors.mobile = 'Mobile number is required';
    } else if (cleanMobile.length < 10) {
      errors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeTerms) {
      errors.terms = 'You must agree to the Terms and Privacy Policy';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async () => {
    if (!validate() || loading) return;

    setLoading(true);
    setErrorMessage('');

    const cleanMobile = mobile.replace(/\D/g, '');
    const payloadMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

    try {
      await authService.requestOtp(payloadMobile, 'register');
      onRegister(payloadMobile, { name: fullName.trim(), email: email.trim(), requestedRole: accountRole });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
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
            title="Create Account"
            subtitle="Join ECOSPHERE and be part of local growth."
            showLogo={true}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Registration Card Form */}
            <View style={styles.formCard}>
              {errorMessage ? (
                <View style={styles.bannerError}>
                  <Text style={styles.bannerErrorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Account Type Selection */}
              <View style={styles.roleSelectionContainer}>
                <Text style={styles.roleSelectionLabel}>Account Type</Text>
                <View style={styles.roleToggleRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAccountRole('customer')}
                    style={[
                      styles.roleOptionButton,
                      accountRole === 'customer' && styles.roleOptionActiveCustomer,
                    ]}
                  >
                    <UserCheck size={20} color={accountRole === 'customer' ? '#2FD6FF' : '#94A3B8'} />
                    <View style={styles.roleOptionTextContainer}>
                      <Text style={[styles.roleOptionTitle, accountRole === 'customer' && styles.roleOptionTitleActiveCustomer]}>
                        Customer / User
                      </Text>
                      <Text style={styles.roleOptionDesc}>Discover & Book</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setAccountRole('seller')}
                    style={[
                      styles.roleOptionButton,
                      accountRole === 'seller' && styles.roleOptionActiveSeller,
                    ]}
                  >
                    <Store size={20} color={accountRole === 'seller' ? '#25E68A' : '#94A3B8'} />
                    <View style={styles.roleOptionTextContainer}>
                      <Text style={[styles.roleOptionTitle, accountRole === 'seller' && styles.roleOptionTitleActiveSeller]}>
                        Seller / Employer
                      </Text>
                      <Text style={styles.roleOptionDesc}>Sell & Hire</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Name */}
              <AuthInput
                label="Full Name"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                  }
                }}
                placeholder="Aarav Sharma"
                autoCapitalize="words"
                leadingIcon={<User size={18} color="#2FD6FF" />}
                error={fieldErrors.fullName}
              />

              {/* Mobile Number */}
              <AuthInput
                label="Mobile Number"
                value={mobile}
                onChangeText={(text) => {
                  setMobile(text);
                  if (fieldErrors.mobile) {
                    setFieldErrors((prev) => ({ ...prev, mobile: undefined }));
                  }
                }}
                placeholder="98765 43210"
                keyboardType="phone-pad"
                prefix="+91"
                leadingIcon={<Phone size={18} color="#25E68A" />}
                error={fieldErrors.mobile}
              />

              {/* Email Address */}
              <AuthInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leadingIcon={<Mail size={18} color="#8B5CF6" />}
                error={fieldErrors.email}
              />

              {/* Password */}
              <AuthInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Create a strong password"
                secureTextEntry={true}
                leadingIcon={<Lock size={18} color="#25E68A" />}
                error={fieldErrors.password}
              />

              {/* Confirm Password */}
              <AuthInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                placeholder="Confirm your password"
                secureTextEntry={true}
                leadingIcon={<Lock size={18} color="#2FD6FF" />}
                error={fieldErrors.confirmPassword}
              />

              {/* Terms Checkbox */}
              <TouchableOpacity
                onPress={() => {
                  setAgreeTerms(!agreeTerms);
                  if (fieldErrors.terms) {
                    setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                  }
                }}
                activeOpacity={0.7}
                style={styles.termsRow}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxActive]}>
                  {agreeTerms && <Check size={12} color="#040814" strokeWidth={3} />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {fieldErrors.terms ? (
                <Text style={styles.termsError}>{fieldErrors.terms}</Text>
              ) : null}

              {/* Primary Create Account Button */}
              <AuthButton
                title="CREATE ACCOUNT"
                onPress={handleRegisterSubmit}
                loading={loading}
                variant="primary"
                style={styles.submitBtn}
              />
            </View>

            {/* Footer: Login Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onLogin} activeOpacity={0.7}>
                <Text style={styles.footerLink}>LOGIN</Text>
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CDD7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#68756B',
    lineHeight: 18,
  },
  termsLink: {
    color: '#16A34A',
    fontWeight: '600',
  },
  termsError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: -8,
    marginBottom: 12,
  },
  submitBtn: {
    marginTop: 6,
  },
  roleSelectionContainer: {
    marginBottom: 16,
  },
  roleSelectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#68756B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  roleOptionActiveCustomer: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  roleOptionActiveSeller: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  roleOptionTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#68756B',
  },
  roleOptionTitleActiveCustomer: {
    color: '#16A34A',
  },
  roleOptionTitleActiveSeller: {
    color: '#16A34A',
  },
  roleOptionDesc: {
    fontSize: 10,
    color: '#8E9C91',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
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
