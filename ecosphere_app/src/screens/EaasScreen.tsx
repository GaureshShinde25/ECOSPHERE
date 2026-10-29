import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { ArrowLeft, Sparkles, UserPlus, GraduationCap, DollarSign } from 'lucide-react-native';

interface EaasScreenProps {
  onBack: () => void;
}

export const EaasScreen: React.FC<EaasScreenProps> = ({ onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Header back button */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={Theme.colors.text} />
        <Text style={styles.backBtnText}>Home</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Employment-as-a-Service</Text>
      <Text style={styles.pageSubtitle}>AI-orchestrated micro-gigs and node creation to empower your region</Text>

      {/* Analysis Metrics */}
      <GlassCard style={styles.metricsCard}>
        <Text style={styles.metricsHeader}>City Diagnostics (Pune Hinjewadi)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>125k</Text>
            <Text style={styles.statLbl}>Active Population</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: Theme.colors.primaryGreen }]}>High</Text>
            <Text style={styles.statLbl}>Search Trends</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statVal}>8,450</Text>
            <Text style={styles.statLbl}>Businesses</Text>
          </View>
        </View>
      </GlassCard>

      {/* Recommended Gaps */}
      <Text style={styles.sectionTitle}>High Economic Gaps (Deficits)</Text>

      <GlassCard style={styles.oppCard} glow glowColor={Theme.colors.primaryGreen} borderColor="rgba(37, 230, 138, 0.2)">
        <View style={styles.oppHeader}>
          <View style={styles.oppBadge}>
            <Sparkles size={12} color={Theme.colors.primaryGreen} />
            <Text style={styles.oppBadgeText}>AI Recommendation</Text>
          </View>
          <Text style={styles.oppDeficit}>Deficit Found</Text>
        </View>
        <Text style={styles.oppTitle}>Local Laundry Services</Text>
        <Text style={styles.oppDesc}>There is a 240+ laundry order/day gap. The model suggests deploying laundry nodes immediately.</Text>

        <View style={styles.actionItems}>
          <View style={styles.actionItem}>
            <UserPlus size={16} color={Theme.colors.primaryBlue} />
            <Text style={styles.actionItemText}>Open 2 laundry centers</Text>
          </View>
          <View style={styles.actionItem}>
            <GraduationCap size={16} color={Theme.colors.primaryBlue} />
            <Text style={styles.actionItemText}>Train 5 workers (laundry ops)</Text>
          </View>
          <View style={styles.actionItem}>
            <DollarSign size={16} color={Theme.colors.primaryBlue} />
            <Text style={styles.actionItemText}>Need Investment: ₹3.2 Lakhs</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Deploy Node</Text>
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
    paddingBottom: 100,
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  pageSubtitle: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily,
  },
  metricsCard: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
  },
  metricsHeader: {
    color: Theme.colors.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  statLbl: {
    color: Theme.colors.secondaryText,
    fontSize: 11,
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
  oppCard: {
    padding: Theme.spacing.lg,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  oppBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  oppBadgeText: {
    color: Theme.colors.primaryGreen,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  oppDeficit: {
    color: Theme.colors.danger,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  oppTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  oppDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    lineHeight: 18,
    marginBottom: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily,
  },
  actionItems: {
    marginBottom: Theme.spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  actionItemText: {
    color: Theme.colors.text,
    fontSize: 13,
    marginLeft: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primaryGreen,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
  },
  primaryBtnText: {
    color: '#07111F',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
  },
});
