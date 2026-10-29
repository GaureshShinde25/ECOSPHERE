import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  TrendingUp,
  Cpu,
  Briefcase,
  Store,
  ShoppingBag,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { GlassCard } from '../components/cards/GlassCard';
import { BusinessCard } from '../components/ui/BusinessCard';
import { ServiceCard } from '../components/cards/ServiceCard';
import { JobCard } from '../components/cards/JobCard';
import { ProductCard } from '../components/ui/ProductCard';
import { OpportunityCard } from '../components/cards/OpportunityCard';
import { DiscoverySkeleton } from '../components/common/DiscoverySkeleton';
import {
  DiscoveryFilterModal,
  DiscoveryFilterState,
  DiscoveryEntityType,
} from '../components/common/DiscoveryFilterModal';
import { businessService } from '../services/businessService';
import { serviceService } from '../services/serviceService';
import { productService } from '../services/productService';
import { jobService } from '../services/jobService';
import { opportunityService, OpportunityItem } from '../services/opportunityService';
import { trendIntelligenceService, CategoryTrendItem } from '../services/trendIntelligenceService';

export type CategoryDiscoveryType = 'services' | 'jobs' | 'businesses' | 'products' | 'opportunities';

interface CategoryDiscoveryScreenProps {
  categoryType?: CategoryDiscoveryType;
  categoryName?: string;
  city?: string;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

const CATEGORY_META: Record<
  CategoryDiscoveryType,
  { title: string; subtitle: string; icon: any; color: string; entityType: DiscoveryEntityType }
> = {
  services: {
    title: 'Professional Services',
    subtitle: 'Find trusted professionals, trades, and local services around you.',
    icon: Cpu,
    color: Theme.colors.success,
    entityType: 'service',
  },
  jobs: {
    title: 'Work & Employment',
    subtitle: 'Explore local jobs, gigs, high-demand skills, and verified employer openings.',
    icon: Briefcase,
    color: Theme.colors.primary,
    entityType: 'job',
  },
  businesses: {
    title: 'Local Businesses',
    subtitle: 'Connect with verified enterprises, workshops, and commercial outlets in your city.',
    icon: Store,
    color: Theme.colors.purple,
    entityType: 'business',
  },
  products: {
    title: 'Products & Supplies',
    subtitle: 'Browse real inventory from local merchants, fabricators, and retail partners.',
    icon: ShoppingBag,
    color: Theme.colors.orange,
    entityType: 'product',
  },
  opportunities: {
    title: 'Opportunity Discovery',
    subtitle: 'Uncover surge demand, labor market deficits, and high-momentum economic signals.',
    icon: Sparkles,
    color: Theme.colors.primary,
    entityType: 'opportunity',
  },
};

export const CategoryDiscoveryScreen: React.FC<CategoryDiscoveryScreenProps> = ({
  categoryType = 'services',
  categoryName,
  city = 'Kolkata',
  onBack,
  onNavigate,
}) => {
  const meta = CATEGORY_META[categoryType] || CATEGORY_META.services;
  const IconComponent = meta.icon;

  const [inCategorySearch, setInCategorySearch] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(categoryName);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'newest'>('relevance');

  const [items, setItems] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [trendSignal, setTrendSignal] = useState<CategoryTrendItem | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<DiscoveryFilterState>({
    city,
    category: categoryName,
  });

  const loadCategoryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeCity = filters.city || city;
      const targetCategory = selectedSubCategory || filters.category;

      switch (categoryType) {
        case 'services': {
          const srvs = await serviceService.getServices({
            city: activeCity,
            search: inCategorySearch || targetCategory || undefined,
            limit: 30,
          });
          setItems(srvs || []);
          const cats = Array.from(new Set(srvs.map((s) => s.category).filter(Boolean)));
          setSubCategories(cats);
          break;
        }

        case 'jobs': {
          const jobs = await jobService.getJobs({
            category: targetCategory,
            search: inCategorySearch || undefined,
            jobType: filters.jobType,
            workMode: filters.workMode,
            limit: 30,
          });
          setItems(jobs || []);
          const cats = Array.from(new Set(jobs.map((j) => j.category).filter(Boolean)));
          setSubCategories(cats);
          break;
        }

        case 'businesses': {
          const bizs = await businessService.getBusinesses({
            city: activeCity,
            search: inCategorySearch || undefined,
            limit: 30,
          });
          setItems(bizs || []);
          const cats = Array.from(new Set(bizs.map((b) => b.category).filter(Boolean)));
          setSubCategories(cats);
          break;
        }

        case 'products': {
          const prods = await productService.getProducts({
            city: activeCity,
            search: inCategorySearch || (targetCategory && targetCategory !== 'Products & Supplies' ? targetCategory : undefined),
            limit: 30,
          });
          setItems(prods || []);
          const cats = Array.from(new Set(prods.map((p) => p.category).filter(Boolean)));
          setSubCategories(cats);
          break;
        }

        case 'opportunities': {
          const opps = await opportunityService.getOpportunities({
            city: activeCity,
            limit: 20,
          });
          setItems(opps || []);
          const cats = Array.from(new Set(opps.map((o) => o.type).filter(Boolean)));
          setSubCategories(cats);
          break;
        }
      }

      // Check category trend momentum for city
      const trends = await trendIntelligenceService.getCategoryTrends(activeCity);
      if (trends && trends.length > 0) {
        const match = targetCategory
          ? trends.find((t) => t.category.toLowerCase().includes(targetCategory.toLowerCase()))
          : trends[0];
        setTrendSignal(match || null);
      }
    } catch (err) {
      if (__DEV__) console.warn('[CategoryDiscoveryScreen] Load error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [categoryType, city, filters, inCategorySearch, selectedSubCategory]);

  useEffect(() => {
    loadCategoryData();
  }, [loadCategoryData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCategoryData();
  };

  const handleApplyFilters = (newFilters: DiscoveryFilterState) => {
    setFilters(newFilters);
    if (newFilters.category) {
      setSelectedSubCategory(newFilters.category);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.navBtn}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{meta.title}</Text>
            <Text style={styles.headerLocation}>{filters.city || city}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <Filter size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

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
          {/* Hero Category Banner */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={[styles.heroIconBox, { backgroundColor: `${meta.color}20` }]}>
                <IconComponent size={24} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>
                  {selectedSubCategory ? `${selectedSubCategory}` : meta.title}
                </Text>
                <Text style={styles.heroDesc}>{meta.subtitle}</Text>
              </View>
            </View>

            {/* Economic Trend Signal (if available) */}
            {trendSignal && (
              <View style={styles.trendRow}>
                <TrendingUp size={13} color={Theme.colors.success} />
                <Text style={styles.trendText}>
                  Market Momentum: +{trendSignal.growthPercent}% WoW growth in {trendSignal.category}
                </Text>
              </View>
            )}
          </GlassCard>

          {/* In-Category Search Bar */}
          <View style={styles.searchBox}>
            <Search size={16} color={Theme.colors.secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={inCategorySearch}
              onChangeText={setInCategorySearch}
              placeholder={`Search within ${selectedSubCategory || meta.title}...`}
              placeholderTextColor={Theme.colors.secondaryText}
              returnKeyType="search"
            />
            {inCategorySearch.length > 0 && (
              <TouchableOpacity onPress={() => setInCategorySearch('')} style={{ padding: 4 }}>
                <X size={15} color={Theme.colors.secondaryText} />
              </TouchableOpacity>
            )}
          </View>

          {/* Sub-Category Pills */}
          {subCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subCatScroll}
            >
              <TouchableOpacity
                style={[styles.subCatChip, !selectedSubCategory && styles.subCatChipActive]}
                onPress={() => setSelectedSubCategory(undefined)}
                activeOpacity={0.75}
              >
                <Text style={[styles.subCatText, !selectedSubCategory && styles.subCatTextActive]}>
                  All {meta.title.split(' ')[0]}
                </Text>
              </TouchableOpacity>
              {subCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub;
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.subCatChip, isSelected && styles.subCatChipActive]}
                    onPress={() => setSelectedSubCategory(isSelected ? undefined : sub)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.subCatText, isSelected && styles.subCatTextActive]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Result Count and Sort Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {isLoading ? 'Loading...' : `${items.length} listing${items.length === 1 ? '' : 's'} available`}
            </Text>

            <View style={styles.sortToggle}>
              <ArrowUpDown size={12} color={Theme.colors.primary} />
              <Text style={styles.sortText}>
                {sortBy === 'relevance' ? 'Relevance' : sortBy === 'rating' ? 'Top Rated' : 'Newest'}
              </Text>
            </View>
          </View>

          {/* Skeletons */}
          {isLoading && (
            <View style={{ marginTop: 8 }}>
              <DiscoverySkeleton type="card" count={3} />
            </View>
          )}

          {/* Empty State */}
          {!isLoading && items.length === 0 && (
            <GlassCard style={styles.emptyCard}>
              <IconComponent size={36} color={Theme.colors.secondaryText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No {meta.title.toLowerCase()} found</Text>
              <Text style={styles.emptyDesc}>
                We couldn't find matching listings in {filters.city || city}. Try expanding your search
                or clearing selected filters.
              </Text>
              {(selectedSubCategory || inCategorySearch.length > 0) && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setSelectedSubCategory(undefined);
                    setInCategorySearch('');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearBtnText}>Show All in {filters.city || city}</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}

          {/* Live Listings */}
          {!isLoading && items.length > 0 && (
            <View style={styles.itemsList}>
              {categoryType === 'services' &&
                items.map((srv) => (
                  <ServiceCard
                    key={srv.id}
                    service={srv}
                    onPress={(targetSrv) => onNavigate('ServiceDetailScreen', { service: targetSrv })}
                  />
                ))}

              {categoryType === 'jobs' &&
                items.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onPress={(targetJob) => onNavigate('JobDetailsScreen', { job: targetJob })}
                  />
                ))}

              {categoryType === 'businesses' &&
                items.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    onPress={() => onNavigate('BusinessProfileScreen', { business: biz })}
                  />
                ))}

              {categoryType === 'products' && (
                <View style={styles.productsGrid}>
                  {items.map((prod) => (
                    <View key={prod.id} style={styles.gridColumn}>
                      <ProductCard
                        product={prod}
                        layout="grid"
                        onPress={(targetProd) =>
                          onNavigate('ProductDetailScreen', { product: targetProd, productId: targetProd.id })
                        }
                      />
                    </View>
                  ))}
                </View>
              )}

              {categoryType === 'opportunities' &&
                items.map((opp: OpportunityItem) => (
                  <OpportunityCard
                    key={opp.id}
                    title={opp.title}
                    category={opp.type}
                    location={opp.location?.city || city}
                    decisionScore={opp.score || 88}
                    confidence="HIGH"
                    reason={opp.reason}
                    onPress={() =>
                      onNavigate('OpportunityDetailsScreen', { opportunityId: opp.id })
                    }
                    style={{ marginBottom: 14 }}
                  />
                ))}
            </View>
          )}
        </ScrollView>

        {/* Filter Sheet */}
        <DiscoveryFilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          entityType={meta.entityType}
          activeFilters={filters}
          onApply={handleApplyFilters}
          availableCategories={subCategories}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  headerLocation: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 110,
  },
  heroCard: {
    padding: 16,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  heroDesc: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    lineHeight: 17,
    fontFamily: Theme.typography.fontFamily,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  trendText: {
    fontSize: 11,
    color: Theme.colors.success,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  subCatScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  subCatChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 24, 40, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subCatChipActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  subCatText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  subCatTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  itemsList: {
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyDesc: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: Theme.typography.fontFamily,
  },
  clearBtn: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  gridColumn: {
    width: '50%',
    paddingHorizontal: 5,
  },
});

