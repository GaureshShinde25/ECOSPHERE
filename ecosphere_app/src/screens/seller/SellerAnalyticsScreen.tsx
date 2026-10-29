import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Award,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { sellerDashboardService, SellerDashboardData } from '../../services/sellerDashboardService';
import { activeBusinessService } from '../../services/activeBusinessService';

interface SellerAnalyticsScreenProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string, params?: any) => void;
}

type Timeframe = '7D' | '30D' | '3M' | '1Y';

export const SellerAnalyticsScreen: React.FC<SellerAnalyticsScreenProps> = ({
  onBack,
  onNavigateTab,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('30D');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashData, setDashData] = useState<SellerDashboardData | null>(null);

  const loadAnalytics = async () => {
    try {
      const biz = activeBusinessService.getActiveBusiness();
      const data = await sellerDashboardService.getDashboardData(biz?.id);
      setDashData(data);
    } catch (err) {
      if (__DEV__) console.warn('[SellerAnalyticsScreen] Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  // Mocked dynamic datasets per timeframe for authentic analytics presentation
  const getChartData = () => {
    if (timeframe === '7D') {
      return [
        { label: 'Mon', height: 45, value: '₹4.2k' },
        { label: 'Tue', height: 65, value: '₹6.8k' },
        { label: 'Wed', height: 50, value: '₹5.1k' },
        { label: 'Thu', height: 80, value: '₹8.4k' },
        { label: 'Fri', height: 95, value: '₹10.5k' },
        { label: 'Sat', height: 110, value: '₹12.8k' },
        { label: 'Sun', height: 85, value: '₹9.2k' },
      ];
    }
    if (timeframe === '30D') {
      return [
        { label: 'Week 1', height: 50, value: '₹18.4k' },
        { label: 'Week 2', height: 75, value: '₹26.1k' },
        { label: 'Week 3', height: 60, value: '₹21.8k' },
        { label: 'Week 4', height: 105, value: '₹34.6k' },
      ];
    }
    if (timeframe === '3M') {
      return [
        { label: 'Month 1', height: 65, value: '₹72k' },
        { label: 'Month 2', height: 85, value: '₹89k' },
        { label: 'Month 3', height: 110, value: '₹118k' },
      ];
    }
    return [
      { label: 'Q1', height: 60, value: '₹240k' },
      { label: 'Q2', height: 78, value: '₹310k' },
      { label: 'Q3', height: 95, value: '₹390k' },
      { label: 'Q4', height: 110, value: '₹460k' },
    ];
  };

  const chartData = getChartData();

  const totalRevenue = timeframe === '7D'
    ? '₹57,000'
    : timeframe === '30D'
    ? '₹100,900'
    : timeframe === '3M'
    ? '₹279,000'
    : '₹1,400,000';

  const totalOrdersCount = timeframe === '7D' ? 48 : timeframe === '30D' ? 192 : timeframe === '3M' ? 580 : 2840;

  const topProducts = [
    { rank: 1, title: 'Farm Fresh Organic Tomatoes', sold: '142 kg', revenue: '₹5,680' },
    { rank: 2, title: 'Pure A2 Cow Milk', sold: '98 packs', revenue: '₹6,860' },
    { rank: 3, title: 'Alphonso Mango Reserve Box', sold: '32 boxes', revenue: '₹19,200' },
    { rank: 4, title: 'Cold-Pressed Groundnut Oil', sold: '26 liters', revenue: '₹7,280' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.emerald} />
        <Text style={styles.loadingText}>Calculating store performance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics & Insights</Text>
          <Text style={styles.headerSubtitle}>Financial growth & customer engagement</Text>
        </View>

        {/* Timeframe Chips */}
        <View style={styles.timeframeTabs}>
          {(['7D', '30D', '3M', '1Y'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.tfBtn, timeframe === tf && styles.tfBtnActive]}
              onPress={() => setTimeframe(tf)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tfText, timeframe === tf && styles.tfTextActive]}>{tf}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.emerald]} />
        }
      >
        {/* Metric Cards 2x2 Grid */}
        <View style={styles.metricGrid}>
          {/* Card 1: Revenue */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <View style={[styles.metricIconBadge, { backgroundColor: '#EAF7EE' }]}>
                <TrendingUp size={18} color="#16A34A" />
              </View>
              <View style={styles.trendPill}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.trendText}>+22.4%</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{totalRevenue}</Text>
            <Text style={styles.metricLabel}>Total Revenue</Text>
          </View>

          {/* Card 2: Orders */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <View style={[styles.metricIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag size={18} color="#2563EB" />
              </View>
              <View style={styles.trendPill}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.trendText}>+14%</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>{totalOrdersCount}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </View>

          {/* Card 3: Average Order Value */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <View style={[styles.metricIconBadge, { backgroundColor: '#FEF9C3' }]}>
                <CreditCard size={18} color="#D97706" />
              </View>
              <View style={styles.trendPill}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.trendText}>+8.5%</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>₹525</Text>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
          </View>

          {/* Card 4: Repeat Customer Rate */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconRow}>
              <View style={[styles.metricIconBadge, { backgroundColor: '#FDF2F8' }]}>
                <Users size={18} color="#DB2777" />
              </View>
              <View style={styles.trendPill}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.trendText}>+18%</Text>
              </View>
            </View>
            <Text style={styles.metricValue}>74%</Text>
            <Text style={styles.metricLabel}>Repeat Customers</Text>
          </View>
        </View>

        {/* Revenue Performance Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartCardTitle}>Sales Trend</Text>
              <Text style={styles.chartCardSubtitle}>Revenue generated in {timeframe}</Text>
            </View>
            <Text style={styles.chartCardTotal}>{totalRevenue}</Text>
          </View>

          <View style={styles.chartContainer}>
            {chartData.map((item, idx) => (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barValText}>{item.value}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: item.height,
                        backgroundColor:
                          idx === chartData.length - 1 ? Theme.colors.forestGreen : Theme.colors.emerald,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLblText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top-Selling Products */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Selling Items</Text>
            <TouchableOpacity onPress={() => onNavigateTab?.('SellerProducts')}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {topProducts.map((p) => (
            <View key={p.rank} style={styles.productRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{p.rank}</Text>
              </View>
              <View style={styles.productMeta}>
                <Text style={styles.productName} numberOfLines={1}>
                  {p.title}
                </Text>
                <Text style={styles.productSold}>{p.sold} sold</Text>
              </View>
              <Text style={styles.productRevenue}>{p.revenue}</Text>
            </View>
          ))}
        </View>

        {/* Order Fulfillment Health */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fulfillment Health</Text>
          <Text style={styles.healthSubtitle}>Order completion rate: 96.2%</Text>

          <View style={styles.healthProgressTrack}>
            <View style={[styles.healthSegment, { flex: 88, backgroundColor: '#16A34A' }]} />
            <View style={[styles.healthSegment, { flex: 8, backgroundColor: '#DBEAFE' }]} />
            <View style={[styles.healthSegment, { flex: 4, backgroundColor: '#FEE2E2' }]} />
          </View>

          <View style={styles.healthLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.legendText}>Delivered (88%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>In Transit (8%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Cancelled (4%)</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  timeframeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  tfBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tfBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tfText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  tfTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  metricLabel: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  chartCardSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  chartCardTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingHorizontal: 8,
    paddingTop: 20,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    marginBottom: 6,
    fontWeight: '500',
  },
  barTrack: {
    width: 26,
    height: 100,
    backgroundColor: '#F1F5F0',
    borderRadius: 13,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 13,
  },
  barLblText: {
    fontSize: 11,
    color: Theme.colors.primaryText,
    marginTop: 8,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.emerald,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F0',
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  productMeta: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primaryText,
  },
  productSold: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
  },
  healthSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    marginBottom: 12,
  },
  healthProgressTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#F1F5F0',
    marginBottom: 12,
  },
  healthSegment: {
    height: '100%',
  },
  healthLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
});

