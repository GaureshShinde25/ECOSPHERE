import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  ChevronRight,
  Store,
  User,
  Lightbulb,
  LogOut,
} from 'lucide-react-native';
import { GlassCard } from '../components/cards/GlassCard';
import { AIInsightCard } from '../components/cards/AIInsightCard';
import { mockAIInsights } from '../data/mockData';
import { Theme } from '../theme';
import { businessService } from '../services/businessService';
import { sellerDashboardService, SellerDashboardData } from '../services/sellerDashboardService';
import { authService } from '../services/authService';
import { UserRole, Business } from '../types';

import { ShopSwitcher } from '../components/common/ShopSwitcher';
import { activeBusinessService } from '../services/activeBusinessService';

interface BusinessDashboardScreenProps {
  onNavigateTab: (tabName: string) => void;
  onOpenAi?: () => void;
  onLogout?: () => void;
  onRoleSwitch?: (newRole: UserRole) => void;
}

export const BusinessDashboardScreen: React.FC<BusinessDashboardScreenProps> = ({
  onNavigateTab,
  onOpenAi,
  onLogout,
  onRoleSwitch,
}) => {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [dashboardData, setDashboardData] = useState<SellerDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState<boolean>(false);
  const [isSwitchModalVisible, setIsSwitchModalVisible] = useState<boolean>(false);
  const [switchingMode, setSwitchingMode] = useState<boolean>(false);

  const loadDashboard = async (bizId?: string) => {
    try {
      const data = await sellerDashboardService.getDashboardData(bizId);
      if (data) {
        setDashboardData(data);
      }
    } catch {
      // safe fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    businessService
      .getMyBusinesses()
      .then(async (myBizList) => {
        const safeList = Array.isArray(myBizList) ? myBizList : [];
        setMyBusinesses(safeList);
        const resolved = await activeBusinessService.resolveActiveBusiness(safeList);
        setActiveBusiness(resolved);
        if (resolved) {
          loadDashboard(resolved.id);
        } else {
          loadDashboard();
        }
      })
      .catch(() => {
        setMyBusinesses([]);
        setActiveBusiness(null);
        loadDashboard();
      });

    const unsubscribe = activeBusinessService.subscribe((biz) => {
      setActiveBusiness(biz);
      if (biz) {
        loadDashboard(biz.id);
      } else {
        loadDashboard();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSelectShop = async (biz: Business) => {
    setActiveBusiness(biz);
    await activeBusinessService.setActiveBusiness(biz);
    loadDashboard(biz.id);
  };

  const stats = dashboardData?.stats;
  const pb = dashboardData?.primaryBusiness;
  const bizName = pb?.name || activeBusiness?.name || 'My Enterprise';
  const bizCity = pb?.city || activeBusiness?.location?.city || 'Your City';

  const handleConfirmLogout = () => {
    setIsLogoutModalVisible(false);
    onLogout?.();
  };

  const handleConfirmSwitchToCustomer = async () => {
    setSwitchingMode(true);
    try {
      const res = await authService.switchMode('customer');
      if (res && res.success) {
        setIsSwitchModalVisible(false);
        onRoleSwitch?.('customer');
      }
    } catch (err: any) {
      setIsSwitchModalVisible(false);
      Alert.alert('Notice', err.message || 'Failed to switch to customer mode');
    } finally {
      setSwitchingMode(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section with ShopSwitcher */}
          <View style={styles.heroSection}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.greetingText}>YOUR BUSINESS, TODAY</Text>
              <Text style={styles.bizTitle} numberOfLines={1}>{bizName}</Text>
              <Text style={styles.citySubtitle}>{bizCity} · Seller dashboard</Text>
              <View style={{ marginTop: 10 }}>
                <ShopSwitcher
                  businesses={myBusinesses}
                  activeBusiness={activeBusiness || (myBusinesses[0] || null)}
                  onSelectBusiness={handleSelectShop}
                  onAddNewShop={() => onNavigateTab('SellerBusiness')}
                />
              </View>
            </View>

            <View style={styles.heroRightActions}>
              <TouchableOpacity
                style={styles.switchModePill}
                onPress={handleConfirmSwitchToCustomer}
                disabled={switchingMode}
                activeOpacity={0.8}
              >
                {switchingMode ? (
                  <ActivityIndicator size="small" color="#F8FAFC" />
                ) : (
                  <Text style={styles.switchModePillText}>Customer</Text>
                )}
              </TouchableOpacity>

              <View style={styles.healthScoreCard}>
                <Text style={styles.healthScoreNum}>{stats ? (stats.averageRating > 0 ? stats.averageRating : '0.0') : '0.0'}</Text>
                <Text style={styles.healthScoreLabel}>Rating ★</Text>
              </View>

              <TouchableOpacity
                style={styles.accountAvatarBtn}
                onPress={() => onNavigateTab('Profile')}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Seller Account Profile and Settings"
              >
                <User size={18} color={Theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary KPIs Grid */}
          <GlassCard style={styles.kpiCard}>
            <Text style={styles.cardHeader}>AT A GLANCE</Text>

            <View style={styles.kpiGrid}>
              <TouchableOpacity style={styles.kpiCell} onPress={() => onNavigateTab('SellerEarnings')}>
                <Text style={styles.kpiVal}>₹{stats ? stats.totalEarnings.toLocaleString('en-IN') : '0'}</Text>
                <View style={styles.trendRow}>
                  <TrendingUp size={12} color={Theme.colors.success} />
                  <Text style={styles.trendText}>Total</Text>
                </View>
                <Text style={styles.kpiLbl}>Total Earnings</Text>
              </TouchableOpacity>

              <View style={styles.kpiDivider} />

              <TouchableOpacity style={styles.kpiCell} onPress={() => onNavigateTab('SellerOrders')}>
                <Text style={styles.kpiVal}>{stats ? stats.totalOrders : 0}</Text>
                <View style={styles.trendRow}>
                  <TrendingUp size={12} color={Theme.colors.success} />
                  <Text style={styles.trendText}>{stats ? `${stats.pendingOrders} Pend.` : '0 Pend.'}</Text>
                </View>
                <Text style={styles.kpiLbl}>Orders</Text>
              </TouchableOpacity>

              <View style={styles.kpiDivider} />

              <TouchableOpacity style={styles.kpiCell} onPress={() => onNavigateTab('SellerBusiness')}>
                <Text style={styles.kpiVal}>{stats ? stats.totalProducts : 0}</Text>
                <View style={styles.trendRow}>
                  <Store size={12} color={Theme.colors.primary} />
                  <Text style={styles.trendText}>Catalog</Text>
                </View>
                <Text style={styles.kpiLbl}>Products</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Operational Metrics Row */}
          <View style={styles.metricsRow}>
            <TouchableOpacity
              style={styles.metricCardWrapper}
              activeOpacity={0.8}
              onPress={() => onNavigateTab('SellerOrders')}
            >
              <GlassCard style={styles.metricCard}>
                <Calendar size={20} color={Theme.colors.primary} />
                <Text style={styles.metricVal}>{stats ? stats.totalBookings : 0}</Text>
                <Text style={styles.metricLbl}>Active Bookings</Text>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCardWrapper}
              activeOpacity={0.8}
              onPress={() => onNavigateTab('SellerJobs')}
            >
              <GlassCard style={styles.metricCard}>
                <Briefcase size={20} color={Theme.colors.purple} />
                <Text style={styles.metricVal}>{stats ? stats.totalApplications : '7'}</Text>
                <Text style={styles.metricLbl}>Job Applications</Text>
              </GlassCard>
            </TouchableOpacity>
          </View>

          {/* Recent Orders & Bookings Telemetry Row */}
          {dashboardData && (dashboardData.recentOrders.length > 0 || dashboardData.upcomingBookings.length > 0) && (
            <View style={{ marginBottom: Theme.spacing.md }}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <GlassCard style={styles.telemetryCard}>
                {dashboardData.recentOrders.length > 0 && (
                  <TouchableOpacity style={styles.telemetryRow} onPress={() => onNavigateTab('SellerOrders')}>
                    <View style={styles.telemetryIcon}>
                      <ShoppingBag size={18} color={Theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.telemetryTitle}>Order {dashboardData.recentOrders[0].orderNumber}</Text>
                      <Text style={styles.telemetrySub}>
                        ₹{dashboardData.recentOrders[0].totalAmount} • {dashboardData.recentOrders[0].orderStatus}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Theme.colors.secondaryText} />
                  </TouchableOpacity>
                )}

                {dashboardData.upcomingBookings.length > 0 && (
                  <TouchableOpacity style={styles.telemetryRow} onPress={() => onNavigateTab('SellerOrders')}>
                    <View style={[styles.telemetryIcon, { backgroundColor: 'rgba(37, 230, 138, 0.12)' }]}>
                      <Calendar size={18} color={Theme.colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.telemetryTitle}>{dashboardData.upcomingBookings[0].serviceTitle}</Text>
                      <Text style={styles.telemetrySub}>
                        {dashboardData.upcomingBookings[0].bookingDate} • {dashboardData.upcomingBookings[0].status}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={Theme.colors.secondaryText} />
                  </TouchableOpacity>
                )}
              </GlassCard>
            </View>
          )}

          {/* AI Growth Recommendation Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>A smarter next move</Text>
            <TouchableOpacity onPress={onOpenAi} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Ask Eco AI</Text>
            </TouchableOpacity>
          </View>

          {mockAIInsights.length > 0 && (
            <AIInsightCard
              insight={mockAIInsights[0]}
              onExplore={onOpenAi}
            />
          )}

          {/* Quick Nav Actions */}
          <Text style={styles.sectionTitle}>Manage your business</Text>
          <View style={styles.hubGrid}>
            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('SellerBusiness')}>
              <Store size={22} color={Theme.colors.primary} />
              <Text style={styles.hubTitle}>Manage Business</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('SellerOrders')}>
              <ShoppingBag size={22} color={Theme.colors.success} />
              <Text style={styles.hubTitle}>Orders & Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('SellerJobs')}>
              <Briefcase size={22} color={Theme.colors.purple} />
              <Text style={styles.hubTitle}>Jobs & Recruitment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('SellerEarnings')}>
              <TrendingUp size={22} color={Theme.colors.orange} />
              <Text style={styles.hubTitle}>Earnings & Payments</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('SellerInsights')}>
              <Lightbulb size={22} color={Theme.colors.primary} />
              <Text style={styles.hubTitle}>Growth Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.hubCard} onPress={() => onNavigateTab('Profile')}>
              <User size={22} color={Theme.colors.accent} />
              <Text style={styles.hubTitle}>Account & Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.hubCard, { borderColor: 'rgba(239, 68, 68, 0.25)' }]}
              onPress={() => setIsLogoutModalVisible(true)}
            >
              <LogOut size={22} color="#EF4444" />
              <Text style={[styles.hubTitle, { color: '#EF4444' }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Seller Logout Confirmation Modal */}
        <Modal visible={isLogoutModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.logoutModalCard}>
              <View style={styles.logoutIconBox}>
                <LogOut size={28} color="#EF4444" />
              </View>

              <Text style={styles.logoutTitle}>Log Out of Seller Portal?</Text>
              <Text style={styles.logoutDesc}>
                Your active seller session will be safely cleared. You will need to log in again to manage your business.
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsLogoutModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmLogoutBtn}
                  onPress={handleConfirmLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmLogoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Switch to Customer Confirmation Modal */}
        <Modal visible={isSwitchModalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.switchModalCard}>
              <View style={styles.switchIconBox}>
                <ShoppingBag size={28} color={Theme.colors.primary} />
              </View>

              <Text style={styles.switchModalTitle}>Switch to Customer mode?</Text>
              <Text style={styles.switchModalDesc}>
                You'll return to the normal customer shopping experience. Your seller business, products, orders, and earnings will remain intact and unchanged.
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsSwitchModalVisible(false)}
                  disabled={switchingMode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmSwitchBtn}
                  onPress={handleConfirmSwitchToCustomer}
                  disabled={switchingMode}
                  activeOpacity={0.8}
                >
                  {switchingMode ? (
                    <ActivityIndicator size="small" color="#040814" />
                  ) : (
                    <Text style={styles.confirmSwitchText}>Switch</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.lg,
    paddingBottom: 124,
  },
  heroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.xl,
  },
  greetingText: {
    fontSize: 10,
    color: Theme.colors.forestGreen,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Theme.typography.fontFamily,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bizTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
    marginTop: 3,
  },
  citySubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 3,
    fontFamily: Theme.typography.fontFamily,
  },
  heroRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthScoreCard: {
    backgroundColor: Theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  healthScoreNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  healthScoreLabel: {
    fontSize: 9,
    color: Theme.colors.forestGreen,
    marginTop: 2,
  },
  kpiCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: Theme.spacing.lg,
    fontFamily: Theme.typography.fontFamily,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiCell: {
    flex: 1,
    alignItems: 'center',
  },
  kpiVal: {
    fontSize: 19,
    fontWeight: '800',
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.success,
  },
  kpiLbl: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  kpiDivider: {
    width: 1,
    height: 38,
    backgroundColor: Theme.colors.border,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Theme.spacing.lg,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCard: {
    padding: Theme.spacing.lg,
    alignItems: 'flex-start',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.text,
    marginTop: 14,
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  metricLbl: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  telemetryCard: {
    padding: Theme.spacing.md,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.borderLight,
  },
  telemetryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  telemetryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  telemetrySub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
    fontFamily: Theme.typography.fontFamily,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  seeAllText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  hubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Theme.spacing.md,
  },
  hubCard: {
    width: '48%',
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Theme.shadows.minimalSoft,
  },
  hubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 35, 27, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
      },
    }),
  },
  logoutModalCard: {
    width: '100%',
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 24,
    alignItems: 'center',
  },
  logoutIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  logoutDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surfaceSubtle,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  confirmLogoutBtn: {
    flex: 1,
    backgroundColor: Theme.colors.dangerLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  confirmLogoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: Theme.typography.fontFamily,
  },
  switchModePill: {
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 6,
  },
  switchModePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  switchModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Theme.colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 24,
    alignItems: 'center',
  },
  switchIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.aiAccent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
  },
  switchModalDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: Theme.typography.fontFamily,
  },
  confirmSwitchBtn: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmSwitchText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
});

