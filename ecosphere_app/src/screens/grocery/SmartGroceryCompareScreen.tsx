import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Store,
  Sparkles,
  TrendingDown,
  Navigation,
  CheckCircle2,
  Plus,
  ArrowRight,
  MapPin,
  Tag,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  PriceComparisonResult,
  PriceComparisonStore,
  GroceryProduct,
} from '../../services/groceryService';

interface SmartGroceryCompareScreenProps {
  initialItem?: string;
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryCompareScreen: React.FC<SmartGroceryCompareScreenProps> = ({
  initialItem = 'Milk',
  onBack,
  onNavigate,
}) => {
  const [selectedItem, setSelectedItem] = useState<string>(initialItem);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [catalog, setCatalog] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparison, setComparison] = useState<PriceComparisonResult | null>(null);
  const [addedCheapest, setAddedCheapest] = useState<boolean>(false);

  // Default user location: 19.12, 72.88
  const userLat = 19.12;
  const userLon = 72.88;

  useEffect(() => {
    const fetchCatalog = async () => {
      const items = await groceryService.getCatalog();
      setCatalog(items || []);
    };
    fetchCatalog();
  }, []);

  const loadComparison = async (itemName: string) => {
    try {
      setLoading(true);
      setAddedCheapest(false);
      const res = await groceryService.comparePrice(itemName, userLat, userLon);
      setComparison(res);
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryCompareScreen] Compare error:', err);
      Alert.alert('Error', 'Unable to fetch price comparison for this item.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      loadComparison(selectedItem);
    }
  }, [selectedItem]);

  const handleSelectProduct = (name: string) => {
    setSelectedItem(name);
    setSearchQuery('');
  };

  const handleAddCheapestToList = () => {
    if (!comparison || !comparison.lowest_price) return;
    setAddedCheapest(true);
    Alert.alert(
      'Added to List',
      `${comparison.item} at ₹${comparison.lowest_price} from ${comparison.cheapest_store} was added to your active shopping list.`,
      [
        { text: 'Keep Comparing' },
        {
          text: 'Go to List',
          onPress: () => onNavigate('SmartGroceryList'),
        },
      ]
    );
  };

  // Filtered popular products for horizontal chip row
  const popularChips = ['Milk', 'Bread', 'Eggs', 'Rice', 'Tomato', 'Butter', 'Paneer', 'Oats', 'Tea'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Price Comparison</Text>
            <View style={styles.aiTag}>
              <Sparkles size={11} color={Theme.colors.forestGreen} />
              <Text style={styles.aiTagText}>MULTI-STORE</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Real prices at D-Mart, Reliance & Big Bazaar</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog (e.g. Milk, Rice, Oats)..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Search Results Dropdown / Suggestions */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.suggestionsCard}>
            {catalog
              .filter((c) => c.item_name.toLowerCase().includes(searchQuery.toLowerCase()))
              .slice(0, 5)
              .map((prod) => (
                <TouchableOpacity
                  key={prod.item_id}
                  style={styles.suggestionRow}
                  onPress={() => handleSelectProduct(prod.item_name)}
                >
                  <Text style={styles.suggestionText}>{prod.item_name}</Text>
                  <Text style={styles.suggestionMeta}>
                    {prod.category} • ₹{prod.typical_price}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Quick Select Product Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {popularChips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, selectedItem.toLowerCase() === chip.toLowerCase() && styles.chipActive]}
              onPress={() => handleSelectProduct(chip)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedItem.toLowerCase() === chip.toLowerCase() && styles.chipTextActive,
                ]}
              >
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading Spinner */}
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Theme.colors.emerald} />
            <Text style={styles.loadingText}>Fetching multi-store prices for {selectedItem}...</Text>
          </View>
        )}

        {/* Comparison Content */}
        {!loading && comparison && (
          <>
            {/* Selected Product Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroItemName}>{comparison.item}</Text>
                  <Text style={styles.heroCategory}>
                    {comparison.category || 'Grocery'} • {comparison.unit || 'unit'}
                  </Text>
                </View>
                <View style={styles.savingsBadge}>
                  <TrendingDown size={14} color={Theme.colors.forestGreen} />
                  <Text style={styles.savingsBadgeText}>
                    Save ₹{comparison.potential_savings}
                  </Text>
                </View>
              </View>

              <View style={styles.heroMetricsRow}>
                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Lowest Price</Text>
                  <Text style={[styles.heroMetricValue, { color: Theme.colors.forestGreen }]}>
                    ₹{comparison.lowest_price}
                  </Text>
                  <Text style={styles.heroMetricSub}>at {comparison.cheapest_store}</Text>
                </View>

                <View style={styles.heroMetricDivider} />

                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Highest Price</Text>
                  <Text style={styles.heroMetricValue}>₹{comparison.highest_price}</Text>
                  <Text style={styles.heroMetricSub}>Store variation</Text>
                </View>

                <View style={styles.heroMetricDivider} />

                <View style={styles.heroMetric}>
                  <Text style={styles.heroMetricLabel}>Max Difference</Text>
                  <Text style={[styles.heroMetricValue, { color: '#D97706' }]}>
                    +₹{comparison.potential_savings}
                  </Text>
                  <Text style={styles.heroMetricSub}>Diff per unit</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addCheapestBtn, addedCheapest && styles.addCheapestBtnSuccess]}
                onPress={handleAddCheapestToList}
                activeOpacity={0.85}
              >
                {addedCheapest ? (
                  <>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.addCheapestText}>Added Cheapest to List</Text>
                  </>
                ) : (
                  <>
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addCheapestText}>
                      Add Cheapest (₹{comparison.lowest_price} at {comparison.cheapest_store}) to List
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Store Comparison Cards */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Price Breakdown Across Stores</Text>
              <Text style={styles.sectionSub}>Prices normalized to 1 unit from actual store datasets</Text>
            </View>

            {comparison.stores.map((st: PriceComparisonStore) => (
              <View
                key={st.store}
                style={[styles.storeRowCard, st.is_lowest && styles.storeRowCardLowest]}
              >
                <View style={styles.storeRowLeft}>
                  <View
                    style={[
                      styles.storeAvatar,
                      st.is_lowest ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#F1F5F9' },
                    ]}
                  >
                    <Store
                      size={20}
                      color={st.is_lowest ? Theme.colors.forestGreen : Theme.colors.secondaryText}
                    />
                  </View>
                  <View style={styles.storeMetaCol}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.storeName}>{st.store}</Text>
                      {st.is_lowest && (
                        <View style={styles.bestPriceBadge}>
                          <ShieldCheck size={12} color="#065F46" />
                          <Text style={styles.bestPriceText}>BEST PRICE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.storeDistance}>
                      <MapPin size={11} color="#64748B" /> {st.distance_km} km away (straight-line)
                    </Text>
                  </View>
                </View>

                <View style={styles.storeRowRight}>
                  <Text
                    style={[
                      styles.storePrice,
                      st.is_lowest ? { color: Theme.colors.forestGreen } : { color: Theme.colors.primaryText },
                    ]}
                  >
                    ₹{st.price}
                  </Text>
                  <Text style={styles.priceDiff}>
                    {st.is_lowest ? 'Lowest' : `+₹${st.price_diff_from_lowest} more`}
                  </Text>
                </View>
              </View>
            ))}

            {/* Price Insights Card */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Sparkles size={15} color={Theme.colors.forestGreen} />
                <Text style={styles.insightTitle}>Store Pricing Insight</Text>
              </View>
              <Text style={styles.insightText}>
                {comparison.cheapest_store} is currently ₹{comparison.potential_savings} cheaper for {comparison.item}.
                If you purchase regular household staples in bulk, purchasing from {comparison.cheapest_store} can reduce your monthly grocery bill by up to 12–18%.
              </Text>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                style={styles.fullOptimizeBtn}
                onPress={() => onNavigate('SmartGroceryOptimizer')}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.fullOptimizeText}>Optimize Full Shopping List</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  aiTagText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.primaryText,
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  suggestionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.primaryText,
  },
  suggestionMeta: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  chipsScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  chipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Theme.colors.emerald,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
  chipTextActive: {
    color: Theme.colors.forestGreen,
    fontFamily: Theme.fonts.heading,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroItemName: {
    fontSize: 22,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  heroCategory: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  heroMetric: {
    alignItems: 'center',
  },
  heroMetricLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  heroMetricValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  heroMetricSub: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroMetricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  addCheapestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  addCheapestBtnSuccess: {
    backgroundColor: Theme.colors.forestGreen,
  },
  addCheapestText: {
    fontSize: 14,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  storeRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
  },
  storeRowCardLowest: {
    borderColor: Theme.colors.emerald,
    borderWidth: 1.5,
    backgroundColor: '#FBFDFB',
  },
  storeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeMetaCol: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  bestPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  bestPriceText: {
    fontSize: 9,
    fontFamily: Theme.fonts.heading,
    color: '#065F46',
  },
  storeDistance: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  storeRowRight: {
    alignItems: 'flex-end',
  },
  storePrice: {
    fontSize: 18,
    fontFamily: Theme.fonts.heading,
  },
  priceDiff: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodyMedium,
    color: '#94A3B8',
    marginTop: 2,
  },
  insightCard: {
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 10,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  insightText: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    lineHeight: 18,
  },
  actionsBox: {
    marginBottom: 20,
  },
  fullOptimizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  fullOptimizeText: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
});

