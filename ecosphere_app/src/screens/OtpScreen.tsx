import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Check, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { AuthHeader } from '../components/auth/AuthHeader';
import { AuthButton } from '../components/auth/AuthButton';
import { OTPInput, OTPInputRef } from '../components/auth/OTPInput';
import { authService } from '../services/authService';
import { User, UserRole } from '../types';

interface OtpScreenProps {
  mobile?: string;
  registrationData?: { name?: string; email?: string; requestedRole?: UserRole };
  onVerified: (user?: User) => void;
  onBack: () => void;
}

export default function OtpScreen({ mobile, registrationData, onVerified, onBack }: OtpScreenProps) {
  const [code, setCode] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const otpInputRef = useRef<OTPInputRef>(null);

  // Success check animation
  const successScale = useRef(new Animated.Value(0.4)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Target mobile normalization
  const cleanMobile = (mobile || '').replace(/\D/g, '');
  const displayMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;
  const maskedMobile = `+91 ••••• •••${displayMobile.slice(-2)}`;

  // Countdown timer logic
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (code.length !== 6 || verifying) return;

    setVerifying(true);
    setErrorMessage('');

    try {
      const intent: 'login' | 'register' = registrationData ? 'register' : 'login';
      const response = await authService.verifyOtp(displayMobile, code, registrationData, intent);
      if (response && response.success) {
        setIsSuccess(true);
        Animated.parallel([
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(successScale, {
            toValue: 1,
            friction: 5,
            tension: 45,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            onVerified(response.user);
          }, 900);
        });
      } else {
        setErrorMessage('Invalid verification code. Please try again.');
        otpInputRef.current?.shake();
        setCode('');
        setTimeout(() => otpInputRef.current?.focus(), 150);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid verification code. Please try again.');
      otpInputRef.current?.shake();
      setCode('');
      setTimeout(() => otpInputRef.current?.focus(), 150);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMessage('');

    try {
      const intent: 'login' | 'register' = registrationData ? 'register' : 'login';
      await authService.requestOtp(displayMobile, intent);
      setTimer(30);
      setCanResend(false);
      setCode('');
      setTimeout(() => otpInputRef.current?.focus(), 100);
    } catch {
      // Quiet retry fallback
      setTimer(30);
      setCanResend(false);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          {/* Header with Back Button and Logo */}
          <AuthHeader
            onBack={onBack}
            title="Verify OTP"
            subtitle="We have sent a 6-digit code to your registered contact."
            showLogo={true}
          />

          <View style={styles.content}>
            {/* Change Number Link */}
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              style={styles.changeNumberBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changeNumberText}>Change mobile number</Text>
            </TouchableOpacity>

            {/* OTP Card Container */}
            <View style={styles.formCard}>
              {errorMessage ? (
                <View style={styles.bannerError}>
                  <Text style={styles.bannerErrorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 6-Digit OTP Input */}
              <OTPInput
                ref={otpInputRef}
                code={code}
                onChangeCode={(newCode) => {
                  setCode(newCode);
                  if (errorMessage) setErrorMessage('');
                }}
                disabled={verifying || isSuccess}
              />

              {/* Resend Code Section */}
              <View style={styles.resendRow}>
                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResend}
                    activeOpacity={0.7}
                    disabled={resending}
                    style={styles.resendBtn}
                  >
                    <RefreshCw size={14} color="#16A34A" style={{ marginRight: 6 }} />
                    <Text style={styles.resendActiveText}>
                      {resending ? 'Sending...' : 'RESEND CODE'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.timerText}>
                    Resend code in <Text style={styles.timerHighlight}>0:{timer < 10 ? `0${timer}` : timer}</Text>
                  </Text>
                )}
              </View>

              {/* Primary Verify Button */}
              <AuthButton
                title="VERIFY"
                onPress={handleVerify}
                loading={verifying}
                disabled={code.length !== 6 || isSuccess}
                variant="primary"
                style={styles.verifyBtn}
              />
            </View>

            {/* Development OTP Hint for seamless testing */}
            <View style={styles.devHintRow}>
              <ShieldCheck size={14} color="#68756B" style={{ marginRight: 6 }} />
              <Text style={styles.devHintText}>Development bypass code: 123456</Text>
            </View>
          </View>

          {/* Success Animated Feedback Overlay */}
          {isSuccess && (
            <Animated.View
              style={[
                styles.successOverlay,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <View style={styles.successCircle}>
                <Check size={40} color="#FFFFFF" strokeWidth={3.5} />
              </View>
              <Text style={styles.successTitle}>Verified!</Text>
              <Text style={styles.successSubtitle}>Welcome to ECOSPHERE</Text>
            </Animated.View>
          )}
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
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
  },
  changeNumberBtn: {
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  changeNumberText: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      web: {
        boxShadow: '0 4px 16px rgba(23, 35, 27, 0.04)',
      },
    }),
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  bannerErrorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 28,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendActiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 13,
    color: '#68756B',
  },
  timerHighlight: {
    color: '#17231B',
    fontWeight: '600',
  },
  verifyBtn: {
    marginTop: 4,
  },
  devHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  devHintText: {
    fontSize: 12,
    color: '#68756B',
  },
  successOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(248, 250, 247, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      web: {
        boxShadow: '0 4px 16px rgba(22, 163, 74, 0.3)',
      },
    }),
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#17231B',
    letterSpacing: -0.2,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#68756B',
    marginTop: 4,
  },
});
