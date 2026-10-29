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
import { BarChart3, TrendingUp, Users, Store, Briefcase, DollarSign } from 'lucide-react-native';
import { GlassCard } from '../../components/cards/GlassCard';
import { Theme } from '../../theme';

export const AdminAnalyticsScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30D' | '90D' | '1Y'>('30D');

  const analyticsData = [
    { label: 'User Growth', value: '+34.2%', count: '14,280 users', color: Theme.colors.primary, icon: Users },
    { label: 'Seller Growth', value: '+18.6%', count: '342 verified sellers', color: Theme.colors.success, icon: Store },
    { label: 'Job Postings Growth', value: '+24.1%', count: '186 active listings', color: Theme.colors.purple, icon: Briefcase },
    { label: 'Transaction Velocity', value: '+42.8%', count: '₹48.2 Lakhs volume', color: Theme.colors.orange, icon: DollarSign },
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Ecosystem Growth Analytics</Text>
            <Text style={styles.pageSub}>Macroeconomic velocity and platform retention metrics</Text>
          </View>

          {/* Time Filter Pills */}
          <View style={styles.filterRow}>
            {(['30D', '90D', '1Y'] as const).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.filterChip, timeRange === range && styles.filterChipActive]}
                onPress={() => setTimeRange(range)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, timeRange === range && styles.filterTextActive]}>
                  {range}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Growth Cards */}
          <View style={styles.grid}>
            {analyticsData.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <GlassCard key={idx} style={styles.statCard}>
                  <View style={styles.cardTop}>
                    <IconComp size={20} color={item.color} />
                    <View style={styles.growthTag}>
                      <TrendingUp size={12} color={Theme.colors.success} />
                      <Text style={styles.growthText}>{item.value}</Text>
                    </View>
                  </View>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statCount}>{item.count}</Text>
                </GlassCard>
              );
            })}
          </View>

          {/* Engagement & Retention Breakdown */}
          <Text style={styles.sectionTitle}>Platform Retention & Engagement</Text>
          <GlassCard style={styles.retentionCard}>
            <View style={styles.retRow}>
              <Text style={styles.retTitle}>30-Day Active User Retention</Text>
              <Text style={styles.retVal}>78.4%</Text>
            </View>

            <View style={styles.retDivider} />

            <View style={styles.retRow}>
              <Text style={styles.retTitle}>Local Service Match Rate</Text>
              <Text style={styles.retVal}>94.2%</Text>
            </View>

            <View style={styles.retDivider} />

            <View style={styles.retRow}>
              <Text style={styles.retTitle}>Employment Application Conversion</Text>
              <Text style={styles.retVal}>32.8%</Text>
            </View>
          </GlassCard>
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
    paddingBottom: 40,
  },
  topHeader: {
    marginBottom: 16,
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
  filterRow: {
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
  grid: {
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  growthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  statCount: {
    fontSize: 12,
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
  retentionCard: {
    padding: 16,
  },
  retRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  retTitle: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  retVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  retDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 8,
  },
});
