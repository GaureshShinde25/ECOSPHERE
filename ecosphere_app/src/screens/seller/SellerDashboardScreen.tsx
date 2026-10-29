import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import {
  Bell,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Eye,
  Star,
  Package,
  Users,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  Plus,
  Clock,
  Store,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { sellerDashboardService, SellerDashboardData } from '../../services/sellerDashboardService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { orderService } from '../../services/orderService';
import { Business, Order } from '../../types';

interface SellerDashboardScreenProps {
  onNavigateTab?: (tab: string, params?: any) => void;
  onOpenAi?: () => void;
  onLogout?: () => void;
  onRoleSwitch?: (role: any) => void;
}

export const SellerDashboardScreen: React.FC<SellerDashboardScreenProps> = ({
  onNavigateTab,
  onOpenAi,
  onLogout,
  onRoleSwitch,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | 'week' | 'month'>('today');
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const loadData = useCallback(async () => {
    try {
      const biz = activeBusinessService.getActiveBusiness();
      setActiveBusiness(biz);

      const [dash, orders] = await Promise.all([
        sellerDashboardService.getDashboardData(biz?.id),
        orderService.getSellerOrders(biz?.id),
      ]);

      setDashboardData(dash);
      if (orders && orders.length > 0) {
        setRecentOrders(orders.slice(0, 4));
      }
    } catch (err) {
      if (__DEV__) console.warn('[SellerDashboardScreen] Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = activeBusinessService.subscribe((biz) => {
      setActiveBusiness(biz);
    });
    return unsubscribe;
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    }
    if (s === 'PREPARING' || s === 'CONFIRMED') {
      return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Preparing' };
    }
    if (s === 'READY' || s === 'OUT_FOR_DELIVERY') {
      return { bg: '#EEE8FF', text: '#6D28D9', label: 'Out for Delivery' };
    }
    if (s === 'DELIVERED' || s === 'COMPLETED') {
      return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' };
    }
    if (s === 'CANCELLED') {
      return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' };
    }
    return { bg: '#F1F5F0', text: '#68756B', label: status || 'Received' };
  };

  const storeName = activeBusiness?.name || dashboardData?.primaryBusiness?.name || 'Local Marketplace';
  const storeCity = activeBusiness?.location?.city || activeBusiness?.city || dashboardData?.primaryBusiness?.city || 'Chiplun';
  const stats = dashboardData?.stats;

  // Chart data calculation based on period
  const chartBars = revenuePeriod === 'today'
    ? [
        { label: '9 AM', height: 28, value: '₹1.2k' },
        { label: '12 PM', height: 68, value: '₹3.4k' },
        { label: '3 PM', height: 45, value: '₹2.1k' },
        { label: '6 PM', height: 85, value: '₹4.8k' },
        { label: '9 PM', height: 50, value: '₹2.6k' },
      ]
    : revenuePeriod === 'week'
    ? [
        { label: 'Mon', height: 42, value: '₹6.2k' },
        { label: 'Tue', height: 60, value: '₹8.4k' },
        { label: 'Wed', height: 35, value: '₹5.1k' },
        { label: 'Thu', height: 78, value: '₹11.2k' },
        { label: 'Fri', height: 95, value: '₹14.8k' },
        { label: 'Sat', height: 110, value: '₹18.6k' },
        { label: 'Sun', height: 88, value: '₹13.4k' },
      ]
    : [
        { label: 'W1', height: 55, value: '₹24k' },
        { label: 'W2', height: 70, value: '₹38k' },
        { label: 'W3', height: 90, value: '₹49k' },
        { label: 'W4', height: 105, value: '₹62k' },
      ];

  const totalPeriodRevenue = revenuePeriod === 'today'
    ? '₹14,100'
    : revenuePeriod === 'week'
    ? '₹77,700'
    : '₹173,000';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.emerald} />
        <Text style={styles.loadingText}>Loading your seller dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../../assets/logos/ecosphere-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerSubBadge}>
            <Text style={styles.headerSubBadgeText}>SELLER</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onNavigateTab?.('SellerMore')}
            activeOpacity={0.7}
          >
            <Bell size={20} color={Theme.colors.primaryText} />
            {(stats?.unreadNotifications || 0) > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => onNavigateTab?.('SellerBusinessProfile')}
            activeOpacity={0.8}
          >
            {activeBusiness?.logoUrl ? (
              <Image source={{ uri: activeBusiness.logoUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Store size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.emerald]} />}
      >
        {/* Store Greeting & Live Operational Status Card */}
        <View style={styles.storeStatusCard}>
          <View style={styles.storeGreetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greetingSub}>Store Dashboard</Text>
              <Text style={styles.storeTitle} numberOfLines={1}>
                {storeName}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={13} color={Theme.colors.secondaryText} />
                <Text style={styles.locationText}>{storeCity} • Verified Merchant</Text>
              </View>
            </View>

            <View style={styles.statusToggleContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: isStoreOpen ? '#16A34A' : '#94A3B8' }]} />
              <Text style={[styles.statusToggleLabel, { color: isStoreOpen ? '#16A34A' : '#64748B' }]}>
                {isStoreOpen ? 'Accepting Orders' : 'Store Paused'}
              </Text>
              <Switch
                value={isStoreOpen}
                onValueChange={setIsStoreOpen}
                trackColor={{ false: '#E2E8F0', true: '#DCFCE7' }}
                thumbColor={isStoreOpen ? '#16A34A' : '#94A3B8'}
                style={styles.switchStyle}
              />
            </View>
          </View>
        </View>

        {/* 4 Core Business KPIs */}
        <View style={styles.kpiGrid}>
          {/* KPI 1: Sales Today */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBadge, { backgroundColor: '#EAF7EE' }]}>
                <TrendingUp size={18} color="#16A34A" />
              </View>
              <View style={styles.kpiTrendBadge}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.kpiTrendText}>+18%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>
              ₹{stats?.totalEarnings ? (stats.totalEarnings).toLocaleString() : '14,100'}
            </Text>
            <Text style={styles.kpiLabel}>Sales Today</Text>
          </View>

          {/* KPI 2: Orders */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigateTab?.('SellerOrders')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBadge, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag size={18} color="#2563EB" />
              </View>
              <View style={[styles.kpiTrendBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.kpiTrendText, { color: '#B45309' }]}>3 new</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{stats?.totalOrders || recentOrders.length || 14}</Text>
            <Text style={styles.kpiLabel}>Orders Today</Text>
          </TouchableOpacity>

          {/* KPI 3: Store Views */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBadge, { backgroundColor: '#F5F3FF' }]}>
                <Eye size={18} color="#7C3AED" />
              </View>
              <View style={styles.kpiTrendBadge}>
                <ArrowUpRight size={12} color="#16A34A" />
                <Text style={styles.kpiTrendText}>+12%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>384</Text>
            <Text style={styles.kpiLabel}>Store Views</Text>
          </View>

          {/* KPI 4: Rating */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBadge, { backgroundColor: '#FEF9C3' }]}>
                <Star size={18} color="#D97706" />
              </View>
              <Text style={styles.reviewCountText}>42 reviews</Text>
            </View>
            <Text style={styles.kpiValue}>{stats?.averageRating || 4.9} ★</Text>
            <Text style={styles.kpiLabel}>Customer Rating</Text>
          </View>
        </View>

        {/* Revenue Performance & Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Revenue Performance</Text>
              <Text style={styles.chartAmount}>{totalPeriodRevenue}</Text>
            </View>

            {/* Timeframe selector tabs */}
            <View style={styles.timeframeTabs}>
              <TouchableOpacity
                style={[styles.timeframeBtn, revenuePeriod === 'today' && styles.timeframeBtnActive]}
                onPress={() => setRevenuePeriod('today')}
              >
                <Text style={[styles.timeframeText, revenuePeriod === 'today' && styles.timeframeTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeframeBtn, revenuePeriod === 'week' && styles.timeframeBtnActive]}
                onPress={() => setRevenuePeriod('week')}
              >
                <Text style={[styles.timeframeText, revenuePeriod === 'week' && styles.timeframeTextActive]}>
                  7 Days
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeframeBtn, revenuePeriod === 'month' && styles.timeframeBtnActive]}
                onPress={() => setRevenuePeriod('month')}
              >
                <Text style={[styles.timeframeText, revenuePeriod === 'month' && styles.timeframeTextActive]}>
                  30 Days
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Styled Bar Chart Graphic */}
          <View style={styles.chartVisualization}>
            {chartBars.map((bar, index) => (
              <View key={index} style={styles.barColumn}>
                <Text style={styles.barValueText}>{bar.value}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: bar.height,
                        backgroundColor:
                          index === chartBars.length - 1 ? Theme.colors.forestGreen : Theme.colors.emerald,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabelText}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Management</Text>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab?.('SellerProducts')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EAF7EE' }]}>
              <Package size={22} color={Theme.colors.forestGreen} />
            </View>
            <Text style={styles.quickActionTitle}>My Products</Text>
            <Text style={styles.quickActionSubtitle}>
              {stats?.totalProducts || 18} Active items
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab?.('SellerOrders')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
              <ShoppingBag size={22} color="#2563EB" />
            </View>
            <Text style={styles.quickActionTitle}>Process Orders</Text>
            <Text style={styles.quickActionSubtitle}>
              {recentOrders.length} New to dispatch
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab?.('SellerCustomers')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
              <Users size={22} color="#DB2777" />
            </View>
            <Text style={styles.quickActionTitle}>Customers</Text>
            <Text style={styles.quickActionSubtitle}>Engage & retain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateTab?.('SellerAnalytics')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <BarChart3 size={22} color="#D97706" />
            </View>
            <Text style={styles.quickActionTitle}>Full Analytics</Text>
            <Text style={styles.quickActionSubtitle}>Growth metrics</Text>
          </TouchableOpacity>
        </View>

        {/* Promotional Growth Hero Banner */}
        <View style={styles.promoBannerCard}>
          <Image
            source={require('../../../assets/images/seller/banners/seller-promo-banner.png')}
            style={styles.promoBannerBg}
            resizeMode="cover"
          />
          <View style={styles.promoBannerOverlay}>
            <View style={styles.promoTag}>
              <Sparkles size={12} color={Theme.colors.forestGreen} />
              <Text style={styles.promoTagText}>GROW LOCAL SALES</Text>
            </View>
            <Text style={styles.promoBannerTitle}>Boost Your Store Visibility</Text>
            <Text style={styles.promoBannerDesc}>
              Launch a weekend flash deal or discount coupon to attract 3x more local shoppers.
            </Text>
            <TouchableOpacity
              style={styles.promoCtaButton}
              onPress={() => onNavigateTab?.('SellerPromotions')}
              activeOpacity={0.85}
            >
              <Text style={styles.promoCtaText}>Create Promotion</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity
            onPress={() => onNavigateTab?.('SellerOrders')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyOrdersCard}>
            <ShoppingBag size={32} color="#94A3B8" />
            <Text style={styles.emptyOrdersTitle}>No orders received yet today</Text>
            <Text style={styles.emptyOrdersDesc}>
              New customer orders will appear here automatically in real time.
            </Text>
          </View>
        ) : (
          recentOrders.map((order) => {
            const badge = getStatusBadge(order.orderStatus);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => onNavigateTab?.('SellerOrderDetails', { orderId: order.id })}
                activeOpacity={0.75}
              >
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderNumberText}>#{order.orderNumber || order.id.slice(0, 8)}</Text>
                    <Text style={styles.orderTimeText}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.orderCardDivider} />

                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderItemsCount}>
                    {order.items?.length || 1} item{order.items?.length === 1 ? '' : 's'} • Total
                  </Text>
                  <Text style={styles.orderAmountText}>
                    ₹{(order.totalAmount || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

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
    marginTop: 12,
    fontSize: 14,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    height: 30,
    width: 120,
  },
  headerSubBadge: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  headerSubBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#146B3A',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  storeStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storeGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    fontWeight: '500',
  },
  storeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  statusToggleContainer: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusToggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  switchStyle: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
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
  kpiIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  kpiTrendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  reviewCountText: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  kpiLabel: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 20,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  chartAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  timeframeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  timeframeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeframeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
  },
  timeframeTextActive: {
    fontWeight: '700',
    color: Theme.colors.forestGreen,
  },
  chartVisualization: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20,
    paddingHorizontal: 6,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValueText: {
    fontSize: 9,
    color: Theme.colors.secondaryText,
    marginBottom: 6,
    fontWeight: '500',
  },
  barTrack: {
    width: 22,
    height: 100,
    backgroundColor: '#F1F5F0',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 11,
  },
  barLabelText: {
    fontSize: 11,
    color: Theme.colors.primaryText,
    marginTop: 8,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.emerald,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  quickActionTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 16,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  quickActionSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  promoBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    backgroundColor: '#064E3B',
    minHeight: 160,
  },
  promoBannerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.35,
    width: '100%',
    height: '100%',
  },
  promoBannerOverlay: {
    padding: 20,
    zIndex: 1,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#C7F36B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  promoTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  promoBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 4,
  },
  promoBannerDesc: {
    fontSize: 12,
    color: '#E4EBE3',
    lineHeight: 18,
    marginBottom: 14,
    maxWidth: '85%',
  },
  promoCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  promoCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyOrdersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyOrdersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginTop: 8,
  },
  emptyOrdersDesc: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    marginBottom: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  orderTimeText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F0',
    marginVertical: 10,
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
  },
  orderAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
});
