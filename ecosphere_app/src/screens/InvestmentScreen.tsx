import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Theme } from '../constants/Theme';
import { GlassCard } from '../components/GlassCard';
import { Sparkles, ArrowUpRight, TrendingUp } from 'lucide-react-native';

interface InvestmentScreenProps {
  onBack: () => void;
}

export const InvestmentScreen: React.FC<InvestmentScreenProps> = ({ onBack }) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Investment Nodes</Text>
      <Text style={styles.pageSubtitle}>Support local micro-businesses and secure dividends from local production</Text>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <View style={[styles.tab, styles.tabActive]}><Text style={[styles.tabText, styles.tabTextActive]}>All</Text></View>
        <View style={styles.tab}><Text style={styles.tabText}>Low Risk</Text></View>
        <View style={styles.tab}><Text style={styles.tabText}>Medium Risk</Text></View>
        <View style={styles.tab}><Text style={styles.tabText}>High Yield</Text></View>
      </View>

      {/* Opportunities */}
      <GlassCard style={styles.oppCard} glow glowColor={Theme.colors.primaryGreen} borderColor="rgba(37, 230, 138, 0.2)">
        <View style={styles.oppHeader}>
          <Text style={styles.oppTitle}>Laundry Business Node</Text>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>Low Risk</Text>
          </View>
        </View>
        <Text style={styles.oppSpecs}>Hinjewadi Node • Target: ₹3,00,000</Text>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>15% P.A.</Text>
            <Text style={styles.metricLbl}>Est. Dividend</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>₹2,10,000</Text>
            <Text style={styles.metricLbl}>Funded So Far</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.investBtn}>
          <Text style={styles.investBtnText}>Invest Now</Text>
          <ArrowUpRight size={16} color="#07111F" />
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={styles.oppCard}>
        <View style={styles.oppHeader}>
          <Text style={styles.oppTitle}>EV Charging Station Node</Text>
          <View style={[styles.riskBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
            <Text style={[styles.riskText, { color: Theme.colors.accent }]}>Medium Risk</Text>
          </View>
        </View>
        <Text style={styles.oppSpecs}>Wakad Node • Target: ₹8,00,000</Text>

        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>21% P.A.</Text>
            <Text style={styles.metricLbl}>Est. Dividend</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricVal}>₹5,50,000</Text>
            <Text style={styles.metricLbl}>Funded So Far</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.investBtn}>
          <Text style={styles.investBtnText}>Invest Now</Text>
          <ArrowUpRight size={16} color="#07111F" />
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: Theme.colors.secondaryBackground,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabActive: {
    backgroundColor: Theme.colors.primaryBlue,
    borderColor: Theme.colors.primaryBlue,
  },
  tabText: {
    color: Theme.colors.secondaryText,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  tabTextActive: {
    color: '#07111F',
  },
  oppCard: {
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  oppTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  riskBadge: {
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  riskText: {
    color: Theme.colors.primaryGreen,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
  oppSpecs: {
    color: Theme.colors.secondaryText,
    fontSize: 12,
    marginBottom: Theme.spacing.md,
    fontFamily: Theme.typography.fontFamily,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: Theme.spacing.md,
  },
  metricItem: {
    flex: 1,
  },
  metricVal: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  metricLbl: {
    color: Theme.colors.secondaryText,
    fontSize: 11,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  investBtn: {
    backgroundColor: Theme.colors.primaryBlue,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Theme.radius.md,
  },
  investBtnText: {
    color: '#07111F',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 6,
    fontFamily: Theme.typography.fontFamily,
  },
});
