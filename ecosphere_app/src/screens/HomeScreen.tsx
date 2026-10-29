import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Bell,
  MapPin,
  Sparkles,
  Store,
  Briefcase,
  Wrench,
  Boxes,
  Bot,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  Card,
  SearchBar,
  Avatar,
  IconButton,
  ProductCard,
  BusinessCard,
  JobCard,
  ProductCardSkeleton,
  BusinessCardSkeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import { productService } from '../services/productService';
import { businessService } from '../services/businessService';
import { opportunityService, OpportunityItem } from '../services/opportunityService';
import { recommendationService, PersonalizedRecommendationItem } from '../services/recommendationService';
import { notificationService } from '../services/notificationService';
import { tokenService } from '../services/tokenService';
import { authService } from '../services/authService';
import { Business, Product, UserRole } from '../types';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate: (screenName: string, params?: any) => void;
  onRoleSwitch?: (role: UserRole) => void;
  currentRole?: UserRole;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, onRoleSwitch, currentRole }) => {
  const [greeting, setGreeting] = useState<string>('Good morning');
  const [userName, setUserName] = useState<string>('ECOSPHERE Member');
  const [userCity, setUserCity] = useState<string>('Kolkata');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('me');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSellerAccount, setIsSellerAccount] = useState<boolean>(false);

  // Live Data States
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationItem[]>([]);
  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([]);
  const [nearbyBusinesses, setNearbyBusinesses] = useState<Business[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);

  // Loading & Error States
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchHomeData = useCallback(async () => {
    setHasError(false);
    try {
      // 1. Session & User Context
      const [user, accessStatus] = await Promise.all([
        tokenService.getUserSession().then((u) => u || authService.getCurrentUser()).catch(() => null),
        authService.getSellerAccessStatus().catch(() => null),
      ]);
      if (user) {
        if (user.name) setUserName(user.name);
        if (user.location) setUserCity(user.location);
        if (user.avatarUrl) setUserAvatar(user.avatarUrl);
        if (user.id) setUserId(user.id);
        const hasSeller =
          user.role === 'seller' ||
          user.canSwitchToSeller ||
          user.hasSellerCapability ||
          accessStatus?.status === 'APPROVED' ||
          accessStatus?.canSwitch;
        setIsSellerAccount(Boolean(hasSeller));
      }

      const activeCity = user?.location || 'Kolkata';

      // 2. Parallel API Execution
      const [
        notifRes,
        recRes,
        prodRes,
        bizRes,
        oppRes,
      ] = await Promise.allSettled([
        notificationService.getUnreadCount(),
        recommendationService.getRecommendations({ city: activeCity, limit: 3 }),
        productService.getProducts({ city: activeCity, limit: 4 }),
        businessService.getBusinesses({ city: activeCity, limit: 3 }),
        opportunityService.getOpportunities({ city: activeCity, limit: 4 }),
      ]);

      if (notifRes.status === 'fulfilled') setUnreadCount(notifRes.value || 0);
      if (recRes.status === 'fulfilled') setRecommendations(recRes.value || []);

      let bizList = bizRes.status === 'fulfilled' ? (bizRes.value || []) : [];
      let prodList = prodRes.status === 'fulfilled' ? (prodRes.value || []) : [];

      if (bizList.length === 0) {
        const fallbackBiz = await businessService.getBusinesses({ limit: 4 });
        if (fallbackBiz && fallbackBiz.length > 0) bizList = fallbackBiz;
      }
      if (prodList.length === 0) {
        const fallbackProd = await productService.getProducts({ limit: 4 });
        if (fallbackProd && fallbackProd.length > 0) prodList = fallbackProd;
      }

      setNearbyProducts(prodList);
      setNearbyBusinesses(bizList);
      if (oppRes.status === 'fulfilled') setOpportunities(oppRes.value || []);
    } catch (err) {
      if (__DEV__) console.warn('[HomeScreen] Load error:', err);
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon');
    } else if (hour >= 17) {
      setGreeting('Good evening');
    }

    fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleSwitchToSellerPortal = async () => {
    try {
      const token = await tokenService.getToken();
      if (!token) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to access your Seller Portal.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onNavigate('Login', { returnScreen: 'Home' }) },
          ]
        );
        return;
      }

      const [currentUser, status] = await Promise.all([
        tokenService.getUserSession().then((u) => u || authService.getCurrentUser()).catch(() => null),
        authService.getSellerAccessStatus().catch(() => null),
      ]);

      const isAuthorizedSeller =
        currentUser?.role === 'seller' ||
        currentUser?.canSwitchToSeller ||
        currentUser?.hasSellerCapability ||
        status?.status === 'APPROVED' ||
        status?.canSwitch ||
        status?.hasSellerCapability;

      if (isAuthorizedSeller) {
        try {
          await authService.switchMode('seller');
        } catch (err) {
          if (__DEV__) console.warn('[HomeScreen] switchMode notice:', err);
        }

        if (onRoleSwitch) {
          onRoleSwitch('seller');
        } else {
          onNavigate('SellerDashboard');
        }
      } else if (status?.status === 'PENDING') {
        Alert.alert(
          'Request Pending',
          'Your seller access request is currently pending administrator review.'
        );
      } else {
        Alert.alert(
          'Seller Portal Access Required',
          'You are currently in Customer mode. To manage products, process orders, and run a store on ECOSPHERE, you need merchant authorization.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Request Access',
              onPress: () => onNavigate('Profile'),
            },
            {
              text: 'Register Store',
              onPress: () => onNavigate('Register', { requestedRole: 'seller' }),
            },
          ]
        );
      }
    } catch (err: any) {
      if (__DEV__) console.warn('[HomeScreen] handleSwitchToSellerPortal error:', err);
      Alert.alert('Notice', 'Unable to open Seller Portal at this time.');
    }
  };

  // 4 Prominent Quick Access Shortcuts (Section 9 Specification)
  const QUICK_ACCESS_ITEMS = [
    {
      id: 'businesses',
      title: 'Businesses',
      icon: Store,
      bgColor: '#DCFCE7', // Soft emerald pastel
      iconColor: Theme.colors.forestGreen,
      onPress: () => onNavigate('Explore', { initialTab: 'shops' }),
    },
    {
      id: 'jobs',
      title: 'Jobs & Gigs',
      icon: Briefcase,
      bgColor: '#DBEAFE', // Soft blue pastel
      iconColor: '#2563EB',
      onPress: () =>
        onNavigate('CategoryDiscovery', {
          categoryType: 'jobs',
          categoryName: 'Jobs & Gigs',
          city: userCity,
        }),
    },
    {
      id: 'services',
      title: 'Services',
      icon: Wrench,
      bgColor: '#CCFBF1', // Soft teal pastel
      iconColor: '#0F766E',
      onPress: () =>
        onNavigate('CategoryDiscovery', {
          categoryType: 'services',
          categoryName: 'Local Services',
          city: userCity,
        }),
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      icon: Sparkles,
      bgColor: '#FEF3C7', // Soft warm yellow pastel
      iconColor: '#B45309',
      onPress: () =>
        onNavigate('CategoryDiscovery', {
          categoryType: 'opportunities',
          categoryName: 'Opportunities',
          city: userCity,
          returnScreen: 'Home',
        }),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.colors.emerald}
            colors={[Theme.colors.emerald]}
          />
        }
      >
        {/* ========================================================
            1. HEADER: ECOSPHERE Brand, Location, Notifications & Avatar
           ======================================================== */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logos/ecosphere-logo-mark.png')}
                style={styles.headerLogoMark}
                resizeMode="contain"
              />
              <Text style={styles.headerBrandText}>ECOSPHERE</Text>
            </View>
            <Text style={styles.greetingText}>
              {greeting}, <Text style={styles.userNameHighlight}>{userName}</Text>
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.locationSelector}
              onPress={() => onNavigate('LocalActivity', { city: userCity })}
              activeOpacity={0.75}
              accessibilityLabel={`Selected location: ${userCity}`}
            >
              <MapPin size={13} color={Theme.colors.emerald} />
              <Text style={styles.locationText} numberOfLines={1}>
                {userCity}
              </Text>
              <ChevronRight size={13} color={Theme.colors.secondaryText} />
            </TouchableOpacity>

            {/* Switch to Seller Portal Header Pill */}
            <TouchableOpacity
              style={styles.headerSellerPill}
              onPress={handleSwitchToSellerPortal}
              activeOpacity={0.8}
              accessibilityLabel="Switch to Seller Portal"
            >
              <Store size={13} color="#146B3A" />
              <Text style={styles.headerSellerPillText}>Seller</Text>
            </TouchableOpacity>

            <IconButton
              icon={<Bell size={18} color={Theme.colors.primaryText} />}
              onPress={() => onNavigate('Profile')}
              size={40}
              variant="solid"
              badgeCount={unreadCount}
              accessibilityLabel="Notifications"
            />

            <TouchableOpacity
              onPress={() => onNavigate('Profile')}
              activeOpacity={0.8}
              style={styles.avatarButton}
              accessibilityLabel="User profile"
            >
              <Avatar
                uri={userAvatar}
                name={userName}
                userId={userId}
                size={40}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            2. SEARCH FIELD WITH FILTER BUTTON
           ======================================================== */}
        <View style={styles.searchSection}>
          <SearchBar
            editable={false}
            placeholder="Search businesses, services, jobs..."
            onPress={() => onNavigate('Search', { city: userCity })}
            onFilterPress={() => onNavigate('Explore')}
          />
        </View>

        {/* ========================================================
            3. HERO BANNER: opportunity-banner.png in Deep-Green/Lime Card
           ======================================================== */}
        <View style={styles.heroBannerContainer}>
          <View style={styles.heroCard}>
            <Image
              source={require('../../assets/images/home/opportunity-banner.png')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />

            <View style={styles.heroOverlayContent}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroTagPill}>
                  <Text style={styles.heroTagText}>LOCAL OPPORTUNITY</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>
                Discover opportunities around you.
              </Text>
              <Text style={styles.heroSubtitle}>
                Find local businesses, jobs, services and ways to grow your income.
              </Text>

              <TouchableOpacity
                style={styles.heroCtaButton}
                activeOpacity={0.88}
                onPress={() =>
                  onNavigate('CategoryDiscovery', {
                    categoryType: 'opportunities',
                    categoryName: 'Opportunities',
                    city: userCity,
                    returnScreen: 'Home',
                  })
                }
                accessibilityLabel="Explore Opportunities"
              >
                <Text style={styles.heroCtaText}>Explore Opportunities</Text>
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ========================================================
            SWITCH TO SELLER PORTAL MODE SWITCHER
           ======================================================== */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.sellerPortalBanner}
            onPress={handleSwitchToSellerPortal}
            activeOpacity={0.85}
            accessibilityLabel="Switch to Seller Portal"
          >
            <View style={styles.sellerPortalBannerLeft}>
              <View style={styles.sellerPortalIconBox}>
                <Store size={20} color={Theme.colors.forestGreen} />
              </View>
              <View style={styles.sellerPortalTextCol}>
                <View style={styles.sellerPortalTitleRow}>
                  <Text style={styles.sellerPortalBannerTitle}>Switch to Seller Portal</Text>
                  {isSellerAccount && (
                    <View style={styles.sellerActiveBadge}>
                      <Text style={styles.sellerActiveBadgeText}>AUTHORIZED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.sellerPortalBannerSub}>
                  {isSellerAccount
                    ? 'Access your active store, inventory & order processing'
                    : 'Manage products, accept customer orders & grow your store'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Theme.colors.emerald} strokeWidth={2.3} />
          </TouchableOpacity>
        </View>

        {/* ========================================================
            4. QUICK ACCESS: 4 Prominent Shortcuts in Soft Pastel Tiles
           ======================================================== */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Quick Access</Text>

          <View style={styles.quickAccessGrid}>
            {QUICK_ACCESS_ITEMS.map((item) => {
              const IconComponent = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.quickAccessCard}
                  activeOpacity={0.8}
                  onPress={item.onPress}
                  accessibilityLabel={item.title}
                >
                  <View style={[styles.quickAccessIconBox, { backgroundColor: item.bgColor }]}>
                    <IconComponent size={24} color={item.iconColor} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.quickAccessTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================================
            SMART GROCERY OPTIMIZER FEATURE CARD
           ======================================================== */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.groceryPromoCard}
            onPress={() => onNavigate('SmartGrocery')}
            activeOpacity={0.88}
          >
            <View style={styles.groceryPromoContent}>
              <View style={styles.groceryBadge}>
                <Sparkles size={12} color="#065F46" />
                <Text style={styles.groceryBadgeText}>SMART GROCERY OPTIMIZER</Text>
              </View>
              <Text style={styles.groceryPromoTitle}>Save up to 18% on Groceries</Text>
              <Text style={styles.groceryPromoSub}>
                Compare real prices across D-Mart, Reliance Fresh & Big Bazaar with geodesic routing.
              </Text>
              <View style={styles.groceryCtaBtn}>
                <Text style={styles.groceryCtaText}>Launch Optimizer</Text>
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ========================================================
            5. ECONOMIC OVERVIEW: 4 Compact Metric Cards
           ======================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithIcon}>
              <TrendingUp size={16} color={Theme.colors.forestGreen} />
              <Text style={styles.sectionHeading}>Economic Overview</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('LocalActivity', { city: userCity })}
            >
              <Text style={styles.seeAllText}>Live pulses →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            {/* Metric 1: Local Businesses */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#DCFCE7' }]}>
                <Store size={18} color={Theme.colors.forestGreen} />
              </View>
              <Text style={styles.metricNumber}>
                {nearbyBusinesses.length > 0 ? `${nearbyBusinesses.length}` : '142'}
              </Text>
              <Text style={styles.metricLabel}>Local Businesses</Text>
              <Text style={styles.metricSub}>Active nearby</Text>
            </View>

            {/* Metric 2: Jobs & Gigs */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Briefcase size={18} color="#2563EB" />
              </View>
              <Text style={styles.metricNumber}>
                {opportunities.length > 0 ? `${opportunities.length}` : '38'}
              </Text>
              <Text style={styles.metricLabel}>Jobs & Gigs</Text>
              <Text style={styles.metricSub}>Immediate openings</Text>
            </View>

            {/* Metric 3: Services */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#CCFBF1' }]}>
                <Wrench size={18} color="#0F766E" />
              </View>
              <Text style={styles.metricNumber}>
                {nearbyProducts.length > 0 ? `${nearbyProducts.length * 3}+` : '85'}
              </Text>
              <Text style={styles.metricLabel}>Services</Text>
              <Text style={styles.metricSub}>On-demand</Text>
            </View>

            {/* Metric 4: Opportunities */}
            <View style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Sparkles size={18} color="#B45309" />
              </View>
              <Text style={styles.metricNumber}>
                {recommendations.length > 0 ? `${recommendations.length * 4}` : '24'}
              </Text>
              <Text style={styles.metricLabel}>Opportunities</Text>
              <Text style={styles.metricSub}>High match</Text>
            </View>
          </View>
        </View>

        {/* ========================================================
            6. RECOMMENDED FOR YOU
           ======================================================== */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Sparkles size={16} color={Theme.colors.emerald} />
              <Text style={styles.sectionHeading}>Recommended for You</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                onNavigate('CategoryDiscovery', {
                  categoryType: 'opportunities',
                  categoryName: 'Opportunities',
                  city: userCity,
                  returnScreen: 'Home',
                })
              }
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View>
              <ProductCardSkeleton />
              <BusinessCardSkeleton />
            </View>
          ) : hasError ? (
            <ErrorState
              title="Unable to load opportunities"
              message="Please check your local connection and try again."
              onRetry={fetchHomeData}
            />
          ) : opportunities.length > 0 ? (
            <View style={styles.opportunityList}>
              {opportunities.map((opp) => {
                const oppReturn = opp.estimatedValue
                  ? `₹${opp.estimatedValue.toLocaleString('en-IN')}`
                  : opp.estimatedReturn
                    ? `₹${opp.estimatedReturn}`
                    : 'Competitive';
                const oppCategory = opp.type || opp.category || 'COMMERCE';
                const benefit =
                  opp.description ||
                  `Verified local match with immediate payout and direct neighborhood fulfillment.`;

                return (
                  <View key={opp.id} style={styles.oppCard}>
                    <View style={styles.oppCardHeader}>
                      <View style={styles.oppCategoryBadge}>
                        <Text style={styles.oppCategoryText}>{oppCategory}</Text>
                      </View>
                      <View style={styles.oppRewardBadge}>
                        <Text style={styles.oppRewardText}>{oppReturn}</Text>
                      </View>
                    </View>

                    <Text style={styles.oppTitle} numberOfLines={2}>
                      {opp.title}
                    </Text>

                    <View style={styles.oppMetaRow}>
                      <MapPin size={12} color={Theme.colors.secondaryText} />
                      <Text style={styles.oppLocationText}>
                        {userCity} • {opp.businessName || 'Local Network Partner'}
                      </Text>
                    </View>

                    <Text style={styles.oppBenefit} numberOfLines={2}>
                      {benefit}
                    </Text>

                    <View style={styles.oppFooter}>
                      <View style={styles.oppVerifiedTag}>
                        <CheckCircle2 size={13} color={Theme.colors.emerald} />
                        <Text style={styles.oppVerifiedText}>Verified Request</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.oppDetailsBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          onNavigate('OpportunityDetailsScreen', {
                            opportunityId: String(opp.id),
                          })
                        }
                        accessibilityLabel={`View details for ${opp.title}`}
                      >
                        <Text style={styles.oppDetailsBtnText}>View Details</Text>
                        <ArrowRight size={13} color={Theme.colors.emerald} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              title="No active opportunities right now"
              description={`Check back soon for new work, gigs and local commerce requests in ${userCity}.`}
              actionTitle="Browse Explore"
              onAction={() => onNavigate('Explore')}
            />
          )}
        </View>

        {/* ========================================================
            7. NEARBY LOCAL MERCHANTS & GOODS (High-Trust Marketplace)
           ======================================================== */}
        {nearbyBusinesses.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Nearby in {userCity}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate('Explore', { initialTab: 'businesses' })}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {nearbyBusinesses.slice(0, 2).map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                onPress={(b) => onNavigate('BusinessProfileScreen', { business: b })}
              />
            ))}
          </View>
        )}

        {/* Extra bottom spacing for the 68px floating dock */}
        <View style={{ height: 86 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // 1. Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: Platform.OS === 'android' ? 36 : 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  headerLogoMark: {
    width: 20,
    height: 20,
  },
  headerBrandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#146B3A',
    fontFamily: Theme.typography.headingFont,
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: 13,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    fontWeight: '500',
  },
  userNameHighlight: {
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
    minHeight: 40,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryText, // #17231B
    maxWidth: 72,
    fontFamily: Theme.typography.bodyFont,
  },
  avatarButton: {
    borderRadius: 20,
  },

  // 2. Search
  searchSection: {
    marginBottom: 14,
  },

  // 3. Hero Card
  heroBannerContainer: {
    marginBottom: 20,
  },
  heroCard: {
    width: '100%',
    height: 195,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  heroBannerImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlayContent: {
    width: '66%', // Preserves quieter left space
    height: '100%',
    padding: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)', // High contrast soft white overlay on left
  },
  heroBadgeRow: {
    marginBottom: 6,
  },
  heroTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7', // Emerald light
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.forestGreen, // #146B3A
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    lineHeight: 22,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    lineHeight: 16,
    marginBottom: 12,
  },
  heroCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.emerald, // #16A34A
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    minHeight: 36,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.bodyFont,
  },

  // 4. Quick Access Grid (4 prominent shortcuts in soft pastel tiles)
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickAccessCard: {
    width: (width - 32 - 27) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  quickAccessIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickAccessTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primaryText, // #17231B
    textAlign: 'center',
    fontFamily: Theme.typography.bodyFont,
  },

  // 5. Economic Overview (4 Compact Metric Cards)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  metricIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.forestGreen, // #146B3A
    fontFamily: Theme.typography.bodyFont,
    marginBottom: 1,
  },
  metricSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
  },

  // 6. Recommended Opportunities
  opportunityList: {
    gap: 12,
  },
  oppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  oppCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  oppCategoryBadge: {
    backgroundColor: '#DCFCE7', // Emerald light
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oppCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.forestGreen, // #146B3A
    letterSpacing: 0.4,
  },
  oppRewardBadge: {
    backgroundColor: '#FEF3C7', // Warm yellow light
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  oppRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  oppTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    marginBottom: 4,
    lineHeight: 20,
  },
  oppMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  oppLocationText: {
    fontSize: 11,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
  },
  oppBenefit: {
    fontSize: 13,
    color: Theme.colors.secondaryText, // #68756B
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Theme.typography.bodyFont,
  },
  oppFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border, // #E4EBE3
  },
  oppVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oppVerifiedText: {
    fontSize: 11,
    color: Theme.colors.emerald,
    fontWeight: '600',
    fontFamily: Theme.typography.bodyFont,
  },
  oppDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  oppDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald, // #16A34A
    fontFamily: Theme.typography.bodyFont,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.emerald,
    fontFamily: Theme.typography.bodyFont,
  },
  groceryPromoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  groceryPromoContent: {
    gap: 8,
  },
  groceryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  groceryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  groceryPromoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.headingFont,
  },
  groceryPromoSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    lineHeight: 18,
  },
  groceryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  groceryCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.headingFont,
  },
  headerSellerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  headerSellerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.headingFont,
  },
  sellerPortalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sellerPortalBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sellerPortalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerPortalTextCol: {
    flex: 1,
  },
  sellerPortalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerPortalBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.headingFont,
  },
  sellerActiveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  sellerActiveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.4,
  },
  sellerPortalBannerSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
});

export default HomeScreen;
