import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Search,
  X,
  Store,
  Wrench,
  MapPin,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  Filter,
  Check,
  Star,
  ChevronRight,
  Navigation,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  BusinessCard,
  ServiceCard,
  BusinessCardSkeleton,
  EmptyState,
} from '../components/ui';
import { businessService } from '../services/businessService';
import { productService } from '../services/productService';
import { serviceService } from '../services/serviceService';
import { tokenService } from '../services/tokenService';
import { authService } from '../services/authService';
import { Business, Product, Service } from '../types';

const { width } = Dimensions.get('window');

export interface ExploreCategoryChip {
  id: string;
  name: string;
  icon: string;
}

const EXPLORE_CATEGORIES: ExploreCategoryChip[] = [
  { id: 'all', name: 'All', icon: '📍' },
  { id: 'groceries', name: 'Smart Grocery', icon: '🛒' },
  { id: 'food', name: 'Food & Beverages', icon: '🍲' },
  { id: 'shops', name: 'Retail & Shops', icon: '🛍️' },
  { id: 'services', name: 'Services', icon: '🛠️' },
  { id: 'healthcare', name: 'Healthcare', icon: '💊' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'home', name: 'Home Services', icon: '🏠' },
  { id: 'jobs', name: 'Jobs & Gigs', icon: '💼' },
  { id: 'more', name: 'More', icon: '✨' },
];

interface ExploreScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  initialTab?: string;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({
  onNavigate,
  initialTab = 'all',
}) => {
  const [userCity, setUserCity] = useState<string>('Kolkata');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Filters
  const [filterVerified, setFilterVerified] = useState<boolean>(false);
  const [filterTopRated, setFilterTopRated] = useState<boolean>(false);

  // Live Data State
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Selected map pin for Map View
  const [selectedMapItem, setSelectedMapItem] = useState<any>(null);

  useEffect(() => {
    if (initialTab === 'opportunities') {
      onNavigate('CategoryDiscovery', {
        categoryType: 'opportunities',
        categoryName: 'Opportunities',
        city: userCity,
        returnScreen: 'Explore',
      });
    }
  }, [initialTab, onNavigate, userCity]);

  const fetchExploreData = useCallback(async () => {
    try {
      const user = (await tokenService.getUserSession()) || (await authService.getCurrentUser());
      const activeCity = user?.location || 'Kolkata';
      setUserCity(activeCity);

      const [bizRes, srvRes, prodRes] = await Promise.allSettled([
        businessService.getBusinesses({ city: activeCity, limit: 12 }),
        serviceService.getServices({ city: activeCity, limit: 10 }),
        productService.getProducts({ city: activeCity, limit: 8 }),
      ]);

      let bizList: Business[] = bizRes.status === 'fulfilled' ? (bizRes.value || []) : [];
      let srvList: Service[] = srvRes.status === 'fulfilled' ? (srvRes.value || []) : [];
      let prodList: Product[] = prodRes.status === 'fulfilled' ? (prodRes.value || []) : [];

      if (bizList.length === 0) {
        const allBiz = await businessService.getBusinesses({ limit: 10 });
        if (allBiz && allBiz.length > 0) bizList = allBiz;
      }
      if (srvList.length === 0) {
        const allSrv = await serviceService.getServices({ limit: 8 });
        if (allSrv && allSrv.length > 0) srvList = allSrv;
      }

      setBusinesses(bizList);
      setServices(srvList);
      setProducts(prodList);
      if (bizList.length > 0) setSelectedMapItem(bizList[0]);
    } catch (err) {
      if (__DEV__) console.warn('[ExploreScreen] Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExploreData();
  }, [fetchExploreData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExploreData();
  };

  // Filtered Businesses
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      if (filterVerified && !biz.verified) return false;
      if (filterTopRated && (biz.rating || 0) < 4.0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = biz.name?.toLowerCase().includes(q);
        const matchesCategory = biz.category?.toLowerCase().includes(q);
        const matchesDesc = biz.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesDesc) return false;
      }
      if (selectedCategory === 'services') return false;
      if (selectedCategory !== 'all' && selectedCategory !== 'shops') {
        const q = selectedCategory.toLowerCase();
        const matches = biz.category?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [businesses, searchQuery, selectedCategory, filterVerified, filterTopRated]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'shops') return [];
    return services.filter((srv) => {
      if (filterTopRated && (srv.rating || 0) < 4.0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = srv.title?.toLowerCase().includes(q);
        const matchesCategory = srv.category?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory) return false;
      }
      if (selectedCategory !== 'all' && selectedCategory !== 'services') {
        const q = selectedCategory.toLowerCase();
        const matches = srv.category?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [services, searchQuery, selectedCategory, filterTopRated]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      onNavigate('SearchResults', {
        query: searchQuery.trim(),
        type: 'all',
        city: userCity,
      });
    } else {
      onNavigate('Search', { city: userCity });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ========================================================
          1. SEARCH-FIRST DISCOVERY HEADER
         ======================================================== */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>Explore Local</Text>
            <Text style={styles.screenSubtitle}>
              Find trusted businesses & services around you
            </Text>
          </View>

          <TouchableOpacity
            style={styles.cityBadge}
            onPress={() => onNavigate('LocalActivity', { city: userCity })}
            activeOpacity={0.7}
          >
            <MapPin size={12} color={Theme.colors.emerald} />
            <Text style={styles.cityText}>{userCity}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar with Accessible Controls */}
        <View style={styles.searchContainer}>
          <Search size={18} color={Theme.colors.emerald} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses, stores, plumbers, repairs..."
            placeholderTextColor={Theme.colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={Theme.colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {EXPLORE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipSelected,
                ]}
                onPress={() => {
                  if (cat.id === 'groceries') {
                    onNavigate('SmartGrocery');
                  } else {
                    setSelectedCategory(cat.id);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.chipEmoji}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    isSelected && styles.chipLabelSelected,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter Pills & Map/List Toggle Bar */}
        <View style={styles.filterAndToggleRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterPill, filterVerified && styles.filterPillActive]}
              onPress={() => setFilterVerified(!filterVerified)}
              activeOpacity={0.75}
            >
              {filterVerified ? (
                <Check size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              ) : null}
              <Text
                style={[
                  styles.filterPillText,
                  filterVerified && styles.filterPillTextActive,
                ]}
              >
                Verified Only
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filterTopRated && styles.filterPillActive]}
              onPress={() => setFilterTopRated(!filterTopRated)}
              activeOpacity={0.75}
            >
              <Star
                size={12}
                color={filterTopRated ? '#FFFFFF' : '#D97706'}
                fill={filterTopRated ? '#FFFFFF' : '#D97706'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.filterPillText,
                  filterTopRated && styles.filterPillTextActive,
                ]}
              >
                4.0+ Rated
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Map / List View Toggle */}
          <View style={styles.viewToggleGroup}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}
              accessibilityLabel="List view"
            >
              <ListIcon
                size={16}
                color={viewMode === 'list' ? '#FFFFFF' : Theme.colors.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
              onPress={() => setViewMode('map')}
              activeOpacity={0.8}
              accessibilityLabel="Map view"
            >
              <MapIcon
                size={16}
                color={viewMode === 'map' ? '#FFFFFF' : Theme.colors.secondaryText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ========================================================
          2. CONTENT: LIST VIEW vs MAP VIEW
         ======================================================== */}
      {viewMode === 'map' ? (
        // MAP DISCOVERY VIEW
        <View style={styles.mapContainer}>
          {/* Simulated High-Trust Local Area Canvas */}
          <View style={styles.mapCanvas}>
            <View style={styles.mapGridPattern} />

            {/* Simulated Map Roads & Nodes */}
            <View style={styles.mapRoadHorizontal} />
            <View style={styles.mapRoadVertical} />

            {/* Pins on the map */}
            {filteredBusinesses.slice(0, 5).map((biz, idx) => {
              const isSelected = selectedMapItem?.id === biz.id;
              // Deterministic coordinates based on index
              const positions = [
                { top: '24%', left: '28%' },
                { top: '38%', left: '68%' },
                { top: '56%', left: '34%' },
                { top: '65%', left: '76%' },
                { top: '20%', left: '72%' },
              ];
              const pos = positions[idx % positions.length];

              return (
                <TouchableOpacity
                  key={biz.id}
                  style={[
                    styles.mapPinContainer,
                    { top: pos.top as any, left: pos.left as any },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMapItem(biz)}
                >
                  <View
                    style={[
                      styles.mapPinBubble,
                      isSelected && styles.mapPinBubbleActive,
                    ]}
                  >
                    <Store
                      size={14}
                      color={isSelected ? '#FFFFFF' : Theme.colors.forestGreen}
                    />
                    <Text
                      style={[
                        styles.mapPinText,
                        isSelected && styles.mapPinTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {biz.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.mapPinStem,
                      isSelected && styles.mapPinStemActive,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}

            {/* User Location Radar Marker */}
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </View>

          {/* Selected Item Floating Bottom Card */}
          {selectedMapItem ? (
            <View style={styles.mapSelectedCardWrapper}>
              <View style={styles.mapDetailCard}>
                <View style={styles.mapDetailCardLeft}>
                  <View style={styles.mapCardIconBox}>
                    <Store size={22} color={Theme.colors.forestGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapDetailTitle} numberOfLines={1}>
                      {selectedMapItem.name}
                    </Text>
                    <Text style={styles.mapDetailSub} numberOfLines={1}>
                      {selectedMapItem.category || 'Local Merchant'} • {userCity}
                    </Text>
                    <View style={styles.mapRatingRow}>
                      <Star size={12} color="#D97706" fill="#D97706" />
                      <Text style={styles.mapRatingText}>
                        {selectedMapItem.rating ? selectedMapItem.rating.toFixed(1) : '4.8'} (Verified)
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.mapDetailActionBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    onNavigate('BusinessProfileScreen', { business: selectedMapItem })
                  }
                >
                  <Text style={styles.mapDetailActionText}>Open</Text>
                  <ChevronRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        // LIST VIEW (Businesses & Services)
        <ScrollView
          contentContainerStyle={styles.scrollListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Theme.colors.emerald}
              colors={[Theme.colors.emerald]}
            />
          }
        >
          {loading ? (
            <View>
              <BusinessCardSkeleton />
              <BusinessCardSkeleton />
            </View>
          ) : (
            <>
              {/* Local Businesses Section */}
              {filteredBusinesses.length > 0 && (
                <View style={styles.resultsSection}>
                  <View style={styles.resultsSectionHeader}>
                    <Text style={styles.resultsHeading}>
                      Featured Businesses ({filteredBusinesses.length})
                    </Text>
                  </View>

                  {filteredBusinesses.map((biz) => (
                    <BusinessCard
                      key={biz.id}
                      business={biz}
                      onPress={(b) =>
                        onNavigate('BusinessProfileScreen', { business: b })
                      }
                    />
                  ))}
                </View>
              )}

              {/* Local Services Section */}
              {filteredServices.length > 0 && (
                <View style={styles.resultsSection}>
                  <View style={styles.resultsSectionHeader}>
                    <Text style={styles.resultsHeading}>
                      Nearby Services ({filteredServices.length})
                    </Text>
                  </View>

                  {filteredServices.map((srv) => (
                    <ServiceCard
                      key={srv.id}
                      service={srv}
                      onPress={(s) =>
                        onNavigate('ServiceDetailScreen', { service: s })
                      }
                      onBookPress={(s) =>
                        onNavigate('BookingService', { service: s })
                      }
                    />
                  ))}
                </View>
              )}

              {/* Empty state when filters return 0 */}
              {filteredBusinesses.length === 0 && filteredServices.length === 0 && (
                <EmptyState
                  title="No matches found nearby"
                  description={`We couldn't find any businesses or services matching your criteria in ${userCity}.`}
                  actionTitle="Clear Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setFilterVerified(false);
                    setFilterTopRated(false);
                  }}
                />
              )}
            </>
          )}

          {/* Extra bottom spacing for navigation dock */}
          <View style={{ height: 90 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border, // #E4EBE3
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 8,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  cityText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.bodyFont,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.bodyFont,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
  },
  categoryChipsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: Theme.colors.emerald, // #16A34A
    borderColor: Theme.colors.emerald,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterAndToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  filterScroll: {
    gap: 6,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  filterPillActive: {
    backgroundColor: Theme.colors.forestGreen,
    borderColor: Theme.colors.forestGreen,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginLeft: 8,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.emerald,
  },

  // List View Content
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  resultsSection: {
    marginBottom: 16,
  },
  resultsSectionHeader: {
    marginBottom: 10,
  },
  resultsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
  },

  // Map View Content
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EDF2EC',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapGridPattern: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
    borderWidth: 0.5,
    borderColor: '#16A34A',
  },
  mapRoadHorizontal: {
    position: 'absolute',
    top: '45%',
    left: 0,
    right: 0,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D7E2D6',
  },
  mapRoadVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D7E2D6',
  },
  mapPinContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  mapPinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mapPinBubbleActive: {
    backgroundColor: Theme.colors.forestGreen,
    borderColor: Theme.colors.emerald,
  },
  mapPinText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    maxWidth: 80,
  },
  mapPinTextActive: {
    color: '#FFFFFF',
  },
  mapPinStem: {
    width: 2,
    height: 8,
    backgroundColor: Theme.colors.border,
  },
  mapPinStemActive: {
    backgroundColor: Theme.colors.emerald,
  },
  userLocationMarker: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    marginLeft: 2,
    marginTop: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.emerald,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mapSelectedCardWrapper: {
    position: 'absolute',
    bottom: 84,
    left: 16,
    right: 16,
  },
  mapDetailCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mapDetailCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  mapCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
  },
  mapDetailSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
  mapRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  mapRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  mapDetailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  mapDetailActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.bodyFont,
  },
});

export default ExploreScreen;
