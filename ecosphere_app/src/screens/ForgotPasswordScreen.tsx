import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Phone, Lock, Check, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthInput } from '../components/auth/AuthInput';
import { AuthButton } from '../components/auth/AuthButton';
import { OTPInput, OTPInputRef } from '../components/auth/OTPInput';
import { authService } from '../services/authService';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: (identifier?: string) => void;
}

type Step = 'request' | 'otp' | 'reset' | 'success';

export default function ForgotPasswordScreen({ onBack, onSuccess }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);

  const otpInputRef = useRef<OTPInputRef>(null);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: any;
    if (step === 'otp') {
      if (timer > 0) {
        interval = setInterval(() => {
          setTimer((prev) => prev - 1);
        }, 1000);
      } else {
        setCanResend(true);
      }
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Request Password Reset OTP
  const handleRequestOtp = async () => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      setErrorMessage('Please enter your registered mobile number, email, or username.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.requestPasswordReset(trimmed);
      setMaskedIdentifier(res.maskedIdentifier || trimmed);
      setStep('otp');
      setTimer(30);
      setCanResend(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Account not found. Please register first.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.verifyPasswordResetOtp(identifier.trim(), otpCode.trim());
      if (res && res.resetToken) {
        setResetToken(res.resetToken);
        setStep('reset');
      } else {
        setErrorMessage('Failed to verify OTP. Please try again.');
        otpInputRef.current?.shake();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid verification code. Please try again.');
      otpInputRef.current?.shake();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMessage('');

    try {
      await authService.requestPasswordReset(identifier.trim());
      setTimer(30);
      setCanResend(false);
      setOtpCode('');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setErrorMessage('New password is required.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await authService.resetPassword(resetToken, newPassword.trim(), confirmPassword.trim());
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password. Please request a new OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Atmospheric Background Glow */}
      <View style={styles.radialGlow} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header */}
          <AuthHeader
            onBack={step === 'success' ? undefined : (step === 'otp' ? () => setStep('request') : onBack)}
            title={
              step === 'request'
                ? 'Forgot Password? 🔐'
                : step === 'otp'
                ? 'Verify Reset Code 🛡️'
                : step === 'reset'
                ? 'Set New Password 🔑'
                : 'Reset Successful 🎉'
            }
            subtitle={
              step === 'request'
                ? 'Enter your registered mobile number, email, or username.'
                : step === 'otp'
                ? `Enter the 6-digit code sent to\n${maskedIdentifier}`
                : step === 'reset'
                ? 'Create a strong, new password for your account.'
                : 'Your password has been successfully updated.'
            }
            showLogo={true}
          />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Main Form Card */}
            <View style={styles.formCard}>
              {errorMessage ? (
                <View style={styles.bannerError}>
                  <Text style={styles.bannerErrorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* STEP 1: Enter Identifier */}
              {step === 'request' && (
                <>
                  <AuthInput
                    label="Registered Mobile, Email, or Username"
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="98765 43210 or user@ecosphere.io"
                    keyboardType="default"
                    autoCapitalize="none"
                    leadingIcon={<Phone size={18} color="#25E68A" />}
                  />

                  <AuthButton
                    title="SEND OTP"
                    onPress={handleRequestOtp}
                    loading={loading}
                    variant="primary"
                    style={styles.submitBtn}
                  />

                  <TouchableOpacity
                    onPress={onBack}
                    activeOpacity={0.7}
                    style={styles.backToLoginBtn}
                  >
                    <Text style={styles.backToLoginText}>← Back to Login</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2: Verify OTP */}
              {step === 'otp' && (
                <>
                  <View style={styles.otpWrapper}>
                    <OTPInput
                      ref={otpInputRef}
                      code={otpCode}
                      onChangeCode={(c) => {
                        setOtpCode(c);
                        if (errorMessage) setErrorMessage('');
                      }}
                      length={6}
                    />
                  </View>

                  <View style={styles.resendRow}>
                    {canResend ? (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        activeOpacity={0.7}
                        disabled={resending}
                        style={styles.resendBtn}
                      >
                        <RefreshCw size={14} color="#25E68A" style={{ marginRight: 6 }} />
                        <Text style={styles.resendBtnText}>Resend Code</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.timerText}>
                        Resend code in <Text style={styles.timerHighlight}>{timer}s</Text>
                      </Text>
                    )}
                  </View>

                  <AuthButton
                    title="VERIFY OTP"
                    onPress={handleVerifyOtp}
                    loading={loading}
                    variant="primary"
                    style={styles.submitBtn}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      setStep('request');
                      setErrorMessage('');
                    }}
                    activeOpacity={0.7}
                    style={styles.backToLoginBtn}
                  >
                    <Text style={styles.backToLoginText}>← Change Mobile / Email</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 3: Set New Password */}
              {step === 'reset' && (
                <>
                  <AuthInput
                    label="New Password"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Enter new password (min. 6 characters)"
                    secureTextEntry={true}
                    leadingIcon={<Lock size={18} color="#2FD6FF" />}
                  />

                  <AuthInput
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Re-enter new password"
                    secureTextEntry={true}
                    leadingIcon={<Check size={18} color="#25E68A" />}
                  />

                  <AuthButton
                    title="RESET PASSWORD"
                    onPress={handleResetPassword}
                    loading={loading}
                    variant="primary"
                    style={styles.submitBtn}
                  />
                </>
              )}

              {/* STEP 4: Success Message */}
              {step === 'success' && (
                <View style={styles.successContainer}>
                  <View style={styles.successIconBox}>
                    <CheckCircle2 size={48} color="#25E68A" />
                  </View>

                  <Text style={styles.successTitle}>Password Reset Successful!</Text>
                  <Text style={styles.successDesc}>
                    Your account password has been updated securely. You can now log in using your new credentials.
                  </Text>

                  <AuthButton
                    title="LOGIN NOW"
                    onPress={() => onSuccess(identifier.trim())}
                    variant="primary"
                    style={styles.submitBtn}
                  />
                </View>
              )}
            </View>

            {/* Footer */}
            {step !== 'success' && (
              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                  <Text style={styles.footerLink}>LOGIN</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040814',
  },
  radialGlow: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 230, 138, 0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#25E68A',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 60,
      },
      web: {
        filter: 'blur(70px)',
      },
    }),
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
    backgroundColor: 'rgba(11, 19, 32, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  bannerErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  otpWrapper: {
    marginVertical: 14,
    alignItems: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    color: '#25E68A',
    fontSize: 13,
    fontWeight: '700',
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  timerHighlight: {
    color: '#25E68A',
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 12,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  backToLoginText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  successDesc: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  footerLink: {
    color: '#25E68A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
