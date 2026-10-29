import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../theme';

interface OnboardingContainerProps {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onPrimaryAction: () => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  primaryActionLoading?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  headerRight?: React.ReactNode;
}

export const OnboardingContainer: React.FC<OnboardingContainerProps> = ({
  step,
  totalSteps = 5,
  title,
  subtitle,
  onBack,
  onPrimaryAction,
  primaryActionLabel = 'CONTINUE',
  primaryActionDisabled = false,
  primaryActionLoading = false,
  onSkip,
  skipLabel = 'Skip for now',
  children,
  scrollable = true,
  headerRight,
}) => {
  const stepFormatted = `0${step}`.slice(-2);
  const totalFormatted = `0${totalSteps}`.slice(-2);
  const progressPercent = Math.min(100, Math.max(0, (step / totalSteps) * 100));

  const content = (
    <View style={styles.contentInner}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>{children}</View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Subtle Atmospheric Radial Gradients */}
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          {/* Top Onboarding Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {onBack ? (
                <TouchableOpacity
                  onPress={onBack}
                  activeOpacity={0.7}
                  style={styles.backButton}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <ArrowLeft size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}
            </View>

            {/* Step Counter Badge */}
            <View style={styles.stepBadge}>
              <Text style={styles.stepCurrent}>{stepFormatted}</Text>
              <Text style={styles.stepDivider}>/</Text>
              <Text style={styles.stepTotal}>{totalFormatted}</Text>
            </View>

            <View style={styles.headerRight}>{headerRight || <View style={styles.backButtonPlaceholder} />}</View>
          </View>

          {/* Micro Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Scrollable / Static Body */}
          {scrollable ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {content}
            </ScrollView>
          ) : (
            <View style={styles.staticContent}>{content}</View>
          )}

          {/* Sticky Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={onPrimaryAction}
              disabled={primaryActionDisabled || primaryActionLoading}
              activeOpacity={0.88}
              style={[
                styles.primaryButton,
                primaryActionDisabled && styles.primaryButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel={primaryActionLabel}
            >
              <LinearGradient
                colors={
                  primaryActionDisabled
                    ? ['rgba(16, 185, 129, 0.25)', 'rgba(20, 184, 166, 0.25)']
                    : ['#10B981', '#059669']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                {primaryActionLoading ? (
                  <ActivityIndicator size="small" color="#040814" />
                ) : (
                  <>
                    <Text
                      style={[
                        styles.primaryButtonText,
                        primaryActionDisabled && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      {primaryActionLabel}
                    </Text>
                    <ArrowRight
                      size={18}
                      color={primaryActionDisabled ? 'rgba(255,255,255,0.4)' : '#FFFFFF'}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {onSkip ? (
              <TouchableOpacity
                onPress={onSkip}
                activeOpacity={0.7}
                style={styles.skipButton}
                accessibilityRole="button"
                accessibilityLabel={skipLabel}
              >
                <Text style={styles.skipButtonText}>{skipLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040814',
  },
  safeArea: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -80,
    left: '15%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(20, 184, 166, 0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    width: 44,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 32, 0.75)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepCurrent: {
    color: '#25E68A',
    fontWeight: '800',
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily,
    letterSpacing: 0.5,
  },
  stepDivider: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    marginHorizontal: 4,
  },
  stepTotal: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  progressBarFill: {
    height: 3,
    backgroundColor: '#25E68A',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  staticContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  contentInner: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 22,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#8FA0B5',
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  mainContent: {
    flex: 1,
  },
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 14 : 20,
    backgroundColor: 'rgba(4, 8, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  primaryButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  skipButtonText: {
    fontSize: 13,
    color: '#8FA0B5',
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
});
