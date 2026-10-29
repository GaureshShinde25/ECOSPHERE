import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Sparkles, TrendingUp, Users, ShoppingBag, Lightbulb } from 'lucide-react-native';
import { GlassCard } from '../../components/cards/GlassCard';
import { AIInsightCard } from '../../components/cards/AIInsightCard';
import { mockAIInsights } from '../../data/mockData';
import { Theme } from '../../theme';

export const SellerInsightsScreen: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | '3M' | '1Y'>('30D');

  const sellerInsightsList = [
    {
      id: 'ins_01',
      title: 'Customer Demand Spike',
      description: 'Customer demand increased 18% this week for technical electrical diagnostics in Hinjewadi Phase 1.',
      growthPercentage: 18,
      opportunityScore: 92,
      category: 'Services',
      location: 'Hinjewadi Node',
      actionableStep: 'Extend evening slot availability to capture 22+ unfulfilled requests.',
    },
    {
      id: 'ins_02',
      title: 'Peak Shopping Hours',
      description: 'Your highest footfall and cart conversions occur between 6:00 PM and 9:00 PM on weekdays.',
      growthPercentage: 25,
      opportunityScore: 88,
      category: 'Commerce',
      location: 'Storefront Node',
      actionableStep: 'Schedule flash promotions at 5:30 PM.',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <View style={styles.badge}>
              <Sparkles size={14} color={Theme.colors.primary} />
              <Text style={styles.badgeText}>AI Business Intelligence</Text>
            </View>
            <Text style={styles.pageTitle}>Seller Analytics & Insights</Text>
            <Text style={styles.pageSub}>Automated growth recommendations and economic velocity</Text>
          </View>

          {/* Time Filter Pills */}
          <View style={styles.timeFilterRow}>
            {(['7D', '30D', '3M', '1Y'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, timeFilter === filter && styles.filterChipActive]}
                onPress={() => setTimeFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, timeFilter === filter && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Performance Overview */}
          <GlassCard style={styles.perfCard}>
            <Text style={styles.cardHeader}>GROWTH METRICS ({timeFilter})</Text>

            <View style={styles.perfGrid}>
              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>+28.4%</Text>
                <Text style={styles.perfLbl}>Revenue Velocity</Text>
              </View>

              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>+14.2%</Text>
                <Text style={styles.perfLbl}>Customer Retention</Text>
              </View>

              <View style={styles.perfItem}>
                <Text style={styles.perfVal}>4.8 ★</Text>
                <Text style={styles.perfLbl}>Rating Score</Text>
              </View>
            </View>
          </GlassCard>

          {/* AI Insights Recommendations List */}
          <Text style={styles.sectionTitle}>Actionable AI Recommendations</Text>
          {sellerInsightsList.map((ins) => (
            <AIInsightCard key={ins.id} insight={ins} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110,
  },
  topHeader: {
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  pageSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  timeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  filterTextActive: {
    color: '#07111F',
    fontWeight: '800',
  },
  perfCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Theme.typography.fontFamily,
  },
  perfGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  perfItem: {
    alignItems: 'center',
  },
  perfVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  perfLbl: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 12,
  },
});
