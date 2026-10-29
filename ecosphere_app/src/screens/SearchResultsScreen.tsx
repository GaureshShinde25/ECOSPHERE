import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { GlassCard } from '../components/cards/GlassCard';
import { BusinessCard } from '../components/ui/BusinessCard';
import { ServiceCard } from '../components/cards/ServiceCard';
import { JobCard } from '../components/cards/JobCard';
import { ProductCard } from '../components/cards/ProductCard';
import { DiscoverySkeleton } from '../components/common/DiscoverySkeleton';
import {
  DiscoveryFilterModal,
  DiscoveryFilterState,
  DiscoveryEntityType,
} from '../components/common/DiscoveryFilterModal';
import { searchService, UnifiedSearchResponse } from '../services/searchService';

interface SearchResultsScreenProps {
  initialQuery?: string;
  initialType?: 'all' | 'business' | 'service' | 'product' | 'job';
  initialCity?: string;
  onBack: () => void;
  onOpenSearch: (query: string) => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SearchResultsScreen: React.FC<SearchResultsScreenProps> = ({
  initialQuery = '',
  initialType = 'all',
  initialCity,
  onBack,
  onOpenSearch,
  onNavigate,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'business' | 'service' | 'product' | 'job'>(initialType);
  const [page, setPage] = useState(1);
  const [searchData, setSearchData] = useState<UnifiedSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilterState>({
    city: initialCity,
  });

  const fetchResults = useCallback(
    async (
      searchQ: string,
      type: 'all' | 'business' | 'service' | 'product' | 'job',
      targetPage: number,
      activeFilters: DiscoveryFilterState
    ) => {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await searchService.search({
          q: searchQ,
          type,
          page: targetPage,
          limit: 15,
          city: activeFilters.city,
          category: activeFilters.category,
          jobType: activeFilters.jobType,
          workMode: activeFilters.workMode,
          isAvailable: activeFilters.isAvailable,
        });

        if (response) {
          setSearchData(response);
        } else {
          setHasError(true);
        }
      } catch (err) {
        if (__DEV__) console.warn('[SearchResultsScreen] Fetch error:', err);
        setHasError(true);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResults(query, activeType, page, filters);
  }, [query, activeType, page, filters, fetchResults]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchResults(query, activeType, page, filters);
  };

  const handleRetry = () => {
    fetchResults(query, activeType, page, filters);
  };

  const handleApplyFilters = (newFilters: DiscoveryFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRemoveFilter = (filterKey: keyof DiscoveryFilterState) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[filterKey];
      return next;
    });
    setPage(1);
  };

  const activeFilterList: Array<{ key: keyof DiscoveryFilterState; label: string }> = [];
  if (filters.city) activeFilterList.push({ key: 'city', label: filters.city });
  if (filters.category) activeFilterList.push({ key: 'category', label: filters.category });
  if (filters.jobType) activeFilterList.push({ key: 'jobType', label: filters.jobType });
  if (filters.workMode) activeFilterList.push({ key: 'workMode', label: filters.workMode });
  if (filters.priceBucket) {
    const pLabel =
      filters.priceBucket === 'under_500'
        ? '< ₹500'
        : filters.priceBucket === '500_1500'
        ? '₹500-₹1500'
        : '₹1500+';
    activeFilterList.push({ key: 'priceBucket', label: pLabel });
  }
  if (filters.verifiedOnly) activeFilterList.push({ key: 'verifiedOnly', label: 'Verified Only' });
  if (filters.isAvailable) activeFilterList.push({ key: 'isAvailable', label: 'In Stock' });

  const businesses = searchData?.businesses || [];
  const services = searchData?.services || [];
  const products = searchData?.products || [];
  const jobs = searchData?.jobs || [];

  const totalResults =
    activeType === 'business'
      ? businesses.length
      : activeType === 'service'
      ? services.length
      : activeType === 'product'
      ? products.length
      : activeType === 'job'
      ? jobs.length
      : searchData?.total || businesses.length + services.length + products.length + jobs.length;

  const hasAnyResults = businesses.length > 0 || services.length > 0 || products.length > 0 || jobs.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.navBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Search Query Pill */}
          <TouchableOpacity
            style={styles.searchBarBox}
            onPress={() => onOpenSearch(query)}
            activeOpacity={0.8}
            accessibilityLabel="Edit search query"
          >
            <Search size={16} color={Theme.colors.primary} />
            <Text style={styles.searchQueryText} numberOfLines={1}>
              {query ? `"${query}"` : 'All Categories'}
            </Text>
          </TouchableOpacity>

          {/* Filter Modal Trigger */}
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterList.length > 0 && styles.filterBtnActive]}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <Filter
              size={18}
              color={activeFilterList.length > 0 ? Theme.colors.primary : '#FFFFFF'}
            />
            {activeFilterList.length > 0 && (
              <View style={styles.filterCountDot}>
                <Text style={styles.filterCountText}>{activeFilterList.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scope Tabs */}
        <View style={styles.scopeTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scopeTabsScroll}
          >
            {[
              { id: 'all', label: 'All', count: searchData?.total },
              { id: 'business', label: 'Businesses', count: businesses.length },
              { id: 'service', label: 'Services', count: services.length },
              { id: 'product', label: 'Products', count: products.length },
              { id: 'job', label: 'Jobs', count: jobs.length },
            ].map((tab) => {
              const isSelected = activeType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.scopeTab, isSelected && styles.scopeTabActive]}
                  onPress={() => {
                    setActiveType(tab.id as any);
                    setPage(1);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.scopeTabText, isSelected && styles.scopeTabTextActive]}>
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 ? ` (${tab.count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Filter Chips Bar */}
        {activeFilterList.length > 0 && (
          <View style={styles.activeFiltersBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {activeFilterList.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={styles.activeChip}
                  onPress={() => handleRemoveFilter(f.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.activeChipText}>{f.label}</Text>
                  <X size={12} color={Theme.colors.primary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setFilters({})}
                style={styles.clearAllChip}
                activeOpacity={0.7}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Results Stream */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {/* Results Summary Bar */}
          <View style={styles.summaryBar}>
            <Text style={styles.summaryCount}>
              {isLoading ? 'Searching ECOSPHERE...' : `${totalResults} result${totalResults === 1 ? '' : 's'} found`}
            </Text>
            {query.length > 0 && (
              <Text style={styles.summaryQuery} numberOfLines={1}>
                for "{query}"
              </Text>
            )}
          </View>

          {/* Loading Skeletons */}
          {isLoading && (
            <View style={styles.skeletonContainer}>
              <DiscoverySkeleton type="card" count={3} />
            </View>
          )}

          {/* Error State */}
          {!isLoading && hasError && (
            <GlassCard style={styles.errorCard}>
              <AlertCircle size={36} color={Theme.colors.danger} />
              <Text style={styles.errorTitle}>Search Error</Text>
              <Text style={styles.errorDesc}>
                Unable to retrieve discovery results. Please check your network connection and try again.
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.8}>
                <RotateCcw size={14} color="#07111F" />
                <Text style={styles.retryBtnText}>Retry Search</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {/* Empty State */}
          {!isLoading && !hasError && !hasAnyResults && (
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconBox}>
                <Search size={32} color={Theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No matching entities found</Text>
              <Text style={styles.emptyDesc}>
                We couldn't find any {activeType === 'all' ? 'entities' : activeType} matching "{query}".
                Try clearing your filters or exploring broader search terms.
              </Text>

              {activeFilterList.length > 0 && (
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={() => setFilters({})}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearFiltersText}>Clear Applied Filters</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}

          {/* Result Entity Cards */}
          {!isLoading && !hasError && (
            <View style={styles.resultsList}>
              {/* Businesses Section */}
              {(activeType === 'all' || activeType === 'business') && businesses.length > 0 && (
                <View style={styles.sectionBlock}>
                  {activeType === 'all' && (
                    <Text style={styles.sectionBlockTitle}>Businesses ({businesses.length})</Text>
                  )}
                  {businesses.map((biz) => (
                    <BusinessCard
                      key={biz.id}
                      business={{
                        id: biz.id,
                        name: biz.name,
                        category: biz.category,
                        description: biz.description,
                        rating: biz.rating,
                        reviewCount: biz.reviewCount || 0,
                        verified: biz.verified,
                        logoUrl: biz.logoUrl,
                        coverUrl: biz.coverUrl,
                        location: { area: biz.area || biz.city, city: biz.city, latitude: 0, longitude: 0 },
                      }}
                      onPress={(b) =>
                        onNavigate('BusinessProfileScreen', { business: b })
                      }
                    />
                  ))}
                </View>
              )}

              {/* Services Section */}
              {(activeType === 'all' || activeType === 'service') && services.length > 0 && (
                <View style={styles.sectionBlock}>
                  {activeType === 'all' && (
                    <Text style={styles.sectionBlockTitle}>Services ({services.length})</Text>
                  )}
                  {services.map((srv) => (
                    <ServiceCard
                      key={srv.id}
                      service={{
                        id: srv.id,
                        businessId: srv.businessId,
                        businessName: srv.businessName,
                        providerName: srv.businessName,
                        title: srv.title,
                        description: srv.description,
                        price: srv.price,
                        duration: `${srv.durationMinutes || 60} mins`,
                        category: srv.category,
                        imageUrl: srv.imageUrl,
                        rating: 4.9,
                        reviewsCount: 42,
                        location: srv.city || 'Local',
                      }}
                      onPress={(targetSrv) => onNavigate('ServiceDetailScreen', { service: targetSrv })}
                    />
                  ))}
                </View>
              )}

              {/* Products Section */}
              {(activeType === 'all' || activeType === 'product') && products.length > 0 && (
                <View style={styles.sectionBlock}>
                  {activeType === 'all' && (
                    <Text style={styles.sectionBlockTitle}>Products ({products.length})</Text>
                  )}
                  {products.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={{
                        id: prod.id,
                        businessId: prod.businessId,
                        businessName: prod.businessName,
                        title: prod.title,
                        description: prod.description,
                        price: prod.price,
                        category: prod.category,
                        imageUrl: prod.imageUrl,
                        inStock: prod.isAvailable,
                      }}
                      onPress={(targetProd) =>
                        onNavigate('ProductDetailScreen', { product: targetProd })
                      }
                    />
                  ))}
                </View>
              )}

              {/* Jobs Section */}
              {(activeType === 'all' || activeType === 'job') && jobs.length > 0 && (
                <View style={styles.sectionBlock}>
                  {activeType === 'all' && (
                    <Text style={styles.sectionBlockTitle}>Jobs ({jobs.length})</Text>
                  )}
                  {jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={{
                        id: job.id,
                        businessId: job.businessId || 'biz_1',
                        employerName: job.employerName,
                        employerLogo:
                          'https://images.unsplash.com/photo-1572021335469-31706a17aaef?auto=format&fit=crop&w=120&q=80',
                        title: job.title,
                        category: job.category,
                        description: job.description,
                        salary: job.salaryMin
                          ? `₹${(job.salaryMin / 1000).toFixed(0)}k - ₹${((job.salaryMax || 0) / 1000).toFixed(0)}k/mo`
                          : 'Competitive Compensation',
                        location: job.location,
                        jobType: (job.jobType as any) || 'Full-time',
                        postedDate: 'Recently',
                        skills: [job.category],
                        applicantsCount: 14,
                        status: 'active',
                      }}
                      onPress={(targetJob) => onNavigate('JobDetailsScreen', { job: targetJob })}
                    />
                  ))}
                </View>
              )}

              {/* Server-Side Pagination Bar */}
              {searchData && searchData.totalPages > 1 && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    disabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                    activeOpacity={0.75}
                  >
                    <ChevronLeft size={16} color={page <= 1 ? Theme.colors.secondaryText : '#FFFFFF'} />
                    <Text style={[styles.pageBtnText, page <= 1 && styles.pageBtnTextDisabled]}>Prev</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageInfoText}>
                    Page {page} of {searchData.totalPages}
                  </Text>

                  <TouchableOpacity
                    disabled={page >= searchData.totalPages}
                    onPress={() => setPage((p) => Math.min(searchData.totalPages, p + 1))}
                    style={[styles.pageBtn, page >= searchData.totalPages && styles.pageBtnDisabled]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pageBtnText, page >= searchData.totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                    <ChevronRight size={16} color={page >= searchData.totalPages ? Theme.colors.secondaryText : '#FFFFFF'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Entity Filter Bottom Sheet Modal */}
        <DiscoveryFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          entityType={activeType}
          activeFilters={filters}
          onApply={handleApplyFilters}
          availableCategories={[
            'Technology',
            'Electrical Services',
            'Retail & Commerce',
            'Healthcare',
            'Logistics',
            'Food & Hospitality',
          ]}
        />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchBarBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
  },
  searchQueryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    flex: 1,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
  },
  filterBtnActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
  },
  filterCountDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Theme.colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#07111F',
  },
  scopeTabsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  scopeTabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scopeTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 24, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeTabActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  scopeTabText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  scopeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeFiltersBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  clearAllChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  summaryCount: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  summaryQuery: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    maxWidth: '50%',
  },
  skeletonContainer: {
    marginTop: 8,
  },
  errorCard: {
    alignItems: 'center',
    padding: 24,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  errorDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: Theme.typography.fontFamily,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#07111F',
    fontFamily: Theme.typography.fontFamily,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    marginVertical: 24,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    fontFamily: Theme.typography.fontFamily,
  },
  clearFiltersBtn: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  resultsList: {
    marginTop: 4,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    fontFamily: Theme.typography.fontFamily,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13, 24, 40, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 40,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  pageBtnTextDisabled: {
    color: Theme.colors.secondaryText,
  },
  pageInfoText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
});
