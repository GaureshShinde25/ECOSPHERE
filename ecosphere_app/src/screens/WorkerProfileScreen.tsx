import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { Star, Shield, Award, Calendar, ArrowLeft } from 'lucide-react-native';

interface WorkerProfileScreenProps {
  onBack: () => void;
}

export const WorkerProfileScreen: React.FC<WorkerProfileScreenProps> = ({ onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Back Header */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={Theme.colors.text} />
        <Text style={styles.backBtnText}>Explore Workers</Text>
      </TouchableOpacity>

      {/* Profile Header */}
      <GlassCard style={styles.profileHero}>
        <View style={styles.avatarWrapper}>
          <Text style={styles.avatarText}>RK</Text>
        </View>
        <Text style={styles.workerName}>Ravi Kumar</Text>
        <Text style={styles.workerRole}>Lead Electrician & Solar Installer</Text>

        <View style={styles.levelRow}>
          <View style={styles.levelBadge}>
            <Award size={12} color={Theme.colors.primaryBlue} />
            <Text style={styles.levelText}>Level 7 Specialist</Text>
          </View>
          <View style={styles.starsBadge}>
            <Star size={12} color={Theme.colors.primaryGreen} />
            <Text style={styles.starsText}>4.9 (320 jobs)</Text>
          </View>
        </View>
      </GlassCard>

      {/* Stats Summary */}
      <View style={styles.metricsRow}>
        <GlassCard style={styles.metricItem}>
          <Text style={styles.metricVal}>1,230</Text>
          <Text style={styles.metricLbl}>Jobs Done</Text>
        </GlassCard>

        <GlassCard style={styles.metricItem}>
          <Text style={styles.metricVal}>6 Years</Text>
          <Text style={styles.metricLbl}>Experience</Text>
        </GlassCard>

        <GlassCard style={styles.metricItem}>
          <Text style={styles.metricVal}>12</Text>
          <Text style={styles.metricLbl}>Certificates</Text>
        </GlassCard>
      </View>

      {/* Skill Nodes */}
      <Text style={styles.sectionTitle}>Skill Nodes</Text>
      <View style={styles.skillsWrapper}>
        <View style={styles.skillBadge}><Text style={styles.skillText}>Electrical Wiring</Text></View>
        <View style={styles.skillBadge}><Text style={styles.skillText}>Home Automation</Text></View>
        <View style={styles.skillBadge}><Text style={styles.skillText}>Solar Panel Installation</Text></View>
        <View style={styles.skillBadge}><Text style={styles.skillText}>Fault Diagnostics</Text></View>
      </View>

      {/* Certifications */}
      <Text style={styles.sectionTitle}>Verification & Badges</Text>
      <GlassCard style={styles.certCard}>
        <View style={styles.certRow}>
          <Shield size={20} color={Theme.colors.primaryGreen} />
          <View style={styles.certTextContainer}>
            <Text style={styles.certTitle}>Identity Verified</Text>
            <Text style={styles.certDesc}>Government ID & Address fully approved</Text>
          </View>
        </View>
        <View style={[styles.certRow, styles.certRowBorder]}>
          <Award size={20} color={Theme.colors.primaryBlue} />
          <View style={styles.certTextContainer}>
            <Text style={styles.certTitle}>State Licensing Board</Text>
            <Text style={styles.certDesc}>Class-A Electrical Works License</Text>
          </View>
        </View>
      </GlassCard>

      {/* Booking Footer */}
      <GlassCard style={styles.bookingFooter}>
        <View>
          <Text style={styles.availText}>Availability</Text>
          <View style={styles.availIndicatorRow}>
            <View style={styles.dot} />
            <Text style={styles.availStatus}>Available Now</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn}>
          <Calendar size={16} color="#07111F" style={{ marginRight: 6 }} />
          <Text style={styles.primaryBtnText}>Book Ravi</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: 120,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  backBtnText: {
    color: Theme.colors.text,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  profileHero: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.colors.secondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.accent,
    marginBottom: Theme.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.accent,
    fontFamily: Theme.typography.fontFamily,
  },
  workerName: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  workerRole: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  levelRow: {
    flexDirection: 'row',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: Theme.spacing.sm,
  },
  levelText: {
    color: Theme.colors.primaryBlue,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  starsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  starsText: {
    color: Theme.colors.primaryGreen,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  metricItem: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  metricLbl: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Theme.spacing.lg,
  },
  skillBadge: {
    backgroundColor: Theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 8,
  },
  skillText: {
    color: Theme.colors.text,
    fontSize: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  certCard: {
    marginBottom: Theme.spacing.xl,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  certRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.md,
  },
  certTextContainer: {
    marginLeft: Theme.spacing.md,
  },
  certTitle: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  certDesc: {
    color: Theme.colors.secondaryText,
    fontSize: 12,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availText: {
    color: Theme.colors.secondaryText,
    fontSize: 11,
    fontFamily: Theme.typography.fontFamily,
  },
  availIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.primaryGreen,
    marginRight: 6,
  },
  availStatus: {
    color: Theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Theme.radius.md,
  },
  primaryBtnText: {
    color: '#07111F',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
  },
});
