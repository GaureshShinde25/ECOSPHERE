import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { Check, ShieldCheck, MapPin, Sparkles, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from '../../types';
import { Theme } from '../../theme';

interface CompletionSummaryData {
  name: string;
  role: UserRole;
  city: string;
  interests: string[];
  skills: string[];
  workPreferences: string[];
}

interface CompletionScreenProps {
  data: CompletionSummaryData;
  onBack: () => void;
  onEnterApp: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  data,
  onBack,
  onEnterApp,
}) => {
  const roleDisplay = data.role === 'seller'
    ? 'Seller / Business'
    : data.role === 'administrator'
    ? 'Administrator'
    : 'Customer / Member';

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Atmospheric Radial Gradients */}
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header with Back Navigation */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.stepBadge}>
            <Text style={styles.stepCurrent}>05</Text>
            <Text style={styles.stepDivider}>/</Text>
            <Text style={styles.stepTotal}>05</Text>
          </View>

          <View style={styles.backButtonPlaceholder} />
        </View>

        {/* Progress Bar Complete */}
        <View style={styles.progressBarBackground}>
          <View style={styles.progressBarFill} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Central Celebration Emblem */}
          <View style={styles.emblemContainer}>
            <View style={styles.outerAura}>
              <View style={styles.middleAura}>
                <LinearGradient
                  colors={['#25E68A', '#2FD6FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.innerEmblem}
                >
                  <ShieldCheck size={40} color="#040814" strokeWidth={2.4} />
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Title & Explainer */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>You're ready.</Text>
            <Text style={styles.subtitle}>
              ECOSPHERE is now configured around your location, your skills and your economic goals.
            </Text>
          </View>

          {/* Profile Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.userProfileInfo}>
                <Text style={styles.userName}>{data.name || 'ECOSPHERE Member'}</Text>
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{roleDisplay.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.cityPill}>
                <MapPin size={13} color="#2FD6FF" />
                <Text style={styles.cityPillText}>{data.city || 'Kolkata'}</Text>
              </View>
            </View>

            {/* Economic Goals Summary */}
            {data.interests.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={14} color="#25E68A" />
                  <Text style={styles.sectionTitle}>ECONOMIC FOCUS</Text>
                </View>
                <View style={styles.pillsWrap}>
                  {data.interests.map((interest, idx) => (
                    <View key={idx} style={styles.interestChip}>
                      <Text style={styles.interestChipText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Skills Summary */}
            {data.skills.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.sectionTitleRow}>
                  <Check size={14} color="#2FD6FF" />
                  <Text style={styles.sectionTitle}>CONFIRMED SKILLS</Text>
                </View>
                <View style={styles.pillsWrap}>
                  {data.skills.map((skill, idx) => (
                    <View key={idx} style={styles.skillChip}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Work Preferences Summary */}
            {data.workPreferences.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.sectionTitleRow}>
                  <Briefcase size={14} color="#8FA0B5" />
                  <Text style={styles.sectionTitle}>WORK ENGAGEMENT</Text>
                </View>
                <View style={styles.pillsWrap}>
                  {data.workPreferences.map((pref, idx) => (
                    <View key={idx} style={styles.prefChip}>
                      <Text style={styles.prefChipText}>{pref}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Sticky Bottom Primary CTA */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={onEnterApp}
            activeOpacity={0.88}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Enter ECOSPHERE"
          >
            <LinearGradient
              colors={['#25E68A', '#2FD6FF', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>ENTER ECOSPHERE</Text>
              <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  ambientGlowTop: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(47, 214, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 30,
    alignItems: 'center',
  },
  emblemContainer: {
    marginVertical: 18,
    alignItems: 'center',
  },
  outerAura: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleAura: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(37, 230, 138, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerEmblem: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8FA0B5',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(11, 19, 32, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    borderRadius: 20,
    padding: 20,
    gap: 18,
    shadowColor: '#25E68A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 14,
  },
  userProfileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#25E68A',
    letterSpacing: 0.5,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2FD6FF',
    fontFamily: Theme.typography.fontFamily,
  },
  summarySection: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B5',
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  interestChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  skillChip: {
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2FD6FF',
    fontFamily: Theme.typography.fontFamily,
  },
  prefChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  prefChipText: {
    fontSize: 12,
    color: '#8FA0B5',
    fontFamily: Theme.typography.fontFamily,
  },
  bottomBar: {
    width: '100%',
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
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
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
});
